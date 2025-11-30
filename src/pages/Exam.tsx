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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

// Define Table Maps
const IITM_TABLES = { 
  assignments: 'iitm_assignments', 
  testCases: 'iitm_test_cases', 
  submissions: 'iitm_submissions' 
};

const STANDARD_TABLES = { 
  assignments: 'assignments', 
  testCases: 'test_cases', 
  submissions: 'submissions' 
};

const Exam = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  
  const selectedAssignmentId = searchParams.get('q');
  const iitmSubjectId = searchParams.get('iitm_subject');
  const examType = searchParams.get('type');
  const setName = searchParams.get('set_name'); // e.g. "Set 1"

  const activeTables = iitmSubjectId ? IITM_TABLES : STANDARD_TABLES;

  // Exam State
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [questionStatuses, setQuestionStatuses] = useState<Record<string, any>>({});
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Media State
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [videoNode, setVideoNode] = useState<HTMLVideoElement | null>(null);
  
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const MAX_VIOLATIONS = 3;

  // Fetch Questions for specific SET
  const { data: assignments = [] } = useQuery({
    queryKey: ['exam_assignments', iitmSubjectId, examType, setName],
    queryFn: async () => {
      // @ts-ignore
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
        if (setName) {
          // @ts-ignore
          query = query.eq('set_name', setName);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // --- Auto-Start on Selection Logic ---
  const handleStartExamRequest = async () => {
    try {
      // 1. Media Permission
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMediaStream(stream);
      
      // 2. Full Screen
      const elem = document.documentElement as any;
      if (elem.requestFullscreen) await elem.requestFullscreen();
      
      // 3. Create Session
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
      
      // Select first question
      if (assignments.length > 0) {
        setSearchParams(prev => {
          const p = new URLSearchParams(prev);
          // @ts-ignore
          p.set('q', assignments[0].id);
          return p;
        });
      }

    } catch (err) {
      toast({ title: "Setup Failed", description: "Camera/Mic permissions or Fullscreen required.", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (videoNode && mediaStream) {
      videoNode.srcObject = mediaStream;
      videoNode.play().catch(console.error);
    }
  }, [videoNode, mediaStream]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isExamStarted) interval = setInterval(() => setElapsedTime(p => p + 1), 1000);
    return () => clearInterval(interval);
  }, [isExamStarted]);

  const handleQuestionSelect = (id: string) => {
    setSearchParams(prev => {
        const p = new URLSearchParams(prev);
        p.set('q', id);
        return p;
    });
    setQuestionStatuses(prev => ({ ...prev, [id]: 'visited' }));
  };

  const finishExam = async () => {
    if (sessionId) {
      await supabase.from('exam_sessions').update({
        status: 'completed',
        end_time: new Date().toISOString(),
        duration_seconds: elapsedTime
      }).eq('id', sessionId);
    }
    sessionStorage.clear();
    navigate('/');
  };

  return (
    <div className="h-screen bg-[#09090b] text-white flex flex-col font-sans select-none overflow-hidden" onContextMenu={(e) => e.preventDefault()}>
      <header className="h-16 shrink-0 border-b border-red-500/20 bg-[#0c0c0e] flex items-center justify-between px-4 md:px-6 z-50 relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <Lock className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <div className="font-bold tracking-tight text-red-500">{decodeURIComponent(examType || 'Proctored')} Exam</div>
            <div className="text-[10px] text-muted-foreground">{setName}</div>
          </div>
        </div>

        {isExamStarted && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
             <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full animate-pulse">
               <div className="w-2 h-2 bg-red-500 rounded-full" />
               <span className="text-xs font-medium text-red-400">Monitoring Active</span>
             </div>
          </div>
        )}

        <div className="flex items-center gap-4">
           {isExamStarted && (
             <div className="hidden sm:flex items-center gap-2 font-mono text-sm">
               <Timer className="w-4 h-4 text-muted-foreground" />
               {new Date(elapsedTime * 1000).toISOString().substr(11, 8)}
             </div>
           )}
           <Button variant="destructive" size="sm" onClick={() => setFinishDialogOpen(true)}>Finish Exam</Button>
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
            <ResizableHandle withHandle className="hidden md:flex" />
            <ResizablePanel defaultSize={80} className="h-full overflow-auto">
               <ErrorBoundary>
                {selectedAssignmentId ? (
                   <AssignmentView 
                     key={selectedAssignmentId}
                     assignmentId={selectedAssignmentId}
                     onStatusUpdate={(status) => setQuestionStatuses(prev => ({ ...prev, [selectedAssignmentId]: status }))}
                     currentStatus={questionStatuses[selectedAssignmentId]}
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
          <div className="h-full flex flex-col items-center justify-center p-6 space-y-8 bg-[#09090b]">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold font-neuropol text-white">System Check</h1>
              <p className="text-muted-foreground">We need to verify your environment before starting.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
               <div className="bg-white/5 border border-white/10 p-6 rounded-xl text-center space-y-4">
                 <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto text-blue-400"><Video /></div>
                 <div><h3 className="font-medium">Camera & Mic</h3><p className="text-xs text-muted-foreground">Must be active</p></div>
               </div>
               <div className="bg-white/5 border border-white/10 p-6 rounded-xl text-center space-y-4">
                 <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto text-purple-400"><Maximize /></div>
                 <div><h3 className="font-medium">Full Screen</h3><p className="text-xs text-muted-foreground">Mandatory</p></div>
               </div>
               <div className="bg-white/5 border border-white/10 p-6 rounded-xl text-center space-y-4">
                 <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-400"><ShieldAlert /></div>
                 <div><h3 className="font-medium">No Switching</h3><p className="text-xs text-muted-foreground">Tab switch = Fail</p></div>
               </div>
            </div>

            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-12 py-6 text-lg" onClick={handleStartExamRequest}>
              I Agree & Start Exam
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={finishDialogOpen} onOpenChange={setFinishDialogOpen}>
        <AlertDialogContent className="bg-[#0c0c0e] border-white/10 text-white">
          <AlertDialogHeader><AlertDialogTitle>Submit Assessment?</AlertDialogTitle><AlertDialogDescription>This will end your session and submit all answers.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={finishExam} className="bg-red-600 hover:bg-red-700">Submit</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <video ref={setVideoNode} className="hidden" muted playsInline />
    </div>
  );
};

export default Exam;
