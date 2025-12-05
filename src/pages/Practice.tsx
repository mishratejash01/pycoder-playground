import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AssignmentSidebar } from '@/components/AssignmentSidebar';
import { AssignmentView } from '@/components/AssignmentView';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Timer, LayoutGrid, Home, Infinity as InfinityIcon, ArrowRight, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

export type QuestionStatus = 'not-visited' | 'visited' | 'attempted' | 'review';

const IITM_TABLES = { assignments: 'iitm_assignments', testCases: 'iitm_test_cases', submissions: 'iitm_submissions' };
const STANDARD_TABLES = { assignments: 'assignments', testCases: 'test_cases', submissions: 'submissions' };

const Practice = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const iitmSubjectId = searchParams.get('iitm_subject');
  const categoryParam = searchParams.get('category');
  const limitParam = searchParams.get('limit');
  const selectedAssignmentId = searchParams.get('q');
  const mode = searchParams.get('mode'); 
  
  const timerParam = parseInt(searchParams.get('timer') || '0');
  const hasTimeLimit = timerParam > 0;
  const timeLimitSeconds = timerParam * 60;

  const activeTables = iitmSubjectId ? IITM_TABLES : STANDARD_TABLES;
  const [questionStatuses, setQuestionStatuses] = useState<Record<string, QuestionStatus>>({});
  const { toast } = useToast();
  
  const [elapsedTime, setElapsedTime] = useState(0); 
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);

  // --- QUERY ---
  const { data: assignments = [] } = useQuery({
    queryKey: [activeTables.assignments, iitmSubjectId, categoryParam, limitParam, mode], 
    queryFn: async () => {
      // @ts-ignore
      let query = supabase.from(activeTables.assignments).select('id, title, category, expected_time');
      
      // Note: We always fetch all assignments for the context to support navigation (Next button)
      if (iitmSubjectId) {
        // @ts-ignore
        query = query.eq('subject_id', iitmSubjectId);
        if (categoryParam) {
          // @ts-ignore
          query = query.eq('category', categoryParam);
        }
      }
      const { data, error } = await query;
      if (error) throw error;
      
      let result = data || [];
      return result.sort((a, b) => a.title.localeCompare(b.title));
    },
  });

  // Ensure 'q' param is set initially
  useEffect(() => {
    if (assignments.length > 0 && !selectedAssignmentId) {
      setSearchParams(prev => {
        const p = new URLSearchParams(prev);
        // @ts-ignore
        p.set('q', assignments[0].id);
        return p;
      });
    }
  }, [assignments, selectedAssignmentId, setSearchParams]);

  // --- TIMER LOGIC ---
  useEffect(() => {
    const interval = setInterval(() => setElapsedTime((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = () => {
    if (!hasTimeLimit) {
      const m = Math.floor(elapsedTime / 60);
      const s = elapsedTime % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    const remaining = timeLimitSeconds - elapsedTime;
    if (remaining >= 0) {
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    } else {
      const overtime = Math.abs(remaining);
      const m = Math.floor(overtime / 60);
      const s = overtime % 60;
      return `+${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
  };

  const isOvertime = hasTimeLimit && elapsedTime > timeLimitSeconds;

  // --- HANDLERS ---
  const handleQuestionSelect = (id: string) => {
    setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.set('q', id);
        return newParams;
    });
    if (questionStatuses[id] !== 'attempted' && questionStatuses[id] !== 'review') {
      setQuestionStatuses(prev => ({ ...prev, [id]: 'visited' }));
    }
  };

  const handleNextQuestion = () => {
    if (!assignments.length) return;
    const currentIndex = assignments.findIndex((a: any) => a.id === selectedAssignmentId);
    if (currentIndex !== -1 && currentIndex < assignments.length - 1) {
      const nextId = assignments[currentIndex + 1].id;
      handleQuestionSelect(nextId);
    } else {
      toast({ description: "You are on the last question.", duration: 2000 });
    }
  };

  const handleExitEnvironment = () => setIsExitDialogOpen(true);
  const confirmExit = () => { sessionStorage.clear(); navigate('/'); };

  // --- SIDEBAR DATA FILTERING ---
  // If NOT Proctored (i.e. Practice), only pass the currently selected question to the sidebar.
  // We use flatList mode for Practice to remove accordion clutter.
  // If Proctored, we pass all questions and use accordion mode.
  const sidebarAssignments = (mode === 'proctored') 
    ? assignments 
    : assignments.filter((a: any) => a.id === selectedAssignmentId);

  return (
    <div className="h-screen flex flex-col bg-[#09090b] text-white overflow-hidden selection:bg-primary/20">
      <header className="border-b border-white/10 bg-[#09090b] px-4 py-3 flex items-center justify-between z-50 shadow-md shrink-0 h-16">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-muted-foreground hover:text-white hover:bg-white/10"><Home className="w-5 h-5" /></Button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <LayoutGrid className="w-4 h-4 text-primary" />
            <h1 className="text-sm font-bold tracking-tight text-primary hidden sm:block">
              {mode === 'proctored' ? 'Proctored Exam' : 'Practice Session'}
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-sm font-bold transition-all duration-500",
            isOvertime 
              ? "bg-red-950/30 border-red-500/50 text-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.3)]" 
              : "bg-black/40 border-white/10 text-muted-foreground"
          )}>
            {hasTimeLimit ? <Timer className="w-4 h-4" /> : <InfinityIcon className="w-4 h-4" />}
            <span>{formatTimer()}</span>
            {isOvertime && <span className="text-[10px] uppercase font-sans tracking-wide ml-1">Overtime</span>}
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleNextQuestion} 
            className="gap-2 border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            Next <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-[#0c0c0e] border-r border-white/10 flex flex-col">
            <AssignmentSidebar
              selectedId={selectedAssignmentId}
              onSelect={handleQuestionSelect}
              questionStatuses={questionStatuses}
              preLoadedAssignments={sidebarAssignments as any}
              flatList={mode !== 'proctored'} // Enable flat list for Practice mode
            />
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-white/5 hover:bg-primary/50 transition-colors w-1" />
          <ResizablePanel defaultSize={80} className="bg-[#09090b] relative">
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
                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground"><LayoutGrid className="w-10 h-10 mb-4 opacity-20" /><p>Select a question to begin</p></div>
              )}
            </ErrorBoundary>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <Dialog open={isExitDialogOpen} onOpenChange={setIsExitDialogOpen}>
        <DialogContent className="bg-[#0c0c0e] border-white/10 text-white sm:max-w-md">
          <DialogHeader><DialogTitle>End Practice Session?</DialogTitle><DialogDescription>Your progress for this session will be cleared.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="ghost" onClick={() => setIsExitDialogOpen(false)}>Cancel</Button><Button onClick={confirmExit} variant="destructive">End Session</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Practice;
