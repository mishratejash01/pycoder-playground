import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AssignmentSidebar } from '@/components/AssignmentSidebar';
import { AssignmentView } from '@/components/AssignmentView';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { ShieldAlert, AlertTriangle, Lock, CheckCircle2, Timer, Trophy, Target, Clock, Video, Maximize } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

// Types
type QuestionStatus = 'not-visited' | 'visited' | 'attempted' | 'review';

interface ViolationLog {
  timestamp: string;
  type: string;
  message: string;
}

interface QuestionMetrics {
  attempts: number;
  isCorrect: boolean;
  score: number;
}

const Exam = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const selectedAssignmentId = searchParams.get('q');
  
  // New: Get IITM params
  const iitmSubjectId = searchParams.get('iitm_subject');
  const examType = searchParams.get('type');

  // Select Active Tables
  const activeTables = iitmSubjectId ? {
    assignments: 'iitm_assignments',
    testCases: 'iitm_test_cases',
    submissions: 'iitm_submissions'
  } : {
    assignments: 'assignments',
    testCases: 'test_cases',
    submissions: 'submissions'
  };

  // State
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [questionStatuses, setQuestionStatuses] = useState<Record<string, QuestionStatus>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [violationLogs, setViolationLogs] = useState<ViolationLog[]>([]);
  const [questionMetrics, setQuestionMetrics] = useState<Record<string, QuestionMetrics>>({});

  // Media State
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [videoNode, setVideoNode] = useState<HTMLVideoElement | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [examStats, setExamStats] = useState({
    attempted: 0,
    correct: 0,
    score: 0,
    total: 0,
    accuracy: 0
  });

  const MAX_VIOLATIONS = 3;

  // Fetch Assignments with dynamic filtering
  const { data: assignments = [] } = useQuery({
    queryKey: ['exam_assignments', iitmSubjectId, examType],
    queryFn: async () => {
      let query = supabase
        .from(activeTables.assignments)
        .select('*')
        .order('title', { ascending: true });

      if (iitmSubjectId) {
        // @ts-ignore
        query = query.eq('subject_id', iitmSubjectId);
        if (examType) {
          // @ts-ignore
          query = query.eq('exam_type', decodeURIComponent(examType));
        }
      } else {
        // @ts-ignore
        query = query.order('category', { ascending: true });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // --- Media & Audio Handling ---
  const startMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240, frameRate: 15 }, 
        audio: true 
      });
      setMediaStream(stream);
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      microphone.connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;
      analyzeAudio();
      return true;
    } catch (err) {
      toast({
        title: "Permission Denied",
        description: "Camera and Microphone access are required for proctoring.",
        variant: "destructive"
      });
      return false;
    }
  };

  const analyzeAudio = () => {
    if (!analyserRef.current || !dataArrayRef.current) return;
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    let sum = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) sum += dataArrayRef.current[i];
    const volume = Math.min(100, Math.round((sum / dataArrayRef.current.length) * 2.5));
    setAudioLevel(volume);
    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  };

  useEffect(() => {
    if (videoNode && mediaStream) {
      videoNode.srcObject = mediaStream;
      videoNode.play().catch(e => console.error("Auto-play prevented:", e));
    }
  }, [videoNode, mediaStream]);

  useEffect(() => {
    return () => {
      if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
      if (audioContextRef.current) audioContextRef.current.close();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const enterFullScreen = async () => {
    const elem = document.documentElement as any;
    const requestFs = elem.requestFullscreen || elem.webkitRequestFullscreen || elem.mozRequestFullScreen || elem.msRequestFullscreen;
    if (requestFs) {
      try {
        await requestFs.call(elem);
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  };

  const handleViolation = async (type: string, message: string) => {
    if (!isExamStarted || isSubmitting || !sessionId) return;
    const violation: ViolationLog = { timestamp: new Date().toISOString(), type, message };
    setViolationLogs(prev => [...prev, violation]);
    setViolationCount(prev => {
      const newCount = prev + 1;
      supabase.from('exam_sessions').update({
          violation_count: newCount,
          violation_logs: [...violationLogs, violation] as any
        }).eq('id', sessionId).then();

      if (newCount >= MAX_VIOLATIONS) {
        submitExam("Too many violations recorded.");
        return MAX_VIOLATIONS;
      }
      toast({ title: "Proctoring Warning ⚠️", description: `Violation ${newCount}/${MAX_VIOLATIONS}: ${message}`, variant: "destructive" });
      return newCount;
    });
  };

  useEffect(() => {
    if (!isExamStarted) return;
    const handleVisibilityChange = () => { if (document.hidden) submitExam("Terminated: Tab Switching Detected"); };
    const handleFullScreenChange = () => { if (!document.fullscreenElement && !isSubmitting) submitExam("Terminated: Exited Full Screen Mode"); };
    const handleKeyDown = (e: KeyboardEvent) => {
      const isWindows = navigator.platform.includes('Win') || navigator.userAgent.includes('Windows');
      if (isWindows && (e.key === 'Meta' || e.key === 'OS')) { e.preventDefault(); submitExam("Terminated: Windows Key Usage Prohibited"); }
    };
    const preventEvents = (e: Event) => e.preventDefault();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("copy", preventEvents);
    window.addEventListener("paste", preventEvents);
    window.addEventListener("cut", preventEvents);
    window.addEventListener("contextmenu", preventEvents);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("copy", preventEvents);
      window.removeEventListener("paste", preventEvents);
      window.removeEventListener("cut", preventEvents);
      window.removeEventListener("contextmenu", preventEvents);
    };
  }, [isExamStarted, isSubmitting]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isExamStarted && !isSubmitting) {
      interval = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isExamStarted, isSubmitting]);

  const handleStartExamRequest = async () => {
    const permissionsGranted = await startMediaStream();
    if (!permissionsGranted) return;
    await setupExamSession();
  };

  const setupExamSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Authentication Required", description: "Please log in.", variant: "destructive" });
        navigate('/auth');
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
      const sessionData = {
        user_id: user.id,
        user_email: user.email || '',
        full_name: profile?.full_name || '',
        total_questions: assignments.length,
        status: 'in_progress',
        start_time: new Date().toISOString(),
      };
      const { data: session, error } = await supabase.from('exam_sessions').insert(sessionData).select().single();
      if (error) throw error;
      setSessionId(session.id);
      attemptFullScreenStart();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const attemptFullScreenStart = async () => {
    const success = await enterFullScreen();
    if (success) {
      setIsExamStarted(true);
      toast({ title: "Exam Started", description: "Monitoring Active. Good Luck." });
      if (assignments.length > 0 && !selectedAssignmentId) {
        setSearchParams(prev => {
            const p = new URLSearchParams(prev);
            // @ts-ignore
            p.set('q', assignments[0].id);
            return p;
        });
      }
    } else {
      toast({ title: "Full Screen Required", description: "Browser blocked full screen.", variant: "destructive" });
    }
  };

  const submitExam = async (reason?: string) => {
    setIsSubmitting(true);
    if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});

    const questionsAttempted = Object.keys(questionMetrics).length;
    const questionsCorrect = Object.values(questionMetrics).filter(m => m.isCorrect).length;
    const totalScore = Object.values(questionMetrics).reduce((sum, m) => sum + m.score, 0);
    const totalAttempts = Object.values(questionMetrics).reduce((sum, m) => sum + m.attempts, 0);
    const avgAttemptsPerCorrect = questionsCorrect > 0 ? totalAttempts / questionsCorrect : 0;
    const accuracy = questionsAttempted > 0 ? Math.round((questionsCorrect / questionsAttempted) * 100) : 0;

    setExamStats({ attempted: questionsAttempted, correct: questionsCorrect, score: totalScore, total: assignments.length, accuracy });

    if (sessionId) {
      await supabase.from('exam_sessions').update({
        status: reason && reason.includes("User") ? 'completed' : 'terminated',
        end_time: new Date().toISOString(),
        duration_seconds: elapsedTime,
        questions_attempted: questionsAttempted,
        questions_correct: questionsCorrect,
        total_score: totalScore,
        total_attempts: totalAttempts,
        avg_attempts_per_correct: avgAttemptsPerCorrect,
      }).eq('id', sessionId);
    }
    setSummaryOpen(true);
  };

  const handleQuestionSelect = (id: string) => {
    setSearchParams(prev => {
        const p = new URLSearchParams(prev);
        p.set('q', id);
        return p;
    });
    if (questionStatuses[id] !== 'attempted') setQuestionStatuses(prev => ({ ...prev, [id]: 'visited' }));
  };

  const handleQuestionAttempt = (questionId: string, isCorrect: boolean, score: number) => {
    setQuestionMetrics(prev => {
      const updated = {
        ...prev,
        [questionId]: {
          attempts: (prev[questionId]?.attempts || 0) + 1,
          isCorrect: isCorrect || prev[questionId]?.isCorrect || false,
          score: Math.max(score, prev[questionId]?.score || 0)
        }
      };
      return updated;
    });
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen bg-[#09090b] text-white flex flex-col font-sans select-none overflow-hidden" onContextMenu={(e) => e.preventDefault()}>
      <header className="h-16 shrink-0 border-b border-red-500/20 bg-[#0c0c0e] flex items-center justify-between px-4 md:px-6 z-50 relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <Lock className="w-4 h-4 text-red-500" />
          </div>
          <span className="font-bold tracking-tight text-red-500">
             {examType ? `${decodeURIComponent(examType)} Exam` : 'Proctored Exam Portal'}
          </span>
        </div>

        {isExamStarted && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
            <div className="relative group">
              <div className="w-24 h-14 bg-black rounded-md overflow-hidden border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)] relative">
                <video ref={setVideoNode} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_red]" />
              </div>
              <div className="absolute -bottom-4 left-0 w-full text-center">
                 <span className="text-[9px] text-red-500/70 font-mono tracking-widest uppercase">Live</span>
              </div>
            </div>
            <div className="h-14 w-2 flex flex-col-reverse gap-0.5 bg-black/50 p-0.5 rounded-sm border border-white/10">
              {[...Array(10)].map((_, i) => (
                <div key={i} className={cn("w-full flex-1 rounded-[1px] transition-all", audioLevel >= (i + 1) * 10 ? (i > 8 ? "bg-red-500" : i > 6 ? "bg-yellow-500" : "bg-green-500") : "bg-white/5")} />
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 md:gap-6">
           <div className="hidden sm:flex items-center gap-2 px-3 md:px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
            <Timer className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono font-medium text-sm">{formatTime(elapsedTime)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden md:block text-xs text-muted-foreground uppercase tracking-wider">Violations</span>
            <div className="flex gap-1">
              {[...Array(MAX_VIOLATIONS)].map((_, i) => <div key={i} className={cn("w-6 md:w-8 h-2 rounded-full transition-colors", i < violationCount ? "bg-red-500" : "bg-white/10")} />)}
            </div>
          </div>
          <Button variant="destructive" size="sm" onClick={() => setFinishDialogOpen(true)} className="gap-1 md:gap-2 px-2 md:px-4">
            <CheckCircle2 className="w-4 h-4" />
            <span className="hidden sm:inline">Finish</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 min-h-0">
        {isExamStarted ? (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-[#0c0c0e] border-r border-white/10 hidden md:block">
              <AssignmentSidebar selectedId={selectedAssignmentId} onSelect={handleQuestionSelect} questionStatuses={questionStatuses} preLoadedAssignments={assignments as any} />
            </ResizablePanel>
            <ResizableHandle withHandle className="hidden md:flex" />
            <ResizablePanel defaultSize={80} className="h-full overflow-auto">
               <ErrorBoundary>
                {selectedAssignmentId ? (
                   <AssignmentView 
                     key={selectedAssignmentId}
                     assignmentId={selectedAssignmentId}
                     onStatusUpdate={(status) => setQuestionStatuses(prev => ({ ...prev, [selectedAssignmentId]: status }))}
                     currentStatus={questionStatuses[selectedAssignmentId]}
                     onAttempt={(isCorrect: boolean, score: number) => handleQuestionAttempt(selectedAssignmentId, isCorrect, score)}
                     tables={activeTables}
                   />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <Lock className="w-12 h-12 mb-4 opacity-20" />
                    <p>Select a question to begin</p>
                  </div>
                )}
               </ErrorBoundary>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground animate-pulse">Waiting for proctor authorization...</p>
          </div>
        )}
      </div>

      {/* Entry Dialog */}
      <Dialog open={!isExamStarted} onOpenChange={() => {}}>
        <DialogContent className="bg-[#0c0c0e] border-white/10 text-white sm:max-w-3xl [&>button]:hidden overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="pb-4 border-b border-white/10">
            <DialogTitle className="text-3xl font-bold text-center">Exam Instructions</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">Read carefully before proceeding.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-6 px-2 custom-scrollbar">
             <div className="flex items-center gap-4 bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl mb-8">
               <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0"><Video className="w-5 h-5 text-blue-400" /></div>
               <div><h4 className="font-semibold text-blue-100">Proctoring Active</h4><p className="text-sm text-blue-300/80">Camera, mic, and screen activity are monitored.</p></div>
             </div>
             <div className="grid md:grid-cols-2 gap-6">
               <div className="space-y-4"><h3 className="text-lg font-semibold flex items-center gap-2 text-green-400"><CheckCircle2 className="w-5 h-5" />Do's</h3>
                 <ul className="space-y-3">{["Well-lit room", "Face visible", "Full-screen mode"].map((x,i) => <li key={i} className="flex gap-3 text-sm text-muted-foreground"><div className="w-1.5 h-1.5 rounded-full bg-green-500/50 mt-1.5 shrink-0" />{x}</li>)}</ul>
               </div>
               <div className="space-y-4"><h3 className="text-lg font-semibold flex items-center gap-2 text-red-400"><AlertTriangle className="w-5 h-5" />Don'ts</h3>
                 <ul className="space-y-3">{["Switch tabs", "Exit full-screen", "Copy/Paste"].map((x,i) => <li key={i} className="flex gap-3 text-sm text-muted-foreground"><div className="w-1.5 h-1.5 rounded-full bg-red-500/50 mt-1.5 shrink-0" />{x}</li>)}</ul>
               </div>
             </div>
             <div className="mt-8 bg-red-500/5 border border-red-500/20 p-4 rounded-xl">
               <h4 className="flex items-center gap-2 font-semibold text-red-400 mb-2"><ShieldAlert className="w-5 h-5" />Immediate Termination Policy</h4>
               <p className="text-sm text-red-300/70">The exam will terminate if you switch tabs, exit full-screen, or use prohibited shortcuts.</p>
             </div>
          </div>
          <DialogFooter className="pt-4 border-t border-white/10 sm:justify-between gap-4">
            <Button variant="ghost" onClick={() => navigate('/')} className="hover:bg-white/5">Back to Home</Button>
            {!sessionId ? (
                <Button className="bg-primary hover:bg-primary/90 text-white px-8" onClick={handleStartExamRequest}>I Understand & Start Exam</Button>
            ) : (
                <Button className="bg-green-600 hover:bg-green-700 text-white px-8 animate-pulse" onClick={attemptFullScreenStart}><Maximize className="w-4 h-4 mr-2" />Enter Exam (Full Screen)</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Finish Dialog */}
      <AlertDialog open={finishDialogOpen} onOpenChange={setFinishDialogOpen}>
        <AlertDialogContent className="bg-[#0c0c0e] border-white/10 text-white">
          <AlertDialogHeader><AlertDialogTitle>Finish Exam?</AlertDialogTitle><AlertDialogDescription className="text-muted-foreground">This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="bg-transparent border-white/10 hover:bg-white/5 hover:text-white">Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { setFinishDialogOpen(false); submitExam("User initiated"); }} className="bg-red-600 hover:bg-red-700 text-white border-none">Yes, Finish</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Summary Dialog */}
      <Dialog open={summaryOpen} onOpenChange={() => {}}>
        <DialogContent className="bg-[#0c0c0e] border-white/10 text-white sm:max-w-md [&>button]:hidden">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4 border border-green-500/20"><Trophy className="w-8 h-8 text-green-500" /></div>
            <DialogTitle className="text-2xl text-center">Exam Completed</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">Responses recorded.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-6">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col items-center justify-center gap-1"><CheckCircle2 className="w-5 h-5 text-green-500 mb-1" /><span className="text-2xl font-bold">{examStats.correct} / {examStats.total}</span><span className="text-[10px] uppercase text-muted-foreground">Correct</span></div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col items-center justify-center gap-1"><Target className="w-5 h-5 text-blue-500 mb-1" /><span className="text-2xl font-bold">{examStats.attempted}</span><span className="text-[10px] uppercase text-muted-foreground">Attempted</span></div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col items-center justify-center gap-1"><Clock className="w-5 h-5 text-orange-500 mb-1" /><span className="text-xl font-bold font-mono">{formatTime(elapsedTime)}</span><span className="text-[10px] uppercase text-muted-foreground">Time</span></div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col items-center justify-center gap-1"><div className="text-primary font-bold text-lg mb-1">{examStats.accuracy}%</div><span className="text-[10px] uppercase text-muted-foreground">Accuracy</span></div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center"><div className="text-sm text-blue-200">Total Score</div><div className="text-3xl font-bold text-blue-400 mt-1">{examStats.score.toFixed(0)}</div></div>
          <DialogFooter className="sm:justify-center mt-4">
            <Button className="w-full bg-white text-black hover:bg-gray-200" onClick={() => { sessionStorage.clear(); navigate('/'); }}>Return to Home</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Exam;
