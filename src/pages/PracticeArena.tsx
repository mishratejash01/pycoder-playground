import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AssignmentSidebar } from '@/components/AssignmentSidebar';
import { AssignmentView } from '@/components/AssignmentView';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Timer, LogOut, LayoutGrid, Home, Infinity as InfinityIcon, Menu, X, ChevronRight, Terminal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { FolderSticker } from '@/components/practice/FolderSticker';

const IITM_TABLES = { assignments: 'iitm_assignments', testCases: 'iitm_test_cases', submissions: 'iitm_submissions' };
const STANDARD_TABLES = { assignments: 'assignments', testCases: 'test_cases', submissions: 'submissions' };

// --- Styled Sub-components ---

const LevelBadge = ({ level, active = true }: { level: string; active?: boolean }) => {
  const getDotClass = () => {
    const l = level.toLowerCase();
    if (l.includes('easy')) return 'bg-[#00ffa3] shadow-[0_0_12px_2px_#00ffa3]';
    if (l.includes('medium')) return 'bg-[#f39233] shadow-[0_0_12px_2px_#f39233]';
    return 'bg-[#ff4d4d] shadow-[0_0_12px_2px_#ff4d4d]';
  };

  return (
    <div className={cn("flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[1.5px]", active ? "text-white" : "text-[#555]")}>
      <div className={cn("w-[7px] h-[7px] rounded-full", getDotClass(), !active && "opacity-30 shadow-none")} />
      {level}
    </div>
  );
};

const TacticalSwitch = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
  <div 
    onClick={onClick}
    className={cn(
      "w-[52px] h-[26px] bg-[#0a0a0a] border border-[#222] relative cursor-pointer overflow-hidden transition-colors",
      on && "border-[#94591f]"
    )}
  >
    <div className={cn(
      "absolute top-1 w-5 h-4 bg-[#252525] border border-[#333] transition-all duration-300 ease-[cubic-bezier(0.19,1,0.22,1)]",
      on ? "left-[26px] bg-[#f39233] border-black shadow-[0_0_15px_rgba(243,146,51,0.4)]" : "left-1"
    )} />
  </div>
);

const Practice = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  const iitmSubjectId = searchParams.get('iitm_subject');
  const categoryParam = searchParams.get('category');
  const limitParam = searchParams.get('limit');
  const selectedAssignmentId = searchParams.get('q');
  
  const timerParam = parseInt(searchParams.get('timer') || '0');
  const hasTimeLimit = timerParam > 0;
  const timeLimitSeconds = timerParam * 60;

  const activeTables = iitmSubjectId ? IITM_TABLES : STANDARD_TABLES;
  const [questionStatuses, setQuestionStatuses] = useState<Record<string, string>>({});
  const [elapsedTime, setElapsedTime] = useState(0); 
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [freeMode, setFreeMode] = useState(true);

  const { data: assignments = [] } = useQuery({
    queryKey: [activeTables.assignments, iitmSubjectId, categoryParam, limitParam, selectedAssignmentId], 
    queryFn: async () => {
      let query = supabase.from(activeTables.assignments as any).select('id, title, category, expected_time, is_unlocked, difficulty');
      if (selectedAssignmentId) query = query.eq('id', selectedAssignmentId);
      else if (iitmSubjectId) {
        query = query.eq('subject_id', iitmSubjectId);
        if (categoryParam) query = query.eq('category', categoryParam);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).sort((a: any, b: any) => a.title.localeCompare(b.title));
    },
  });

  useEffect(() => {
    const interval = setInterval(() => setElapsedTime((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = () => {
    const time = hasTimeLimit ? timeLimitSeconds - elapsedTime : elapsedTime;
    const absTime = Math.abs(time);
    const m = Math.floor(absTime / 60).toString().padStart(2, '0');
    const s = (absTime % 60).toString().padStart(2, '0');
    return `${time < 0 ? '+' : ''}${m}:${s}`;
  };

  const handleQuestionSelect = (id: string) => {
    setSearchParams(prev => {
        const p = new URLSearchParams(prev);
        p.set('q', id);
        return p;
    });
    setIsSidebarOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#050505] border-r border-[#1a1a1a]">
      <div className="p-6">
        <div className="text-[9px] font-black uppercase tracking-[3px] text-[#555] mb-5">Matrix Modules</div>
        <div className="space-y-2">
          {['All Assignments', 'Data Processing', 'Logic Gates'].map((module, i) => (
            <div key={module} className={cn(
              "flex items-center gap-3.5 p-3 rounded-[3px] border border-transparent cursor-pointer transition-all",
              i === 0 ? "bg-[#0e0e0e] border-[#1a1a1a]" : "hover:bg-white/5"
            )}>
              <FolderSticker active={i === 0} className="scale-75 origin-left" />
              <span className={cn(
                "text-[11px] font-extrabold uppercase tracking-wider",
                i === 0 ? "text-white" : "text-[#555]"
              )}>{module}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <AssignmentSidebar
          selectedId={selectedAssignmentId}
          onSelect={handleQuestionSelect}
          questionStatuses={questionStatuses as any}
          preLoadedAssignments={assignments as any} 
        />
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-[#050505] text-white overflow-hidden selection:bg-[#f39233]/20 font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@500;800&display=swap');
        .font-mono { font-family: 'JetBrains Mono', monospace !important; }
        .logo-font { font-family: 'Inter', sans-serif; font-weight: 900; letter-spacing: 2px; }
      `}</style>

      {/* --- Tactical Header --- */}
      <header className="h-16 border-b border-[#1a1a1a] flex items-center justify-between px-6 md:px-12 bg-[#050505] z-50 shrink-0">
        <div className="flex items-center gap-6">
          {isMobile && (
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-[#555] hover:text-white">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0 bg-[#050505] border-[#1a1a1a]">
                <SidebarContent />
              </SheetContent>
            </Sheet>
          )}
          <div className="logo-font text-[1.1rem]">COD<span className="lowercase text-[1.2em] relative top-[1px] mx-[1px]">é</span>VO</div>
        </div>

        <div className="hidden md:block text-[9px] font-black text-[#555] tracking-[5px] uppercase">
          Tactical Practice Arena
        </div>

        <div className="flex items-center gap-4">
          <div className={cn(
            "flex items-center gap-3 px-4 py-2 border font-mono text-xs font-bold transition-all duration-500 bg-black/40",
            (hasTimeLimit && elapsedTime > timeLimitSeconds) ? "border-red-500/50 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse" : "border-[#1a1a1a] text-[#555]"
          )}>
             {hasTimeLimit ? <Timer className="w-4 h-4" /> : <InfinityIcon className="w-4 h-4" />}
             <span>{formatTimer()}</span>
          </div>

          <Button 
            variant="outline" 
            onClick={() => setIsExitDialogOpen(true)}
            className="h-9 border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-none px-4 text-[11px] font-black uppercase tracking-wider"
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Exit Session</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {!isMobile && (
            <>
              <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                <SidebarContent />
              </ResizablePanel>
              <ResizableHandle className="w-[1px] bg-[#1a1a1a] hover:bg-[#f39233] transition-colors" />
            </>
          )}
          
          <ResizablePanel defaultSize={80} className="bg-[#050505]">
            <div className="h-full overflow-hidden flex flex-col">
              {selectedAssignmentId ? (
                <ErrorBoundary>
                  <AssignmentView 
                    key={selectedAssignmentId}
                    assignmentId={selectedAssignmentId} 
                    onStatusUpdate={(status) => setQuestionStatuses(prev => ({ ...prev, [selectedAssignmentId]: status }))}
                    currentStatus={questionStatuses[selectedAssignmentId] as any}
                    tables={activeTables} 
                  />
                </ErrorBoundary>
              ) : (
                /* --- Environment Matrix / Selection View --- */
                <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar">
                  <div className="flex justify-between items-end mb-10">
                    <div>
                      <h1 className="text-2xl font-black tracking-tighter text-white mb-1">Environment Matrix</h1>
                      <div className="text-[9px] font-black text-[#555] tracking-[2px] uppercase">{assignments.length} Data Blocks Available</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {assignments.map((assignment: any, idx) => (
                      <div key={assignment.id} className={cn(
                        "group border transition-all duration-300 rounded-[3px]",
                        idx === 0 ? "bg-[#080808] border-[#333]" : "bg-[#0c0c0c] border-[#1a1a1a] hover:border-[#222]"
                      )}>
                        <div className="p-6 flex items-center justify-between cursor-pointer" onClick={() => handleQuestionSelect(assignment.id)}>
                          <div className="flex items-center gap-5">
                            <div className="w-11 h-11 bg-black border border-[#1a1a1a] rounded-[3px] flex items-center justify-center text-[#555] group-hover:text-white transition-colors">
                              <Terminal className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-[17px] font-bold text-white mb-1.5">{assignment.title}</div>
                              <div className="flex items-center gap-3">
                                <LevelBadge level={assignment.difficulty || 'Medium'} />
                                <span className="text-[#222]">|</span>
                                <div className="text-[10px] font-black uppercase tracking-wider text-[#555]">{assignment.category}</div>
                              </div>
                            </div>
                          </div>
                          
                          {idx === 0 ? (
                            <ChevronRight className="w-5 h-5 text-[#f39233]" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-[#333]" />
                          )}
                        </div>

                        {/* Expanded details for the first/active item */}
                        {idx === 0 && (
                          <div className="px-6 pb-8 pt-0 border-t border-[#1a1a1a]">
                            <div className="mt-6 bg-black border border-[#111] p-8 flex flex-wrap items-center justify-between gap-12 relative">
                              <div className="flex-1 min-w-[300px]">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-8">
                                    <span className="text-[10px] font-extrabold uppercase text-white">Session Clock</span>
                                    <div className="flex items-center bg-[#050505] border border-[#252525] px-6 py-2.5 shadow-inner relative overflow-hidden">
                                      <span className="font-mono text-3xl font-extrabold text-white tracking-tighter z-10">{assignment.expected_time || '15'}</span>
                                      <div className="ml-4 px-2 py-0.5 bg-[#f39233] text-black text-[9px] font-black tracking-wider z-10">MIN</div>
                                      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] via-transparent to-black/20 pointer-events-none" />
                                    </div>
                                  </div>

                                  <div className="flex flex-col items-end gap-2">
                                    <span className="text-[9px] font-black text-[#555] tracking-widest uppercase">Free Mode</span>
                                    <TacticalSwitch on={freeMode} onClick={() => setFreeMode(!freeMode)} />
                                  </div>
                                </div>
                                
                                <div className="relative h-0.5 bg-[#1a1a1a] my-8">
                                  <div className="absolute h-full w-2/5 bg-[#333]" />
                                  <div className="absolute left-[40%] top-1/2 -translate-y-1/2 w-3 h-8 bg-white border-[5px] border-black shadow-lg" />
                                </div>

                                <div className="flex justify-between text-[8px] font-black text-[#555] tracking-widest uppercase">
                                  <span>Min_Val: 02</span>
                                  <span>Optimal: {assignment.expected_time || '15'}</span>
                                  <span>Limit: 60</span>
                                </div>
                              </div>

                              <button 
                                onClick={() => handleQuestionSelect(assignment.id)}
                                className="group/btn relative bg-white text-black border border-white px-12 py-5 text-[11px] font-black uppercase tracking-[3px] overflow-hidden transition-all hover:bg-transparent hover:text-white hover:pl-16"
                              >
                                <span className="absolute left-[-25px] opacity-0 transition-all duration-400 group-hover/btn:left-6 group-hover/btn:opacity-100 text-lg">→</span>
                                Start Practice
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>

      <Dialog open={isExitDialogOpen} onOpenChange={setIsExitDialogOpen}>
        <DialogContent className="bg-[#0c0c0e] border-[#1a1a1a] text-white">
          <DialogHeader>
            <DialogTitle className="font-black tracking-tight">End Practice Session?</DialogTitle>
            <DialogDescription className="text-[#555]">Your local progress for this active matrix will be cleared.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsExitDialogOpen(false)} className="hover:bg-white/5 border-transparent">Cancel</Button>
            <Button onClick={() => { sessionStorage.clear(); navigate('/'); }} className="bg-red-600 hover:bg-red-700 text-white rounded-none">End Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Practice;
