import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AssignmentSidebar } from '@/components/AssignmentSidebar';
import { AssignmentView } from '@/components/AssignmentView';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShieldAlert, Lock, Timer, Video, Maximize, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

// Define Table Maps
const IITM_TABLES = { assignments: 'iitm_assignments', testCases: 'iitm_test_cases', submissions: 'iitm_submissions' };
const STANDARD_TABLES = { assignments: 'assignments', testCases: 'test_cases', submissions: 'submissions' };

interface QuestionMetrics {
  attempts: number;
  isCorrect: boolean;
  score: number;
  timeSpent: number;
}

const Exam = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  
  const selectedAssignmentId = searchParams.get('q');
  const iitmSubjectId = searchParams.get('iitm_subject');
  const examType = searchParams.get('type');
  const setName = searchParams.get('set_name');
  const activeTables = iitmSubjectId ? IITM_TABLES : STANDARD_TABLES;

  // --- State ---
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false); // New Checkbox State
  const [violationCount, setViolationCount] = useState(0);
  const [questionStatuses, setQuestionStatuses] = useState<Record<string, any>>({});
  
  // Timers & Metrics
  const [elapsedTime, setElapsedTime] = useState(0); 
  const [questionMetrics, setQuestionMetrics] = useState<Record<string, QuestionMetrics>>({});

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  
  // Media State
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [videoNode, setVideoNode] = useState<HTMLVideoElement | null>(null);
  
  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentQuestionRef = useRef<string | null>(selectedAssignmentId);

  const MAX_VIOLATIONS = 3;

  // --- Data Fetching ---
  const { data: assignments = [] } = useQuery({
    queryKey: ['exam_assignments', iitmSubjectId, examType, setName],
    queryFn: async () => {
      // @ts-ignore
      let query = supabase.from(activeTables.assignments).select('*').order('title', { ascending: true });
      if (iitmSubjectId) {
        // @ts-ignore
        query = query.eq('subject_id', iitmSubjectId);
        if (examType) query = query.eq('exam_type', decodeURIComponent(examType));
        if (setName) query = query.eq('set_name', setName);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    currentQuestionRef.current = selectedAssignmentId;
  }, [selectedAssignmentId]);

  // --- Media & Audio Logic ---
  const startMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240, frameRate: 15 }, 
        audio: true 
      });
      setMediaStream(stream);
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;
      
      analyzeAudio();
      return true;
    } catch (err) {
      console.error("Media Error:", err);
      toast({ title: "Permission Denied", description: "Camera/Mic access is mandatory.", variant: "destructive" });
      return false;
    }
  };

  const analyzeAudio = () => {
    if (!analyserRef.current || !dataArrayRef.current) return;
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    let sum = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      sum += dataArrayRef.current[i];
    }
    const average = sum / dataArrayRef.current.length;
    const adjustedAverage = Math.max(0, average - 20); 
    const volume = Math.min(100, Math.round(adjustedAverage * 3)); 
    
    setAudioLevel(volume);
    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  };

  const enterFullScreen = async () => {
    const elem = document.documentElement as any;
    if (elem.requestFullscreen) {
      await elem.requestFullscreen();
      return true;
    }
    return false;
  };

  const handleViolation = async (type: string, message: string) => {
    if (!isExamStarted || isSubmitting) return;
    
    const newCount = violationCount + 1;
    setViolationCount(newCount);

    if (sessionId) {
      supabase.from('exam_sessions').update({ violation_count: newCount }).eq('id', sessionId).then();
    }

    if (newCount >= MAX_VIOLATIONS) {
      finishExam("Terminated: Max Violations Reached");
    } else {
      toast({ title: "⚠️ Violation Alert", description: `Strike ${newCount}/${MAX_VIOLATIONS}: ${message}`, variant: "destructive", duration: 5000 });
    }
  };

  // --- Strict Event Listeners ---
  useEffect(() => {
    if (!isExamStarted) return;

    const handleVisibility = () => { if (document.hidden) handleViolation("Tab Switch", "Tab switching detected."); };
    const handleFullScreen = () => { if (!document.fullscreenElement && !isSubmitting) finishExam("Terminated: Fullscreen Exited"); };
    
    const handleKeys = (e: KeyboardEvent) => {
      if (e.metaKey || e.key === 'Meta' || e.key === 'Escape' || e.key === 'OS' || (e.altKey && e.key === 'Tab')) {
         e.preventDefault();
         handleViolation("Prohibited Key", "Restricted Key Press");
      }
    };
    const prevent = (e: Event) => e.preventDefault();

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("fullscreenchange", handleFullScreen);
    document.addEventListener("keydown", handleKeys);
    window.addEventListener("copy", prevent);
    window.addEventListener("paste", prevent);
    window.addEventListener("contextmenu", prevent);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("fullscreenchange", handleFullScreen);
      document.removeEventListener("keydown", handleKeys);
      window.removeEventListener("copy", prevent);
      window.removeEventListener("paste", prevent);
      window.removeEventListener("contextmenu", prevent);
    };
  }, [isExamStarted, isSubmitting, violationCount]);

  useEffect(() => {
    if (videoNode && mediaStream) {
      videoNode.srcObject = mediaStream;
      videoNode.play().catch(console.error);
    }
  }, [videoNode, mediaStream]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isExamStarted && !isSubmitting) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
        if (currentQuestionRef.current) {
          const qId = currentQuestionRef.current;
          setQuestionMetrics(prev => ({
            ...prev,
            [qId]: {
              ...prev[qId],
              attempts: prev[qId]?.attempts || 0,
              isCorrect: prev[qId]?.isCorrect || false,
              score: prev[qId]?.score || 0,
              timeSpent: (prev[qId]?.timeSpent || 0) + 1
            }
          }));
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isExamStarted, isSubmitting]);

  // --- Handlers ---

  const handleStartExamRequest = async () => {
    if (!rulesAccepted) {
      toast({ title: "Agreement Required", description: "Please accept the exam rules to proceed.", variant: "destructive" });
      return;
    }

    const perms = await startMediaStream();
    if (!perms) return;
    const fs = await enterFullScreen();
    if (!fs) { toast({ title: "Full Screen Required", variant: "destructive" }); return; }
    
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/auth'); return; }
      
      const { data: session } = await supabase.from('exam_sessions').insert({
        user_id: user.id,
        total_questions: assignments.length,
        status: 'in_progress',
        start_time: new Date().toISOString()
      }).select().single();
      
      if (session) setSessionId(session.id);
      setIsExamStarted(true);
      
      if (assignments.length > 0) {
        setSearchParams(prev => { const p = new URLSearchParams(prev); p.set('q', assignments[0].id); return p; });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to start session.", variant: "destructive" });
    }
  };

  const handleQuestionAttempt = (qId: string, isCorrect: boolean, score: number) => {
    setQuestionMetrics(prev => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        attempts: (prev[qId]?.attempts || 0) + 1,
        isCorrect: isCorrect || prev[qId]?.isCorrect || false,
        score: Math.max(score, prev[qId]?.score || 0)
      }
    }));
  };

  const finishExam = (reason?: string) => {
    setIsSubmitting(true);
    setFinishDialogOpen(false);
    
    if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});

    const qIds = Object.keys(questionMetrics);
    const correctCount = Object.values(questionMetrics).filter(m => m.isCorrect).length;
    const totalScore = Object.values(questionMetrics).reduce((acc, curr) => acc + curr.score, 0);
    const totalMaxScore = assignments.reduce((acc: number, curr: any) => acc + (curr.max_score || 0), 0);
    const accuracy = qIds.length > 0 ? Math.round((correctCount / qIds.length) * 100) : 0;

    const questionDetails = assignments.map((a: any) => {
      const m = questionMetrics[a.id] || { attempts: 0, isCorrect: false, score: 0, timeSpent: 0 };
      return {
        id: a.id,
        title: a.title,
        status: m.attempts === 0 ? 'Skipped' : (m.isCorrect ? 'Correct' : 'Incorrect'),
        timeSpent: m.timeSpent || 0,
        score: m.score,
        attempts: m.attempts
      };
    });

    const resultsPayload = {
      stats: {
        score: totalScore,
        totalScore: totalMaxScore || (assignments.length * 100),
        accuracy: accuracy,
        correct: correctCount,
        totalQuestions: assignments.length,
        attempted: qIds.length
      },
      questionDetails,
      terminationReason: reason || null,
      totalTime: elapsedTime
    };

    if (sessionId) {
      supabase.from('exam_sessions').update({
        status: reason ? 'terminated' : 'completed',
        end_time: new Date().toISOString(),
        duration_seconds: elapsedTime,
        questions_attempted: qIds.length,
        questions_correct: correctCount,
        total_score: totalScore
      }).eq('id', sessionId).then();
    }
    
    navigate('/exam/result', { state: resultsPayload });
  };

  const formatTime = (s: number) => new Date(s * 1000).toISOString().substr(11, 8);

  return (
    <div className="h-screen bg-[#09090b] text-white flex flex-col font-sans select-none overflow-hidden" onContextMenu={e => e.preventDefault()}>
      <header className="h-16 shrink-0 border-b border-red-500/20 bg-[#0c0c0e] flex items-center justify-between px-4 md:px-6 z-50 relative">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded bg-red-500/10 flex items-center justify-center border border-red-500/20"><Lock className="w-4 h-4 text-red-500" /></div>
           <div><div className="font-bold text-red-500">{decodeURIComponent(examType || 'Proctored')} Exam</div><div className="text-[10px] text-muted-foreground">{setName}</div></div>
        </div>

        {isExamStarted && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
            <div className="relative group">
              <div className="w-24 h-16 bg-black rounded-md overflow-hidden border border-red-500/30 relative shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                <video ref={setVideoNode} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_red]" />
              </div>
              <div className="absolute -bottom-4 left-0 w-full text-center"><span className="text-[9px] text-red-500/70 font-mono uppercase">REC</span></div>
            </div>
            <div className="h-16 w-3 flex flex-col-reverse gap-0.5 bg-black/50 p-0.5 rounded-sm border border-white/10">
              {[...Array(12)].map((_, i) => <div key={i} className={cn("w-full flex-1 rounded-[1px] transition-all duration-75", audioLevel >= (i + 1) * 8 ? (i > 9 ? "bg-red-500" : i > 6 ? "bg-yellow-500" : "bg-green-500") : "bg-white/5")} />)}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
           {isExamStarted && <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 font-mono text-sm"><Timer className="w-4 h-4 text-muted-foreground" />{formatTime(elapsedTime)}</div>}
           <div className="flex items-center gap-1 border border-white/10 bg-white/5 px-2 py-1 rounded"><span className="text-[10px] text-muted-foreground uppercase">Strikes</span><div className="flex gap-1">{[...Array(MAX_VIOLATIONS)].map((_, i) => <div key={i} className={cn("w-1.5 h-4 rounded-full transition-colors", i < violationCount ? "bg-red-600 shadow-[0_0_5px_red]" : "bg-white/20")} />)}</div></div>
           <Button variant="destructive" size="sm" onClick={() => setFinishDialogOpen(true)}>Finish</Button>
        </div>
      </header>

      <div className="flex-1 min-h-0">
        {isExamStarted ? (
          <ResizablePanelGroup direction="horizontal" className="h-full">
             <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-[#0c0c0e] border-r border-white/10 hidden md:block">
               <AssignmentSidebar 
                  selectedId={selectedAssignmentId} 
                  onSelect={handleQuestionSelect} 
                  questionStatuses={questionStatuses} 
                  preLoadedAssignments={assignments as any} 
                />
             </ResizablePanel>
             <ResizableHandle withHandle className="hidden md:flex bg-black border-l border-r border-white/10 w-1.5" />
             <ResizablePanel defaultSize={80} className="h-full overflow-auto">
               <ErrorBoundary>
                 {selectedAssignmentId ? (
                   <AssignmentView 
                     key={selectedAssignmentId}
                     assignmentId={selectedAssignmentId}
                     onStatusUpdate={(status) => setQuestionStatuses(prev => ({ ...prev, [selectedAssignmentId]: status }))}
                     currentStatus={questionStatuses[selectedAssignmentId]}
                     tables={activeTables}
                     disableCopyPaste={true}
                     onAttempt={(isCorrect, score) => handleQuestionAttempt(selectedAssignmentId, isCorrect, score)}
                   />
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center text-muted-foreground"><Lock className="w-16 h-16 mb-4 opacity-20" /><p>Select a question to begin</p></div>
                 )}
               </ErrorBoundary>
             </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-6 space-y-8 bg-[#09090b]">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 border border-white/10 mb-2">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold font-neuropol text-white">Instructions & Rules</h1>
              <p className="text-muted-foreground">Please read carefully before proceeding.</p>
            </div>
            
            <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Instructions Panel */}
              <div className="bg-[#0c0c0e] border border-white/10 rounded-2xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-white/10 bg-white/5 font-medium text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400" /> Exam Policy
                </div>
                <ScrollArea className="flex-1 h-[300px] p-6 text-sm text-gray-300 space-y-4 leading-relaxed">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-white mb-1">1. Environment</h4>
                      <p>You must be in a quiet, private room. No other people are permitted. Lighting must be sufficient for your face to be visible.</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">2. System Requirements</h4>
                      <ul className="list-disc pl-4 space-y-1 text-gray-400">
                        <li>Webcam and Microphone must remain active.</li>
                        <li>Full-screen mode is mandatory.</li>
                        <li>No secondary monitors allowed.</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">3. Prohibited Actions</h4>
                      <ul className="list-disc pl-4 space-y-1 text-red-300/80">
                        <li>Switching tabs or windows (Alt+Tab, Win, etc.).</li>
                        <li>Copying, pasting, or using right-click.</li>
                        <li>Exiting full-screen mode.</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">4. Termination</h4>
                      <p>Accumulating <strong>3 violations</strong> (strikes) will result in immediate termination of the exam session.</p>
                    </div>
                  </div>
                </ScrollArea>
              </div>

              {/* System Check Panel */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center">
                     <Video className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                     <h3 className="font-medium text-sm">Webcam</h3>
                     <p className="text-xs text-green-400 mt-1 flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3" /> Ready</p>
                   </div>
                   <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center">
                     <Maximize className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                     <h3 className="font-medium text-sm">Fullscreen</h3>
                     <p className="text-xs text-muted-foreground mt-1">Required</p>
                   </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-yellow-200/80">
                    <strong className="block text-yellow-500 mb-1">Warning</strong>
                    Do not attempt to resize the browser or switch applications. The system logs all interruptions.
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      id="terms" 
                      checked={rulesAccepted} 
                      onCheckedChange={(c) => setRulesAccepted(c as boolean)} 
                      className="mt-1 border-white/30 data-[state=checked]:bg-primary data-[state=checked]:text-black"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label htmlFor="terms" className="text-sm font-medium text-white cursor-pointer">
                        I agree to the exam rules and regulations.
                      </label>
                      <p className="text-xs text-muted-foreground">
                        I understand that violations will be recorded and may lead to disqualification.
                      </p>
                    </div>
                  </div>

                  <Button 
                    size="lg" 
                    className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-lg font-semibold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleStartExamRequest}
                    disabled={!rulesAccepted}
                  >
                    Start Exam
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={finishDialogOpen} onOpenChange={setFinishDialogOpen}>
        <AlertDialogContent className="bg-[#0c0c0e] border-white/10 text-white">
          <AlertDialogHeader><AlertDialogTitle>Submit Assessment?</AlertDialogTitle><AlertDialogDescription>End session and submit answers.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => finishExam("User Initiated")} className="bg-red-600 hover:bg-red-700">Submit</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <video ref={setVideoNode} className="hidden" muted playsInline />
    </div>
  );
};

export default Exam;
