import { format } from 'date-fns';
import { Check, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventStage {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  status: 'upcoming' | 'ongoing' | 'completed';
}

interface EventStagesTimelineProps {
  stages: EventStage[];
}

export function EventStagesTimeline({ stages }: EventStagesTimelineProps) {
  if (!stages || stages.length === 0) return null;

  return (
    <div className="w-full max-w-[800px] mx-auto py-10 font-sans">
      {/* Technical Header */}
      <div className="flex items-center gap-[15px] mb-[60px]">
        <div className="w-[2px] h-[24px] bg-[#ff8c00]" />
        <h2 className="font-serif text-[2.2rem] font-normal tracking-[-0.5px] text-white">
          Stages & Timeline
        </h2>
      </div>

      {/* Timeline Schematic */}
      <div className="relative pl-[40px] before:content-[''] before:absolute before:left-[10px] before:top-[5px] before:bottom-[5px] before:width-[1px] before:bg-[#1a1a1a]">
        {stages.map((stage, index) => {
          const isCompleted = stage.status === 'completed';
          const isActive = stage.status === 'ongoing';
          const isUpcoming = stage.status === 'upcoming';

          return (
            <div key={stage.id} className="relative mb-[30px] last:mb-0">
              {/* Industrial Marker */}
              <div 
                className={cn(
                  "absolute left-[-35px] top-[4px] w-[21px] h-[21px] bg-black border flex items-center justify-center z-[2]",
                  isCompleted && "border-[#00ff88] text-[#00ff88]",
                  isActive && "border-white",
                  isUpcoming && "border-[#111]"
                )}
              >
                {isCompleted && <Check className="w-[12px] h-[12px] stroke-[3]" />}
                {isActive && <div className="w-[4px] h-[4px] bg-white" />}
              </div>

              {/* Step Card */}
              <div 
                className={cn(
                  "bg-[#050505] border border-[#1a1a1a] p-[30px] flex flex-col md:flex-row justify-between items-start transition-opacity duration-500",
                  isCompleted && "opacity-50"
                )}
              >
                <div className="flex-1">
                  <h4 className="text-[0.65rem] uppercase tracking-[3px] text-[#555555] mb-[12px]">
                    Protocol {String(index + 1).padStart(2, '0')}
                  </h4>
                  <h3 className="font-serif text-[1.4rem] font-normal text-white mb-[10px]">
                    {stage.name}
                  </h3>
                  <p className="text-[#555555] text-[0.85rem] font-light max-w-[350px] line-relaxed">
                    {stage.description || "Phase details currently encrypted or pending deployment."}
                  </p>

                  {/* LED STATUS BLOCK for Active Stage */}
                  {isActive && (
                    <div className="mt-[25px] inline-flex items-center gap-[12px] padding-[8px_16px] border border-[#1a1a1a] bg-white/5 px-4 py-2">
                      <div className="w-[6px] h-[6px] bg-[#00ff88] rounded-full shadow-[0_0_10px_#00ff88] animate-pulse" />
                      <span className="text-[0.6rem] uppercase tracking-[2px] text-white font-semibold">
                        Currently Active
                      </span>
                    </div>
                  )}
                </div>

                {/* Date Information */}
                <div className="mt-5 md:mt-0 text-left md:text-right min-w-[120px]">
                  <span className={cn(
                    "block text-[0.8rem] tracking-[1px] mb-1",
                    isUpcoming ? "text-[#555555]" : "text-[#e0e0e0]"
                  )}>
                    {format(new Date(stage.start_date), 'MMM dd, yyyy')}
                  </span>
                  <span className="block text-[0.65rem] text-[#555555] uppercase tracking-[1px]">
                    {format(new Date(stage.start_date), 'HH:mm OOOO')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
