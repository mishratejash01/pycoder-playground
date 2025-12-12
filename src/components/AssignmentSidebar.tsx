import { useState, useMemo, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Clock, Eye, LockKeyhole, User, Fingerprint } from 'lucide-react';
import type { QuestionStatus } from '@/pages/Index';
import { useToast } from '@/hooks/use-toast';

interface Assignment {
  id: string;
  title: string;
  category: string | null;
  is_unlocked?: boolean;
}

interface AssignmentSidebarProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
  questionStatuses: Record<string, QuestionStatus>;
  preLoadedAssignments?: Assignment[];
  isProctored?: boolean;
  candidateId?: string; // New prop for Candidate ID
}

export const AssignmentSidebar = ({ 
  selectedId, 
  onSelect, 
  questionStatuses, 
  preLoadedAssignments = [], 
  isProctored = false,
  candidateId = "CAND-8829-X9" // Default/Fallback ID
}: AssignmentSidebarProps) => {
  const { toast } = useToast();

  // Group Assignments by Category
  const groupedAssignments = useMemo(() => {
    const groups: Record<string, Assignment[]> = {};
    if (!preLoadedAssignments) return groups;
    
    preLoadedAssignments.forEach(a => {
      // If proctored, we can still group by category if desired, or flatten. 
      // Keeping original logic: use category or fallback.
      const cat = isProctored ? "Exam Questions" : (a.category || "General Questions");
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(a);
    });
    return groups;
  }, [preLoadedAssignments, isProctored]);

  const [openItem, setOpenItem] = useState<string>("");

  // Effect: Auto-open category
  useEffect(() => {
    if (selectedId && preLoadedAssignments.length > 0) {
      const assignment = preLoadedAssignments.find(a => a.id === selectedId);
      if (assignment) {
        const category = isProctored ? "Exam Questions" : (assignment.category || "General Questions");
        setOpenItem(prev => (prev !== category ? category : prev));
      }
    } else if (!openItem && Object.keys(groupedAssignments).length > 0) {
      setOpenItem(Object.keys(groupedAssignments)[0]);
    }
  }, [selectedId, preLoadedAssignments, isProctored, groupedAssignments]);

  const getStatusColor = (id: string, isLocked: boolean) => {
    if (isLocked) return 'bg-[#252526] border-[#333] opacity-50 cursor-not-allowed text-[#666]';

    const status = questionStatuses[id] || 'not-visited';
    switch (status) {
      case 'attempted': return 'bg-[#1b3a1b] text-[#4CAF50] border-[#2e7d32] hover:border-[#4CAF50]';
      case 'review': return 'bg-[#3a2e05] text-[#fbc02d] border-[#fbc02d] hover:border-[#fff]';
      case 'visited': return 'bg-[#2D2D2D] text-[#E0E0E0] border-[#555] hover:border-[#888]';
      default: return 'bg-[#1E1E1E] text-[#888] border-[#333] hover:border-[#666]';
    }
  };

  const getStatusIcon = (id: string, isLocked: boolean) => {
    if (isLocked) return <LockKeyhole className="w-3 h-3" />;

    const status = questionStatuses[id] || 'not-visited';
    switch (status) {
      case 'attempted': return <CheckCircle2 className="w-3 h-3" />;
      case 'review': return <Clock className="w-3 h-3" />;
      case 'visited': return <Eye className="w-3 h-3" />;
      default: return <Circle className="w-3 h-3" />;
    }
  };

  const handleItemClick = (assignment: Assignment) => {
    const isLocked = assignment.is_unlocked === false;
    
    if (isLocked) {
      toast({
        title: "Locked Question",
        description: "This question is currently locked.",
        variant: "destructive"
      });
      return;
    }
    onSelect(assignment.id);
  };

  return (
    <div className="flex flex-col h-full bg-[#1E1E1E] border-r border-[#333] select-none text-[#CCC] font-sans">
      
      {/* 1. CANDIDATE ID SECTION (Enduring) */}
      <div className="px-4 py-3 bg-[#252526] border-b border-[#333] flex flex-col gap-1 shadow-sm shrink-0">
        <div className="flex items-center justify-between text-[10px] font-bold text-[#888] uppercase tracking-wider">
          <span className="flex items-center gap-1.5"><User className="w-3 h-3" /> Candidate</span>
          <span className="flex items-center gap-1"><Fingerprint className="w-3 h-3" /> Verified</span>
        </div>
        <div className="font-mono text-xs text-white bg-[#111] px-2 py-1.5 rounded border border-[#333] truncate">
          {candidateId}
        </div>
      </div>

      {/* 2. LEGEND (Original Design, New Colors) */}
      <div className="p-4 border-b border-[#333] bg-[#1E1E1E] shrink-0">
        <h3 className="text-[11px] font-bold text-[#999] uppercase tracking-wider mb-3">Question Palette</h3>
        <div className="grid grid-cols-2 gap-y-2 gap-x-1 text-[10px] text-[#888]">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#4CAF50] shadow-[0_0_4px_#4CAF50]" /> Answered</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#fbc02d]" /> Review</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#E0E0E0]" /> Visited</div>
          <div className="flex items-center gap-2"><LockKeyhole className="w-2 h-2 text-[#666]" /> Locked</div>
        </div>
      </div>

      <ScrollArea className="flex-1 bg-[#151515]">
        <div className="p-3">
          <Accordion 
            type="single" 
            collapsible
            value={openItem}
            onValueChange={setOpenItem}
            className="w-full space-y-3"
          >
            {Object.entries(groupedAssignments).map(([category, items]) => (
              <AccordionItem key={category} value={category} className="border border-[#333] rounded-md bg-[#1E1E1E] overflow-hidden">
                <AccordionTrigger className="px-3 py-2.5 hover:no-underline hover:bg-[#2A2D2E] transition-colors text-xs font-semibold text-[#E0E0E0] data-[state=open]:text-white border-b border-transparent data-[state=open]:border-[#333]">
                  <div className="flex items-center gap-2 w-full">
                     <span className="uppercase tracking-wide opacity-90">{category}</span>
                     <span className="ml-auto bg-[#333] text-[9px] px-1.5 py-0.5 rounded-full text-[#CCC]">{items.length}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-2 bg-[#151515]">
                  <div className="grid grid-cols-4 gap-2">
                    {items.map((assignment, idx) => {
                      const isLocked = assignment.is_unlocked === false;
                      const isSelected = selectedId === assignment.id;
                      
                      return (
                        <button
                          key={assignment.id}
                          onClick={() => handleItemClick(assignment)}
                          className={cn(
                            "aspect-square rounded-md flex flex-col items-center justify-center gap-0.5 border transition-all duration-200 relative group",
                            getStatusColor(assignment.id, isLocked),
                            isSelected && !isLocked && "ring-1 ring-[#007ACC] ring-offset-1 ring-offset-[#151515] bg-[#003366] border-[#007ACC] text-white z-10"
                          )}
                          title={isLocked ? "Locked" : assignment.title}
                        >
                          <span className="text-[11px] font-bold font-mono group-hover:scale-110 transition-transform">{idx + 1}</span>
                          {getStatusIcon(assignment.id, isLocked)}
                        </button>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </ScrollArea>
    </div>
  );
};
