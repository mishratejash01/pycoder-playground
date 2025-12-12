import { useState, useMemo, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';
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
}

export const AssignmentSidebar = ({ 
  selectedId, 
  onSelect, 
  questionStatuses, 
  preLoadedAssignments = [], 
  isProctored = false 
}: AssignmentSidebarProps) => {
  const { toast } = useToast();

  // Group Assignments by Category
  const groupedAssignments = useMemo(() => {
    const groups: Record<string, Assignment[]> = {};
    if (!preLoadedAssignments) return groups;
    
    preLoadedAssignments.forEach(a => {
      // If proctored, flatten everything into one "Questions" group for simplicity, 
      // or keep categories if your exam data supports it.
      const cat = isProctored ? "All Questions" : (a.category || "General");
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(a);
    });
    return groups;
  }, [preLoadedAssignments, isProctored]);

  const [openItem, setOpenItem] = useState<string>("");

  // Effect: Auto-open the category of the selected question
  useEffect(() => {
    if (selectedId && preLoadedAssignments.length > 0) {
      const assignment = preLoadedAssignments.find(a => a.id === selectedId);
      if (assignment) {
        const category = isProctored ? "All Questions" : (assignment.category || "General");
        setOpenItem(prev => (prev !== category ? category : prev));
      }
    } else if (!openItem && Object.keys(groupedAssignments).length > 0) {
      // Default to opening the first category if nothing selected
      setOpenItem(Object.keys(groupedAssignments)[0]);
    }
  }, [selectedId, preLoadedAssignments, isProctored, groupedAssignments]);

  const getTileStyles = (id: string, isLocked: boolean, isSelected: boolean) => {
    if (isLocked) {
        return 'bg-[#1E1E1E] border-[#333] text-[#444] cursor-not-allowed opacity-60';
    }

    const status = questionStatuses[id] || 'not-visited';
    
    // Priority: Selected > Status > Default
    if (isSelected) {
        return 'bg-[#003366] border-[#007ACC] text-white shadow-[inset_0_0_0_1px_#007ACC] z-10';
    }

    switch (status) {
      case 'attempted': // "Done" in reference
        return 'bg-[#1b3a1b] border-[#2e7d32] text-[#4CAF50] hover:border-[#4CAF50]';
      case 'review': // "Skip" in reference
        return 'bg-[#3a2e05] border-[#fbc02d] text-[#fbc02d] hover:border-[#fff]';
      case 'visited':
        return 'bg-[#2D2D2D] border-[#555] text-[#ccc] hover:border-[#888]';
      default: // Default "Normal"
        return 'bg-[#2D2D2D] border-[#333] text-[#888] hover:border-[#666]';
    }
  };

  const handleItemClick = (assignment: Assignment) => {
    const isLocked = assignment.is_unlocked === false;
    
    if (isLocked) {
      toast({
        title: "Locked",
        description: "This question is currently locked.",
        variant: "destructive"
      });
      return;
    }
    onSelect(assignment.id);
  };

  return (
    <div className="flex flex-col h-full bg-[#1E1E1E] border-r border-[#333] select-none">
      {/* Sidebar Header (Matches "OPPE 2" Sidebar Header style if needed, or simple Label) */}
      <div className="h-[35px] flex items-center px-4 bg-[#252526] border-b border-[#333] shrink-0">
        <span className="text-[11px] font-bold text-[#999] uppercase tracking-wider">Explorer</span>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          <Accordion 
            type="single" 
            collapsible
            value={openItem}
            onValueChange={setOpenItem}
            className="w-full"
          >
            {Object.entries(groupedAssignments).map(([category, items]) => {
              // Calculate completion for the header (e.g., "2/6")
              const completedCount = items.filter(i => questionStatuses[i.id] === 'attempted').length;

              return (
                <AccordionItem key={category} value={category} className="border-b border-[#333] data-[state=open]:border-b-0">
                  {/* Category Header (.cat-btn style) */}
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-[#2A2D2E] bg-[#252526] text-white/90 data-[state=open]:bg-[#37373D] transition-colors group">
                    <div className="flex items-center justify-between w-full pr-2">
                       <span className="text-[11px] font-bold text-[#CCC] group-hover:text-white uppercase tracking-wide truncate max-w-[140px]" title={category}>
                         {category}
                       </span>
                       <span className="text-[10px] text-[#666] font-mono group-hover:text-[#999]">
                         {completedCount}/{items.length}
                       </span>
                    </div>
                  </AccordionTrigger>
                  
                  {/* Grid Container (.grid-container style) */}
                  <AccordionContent className="p-0 bg-[#151515]">
                    <div className="p-[10px] grid grid-cols-5 gap-[6px]">
                      {items.map((assignment, idx) => {
                        const isLocked = assignment.is_unlocked === false;
                        const isSelected = selectedId === assignment.id;
                        
                        return (
                          <button
                            key={assignment.id}
                            onClick={() => handleItemClick(assignment)}
                            className={cn(
                              "aspect-square flex items-center justify-center border transition-all duration-100",
                              "text-[11px] font-mono font-medium",
                              getTileStyles(assignment.id, isLocked, isSelected)
                            )}
                            title={assignment.title}
                          >
                            {isLocked ? <Lock className="w-3 h-3" /> : (idx + 1)}
                          </button>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </ScrollArea>
      
      {/* Optional Footer / Legend */}
      <div className="p-3 bg-[#1E1E1E] border-t border-[#333] text-[10px] text-[#666] grid grid-cols-2 gap-2">
         <div className="flex items-center gap-2"><div className="w-2 h-2 bg-[#1b3a1b] border border-[#2e7d32]"></div> <span>Solved</span></div>
         <div className="flex items-center gap-2"><div className="w-2 h-2 bg-[#3a2e05] border border-[#fbc02d]"></div> <span>Review</span></div>
      </div>
    </div>
  );
};
