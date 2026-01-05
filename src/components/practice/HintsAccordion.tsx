import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Lightbulb, Lock, Eye, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HintsAccordionProps {
  hints: string[];
  hasAttempted: boolean;
}

export function HintsAccordion({ hints, hasAttempted }: HintsAccordionProps) {
  const [revealedHints, setRevealedHints] = useState<number[]>([]);

  if (!hints || hints.length === 0) return null;

  const revealHint = (index: number) => {
    if (!revealedHints.includes(index)) {
      setRevealedHints(prev => [...prev, index]);
    }
  };

  // Helper to generate formal labels based on index, matching the design aesthetic
  const getLabel = (index: number) => {
    const labels = [
      "Primary Perspective",
      "Detailed Insight", 
      "Strategic Analysis",
      "Implementation Guide",
      "Final Execution"
    ];
    return labels[index] || `Supplemental Data ${index + 1}`;
  };

  return (
    <div className="w-full max-w-[550px] mx-auto pt-6 font-sans">
      {/* Header Section */}
      <div className="flex items-center gap-3 mb-6 pb-3 border-b border-white/[0.08]">
        <Lightbulb className="w-4 h-4 text-[#94a3b8]" />
        <span className="font-serif italic text-sm text-[#94a3b8]">
          Available Guidance ({hints.length} Entries)
        </span>
      </div>
      
      <Accordion type="single" collapsible className="space-y-4">
        {hints.map((hint, index) => {
          const isRevealed = revealedHints.includes(index);
          const canReveal = hasAttempted || index === 0;
          const isLocked = !canReveal;
          
          return (
            <AccordionItem
              key={index}
              value={`hint-${index}`}
              className={cn(
                "group border rounded-[4px] transition-all duration-300",
                isLocked 
                  ? "bg-[#1a1a1a]/50 border-white/[0.04] opacity-70" 
                  : "bg-[#1a1a1a] border-white/[0.08] hover:border-white/[0.15]"
              )}
            >
              <AccordionTrigger 
                className={cn(
                  "px-6 py-5 hover:no-underline [&[data-state=open]>div>div:last-child>svg]:rotate-180",
                  isLocked && "cursor-not-allowed pointer-events-none"
                )}
                // We handle the "Make attempt to unlock" view via content, 
                // but standard accordion behavior suggests disabled triggers shouldn't open.
                // However, previous design showed lock message INSIDE. 
                // To match the HTML "Locked" card style (opacity 0.5), we keep it effectively disabled 
                // or we allow opening to see the lock message. 
                // Given the visual design has "Make an attempt" visible without expanding in the HTML 
                // (it replaces the content), we will allow the accordion to be "closed" mostly, 
                // or if we want to strictly follow the design where the "Lock" message is visible 
                // *instead* of content, we can just render the trigger as non-interactive for locked items
                // and show the locked state in the header or just keep the opacity.
                // For this implementation, I will treat locked items as non-interactive triggers
                // and display the lock status visually in the 'content' area if expanded, 
                // OR we simply display the Locked UI in the header itself? 
                // The provided HTML shows the Locked Card having the lock icon in the *content* area.
                // So we must allow expanding to see the lock message.
                disabled={false} 
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    {/* Number Box */}
                    <div className={cn(
                      "w-7 h-7 flex items-center justify-center border font-serif text-xs font-semibold transition-colors",
                      isLocked 
                        ? "border-white/[0.08] text-[#475569]" 
                        : "border-white/[0.08] text-white"
                    )}>
                      {(index + 1).toString().padStart(2, '0')}
                    </div>
                    
                    {/* Label */}
                    <span className={cn(
                      "text-xs font-semibold uppercase tracking-[0.1em] transition-colors",
                      isLocked ? "text-[#475569]" : "text-[#f8fafc]"
                    )}>
                      {getLabel(index)}
                    </span>
                  </div>

                  {/* Chevron */}
                  <div className={cn(
                    "transition-transform duration-200", 
                    isLocked ? "text-[#475569]" : "text-[#94a3b8]"
                  )}>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-6 pb-6 pt-0 ml-[44px]">
                {isRevealed ? (
                  <p className="text-sm leading-relaxed text-[#94a3b8] animate-in fade-in slide-in-from-top-1">
                    {hint}
                  </p>
                ) : canReveal ? (
                  <button
                    onClick={() => revealHint(index)}
                    className="inline-flex items-center gap-2 bg-[#f8fafc] text-[#0c0c0c] border-none px-5 py-2.5 rounded-[2px] text-[11px] font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity"
                  >
                    <Eye className="w-3 h-3" />
                    View Hint
                  </button>
                ) : (
                  <div className="flex items-center gap-2.5 text-[11px] text-[#475569] uppercase tracking-widest font-medium">
                    <Lock className="w-3 h-3" />
                    Make an attempt to unlock
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
