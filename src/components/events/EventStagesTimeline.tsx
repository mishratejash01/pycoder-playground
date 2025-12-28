import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, isPast, isFuture } from 'date-fns';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Stage {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  order_index: number;
}

interface EventStagesTimelineProps {
  eventId: string;
  eventStartDate: string;
  eventEndDate: string;
  registrationDeadline?: string | null;
}

export function EventStagesTimeline({ 
  eventId, 
  eventStartDate, 
  eventEndDate,
  registrationDeadline 
}: EventStagesTimelineProps) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStages();
  }, [eventId]);

  async function fetchStages() {
    const { data, error } = await supabase
      .from('event_stages')
      .select('*')
      .eq('event_id', eventId)
      .order('order_index', { ascending: true });

    if (!error && data) setStages(data);
    setLoading(false);
  }

  const defaultStages: Stage[] = [
    { id: 'reg', title: 'Registration Period', description: 'Onboarding and credential verification phase.', start_date: eventStartDate, end_date: registrationDeadline || eventStartDate, order_index: 0 },
    { id: 'live', title: 'Main Event Protocol', description: 'Primary execution and assembly period.', start_date: eventStartDate, end_date: eventEndDate, order_index: 1 },
    { id: 'end', title: 'Final Conclusion', description: 'Termination of activities and submission closing.', start_date: eventEndDate, end_date: null, order_index: 2 },
  ];

  const displayStages = stages.length > 0 ? stages : defaultStages;

  return (
    <div className="w-full max-w-[800px] mx-auto font-sans">
      <div className="flex items-center gap-[15px] mb-[60px]">
        <div className="w-[2px] h-[24px] bg-[#ff8c00]" />
        <h2 className="font-serif text-[2.2rem] font-normal tracking-[-0.5px] text-white">Stages & Timeline</h2>
      </div>

      <div className="relative pl-[40px] before:content-[''] before:absolute before:left-[10px] before:top-[5px] before:bottom-[5px] before:w-[1px] before:bg-[#1a1a1a]">
        {displayStages.map((stage, index) => {
          const now = new Date();
          const start = new Date(stage.start_date);
          const end = stage.end_date ? new Date(stage.end_date) : null;
          
          const isCompleted = end ? isPast(end) : isPast(start);
          const isActive = !isCompleted && isPast(start) && (end ? !isPast(end) : true);

          return (
            <div key={stage.id} className="relative mb-[30px] last:mb-0">
              <div className={cn(
                "absolute left-[-35px] top-[4px] w-[21px] h-[21px] bg-black border flex items-center justify-center z-[2]",
                isCompleted ? "border-[#00ff88] text-[#00ff88]" : "border-[#1a1a1a]",
                isActive && "border-white"
              )}>
                {isCompleted ? <Check className="w-[12px] h-[12px] stroke-[3]" /> : isActive ? <div className="w-[4px] h-[4px] bg-white" /> : null}
              </div>

              <div className={cn("bg-[#050505] border border-[#1a1a1a] p-[30px] flex flex-col md:flex-row justify-between items-start transition-opacity", isCompleted && "opacity-50")}>
                <div className="flex-1">
                  <h4 className="text-[0.65rem] uppercase tracking-[3px] text-[#555555] mb-[12px]">Protocol {String(index + 1).padStart(2, '0')}</h4>
                  <h3 className="font-serif text-[1.4rem] font-normal text-white mb-[10px]">{stage.title}</h3>
                  <p className="text-[#555555] text-[0.85rem] font-light max-w-[350px] leading-relaxed">{stage.description}</p>
                  
                  {isActive && (
                    <div className="mt-[25px] inline-flex items-center gap-[12px] border border-[#1a1a1a] bg-white/5 px-4 py-2">
                      <div className="w-[6px] h-[6px] bg-[#00ff88] rounded-full shadow-[0_0_10px_#00ff88] animate-pulse" />
                      <span className="text-[0.6rem] uppercase tracking-[2px] text-white font-semibold">Currently Active</span>
                    </div>
                  )}
                </div>
                <div className="mt-5 md:mt-0 text-left md:text-right min-w-[120px]">
                  <span className={cn("block text-[0.8rem] tracking-[1px] mb-1", isCompleted ? "text-[#555555]" : "text-[#e0e0e0]")}>{format(start, 'MMM dd, yyyy')}</span>
                  <span className="block text-[0.65rem] text-[#555555] uppercase tracking-[1px]">{format(start, 'HH:mm OOOO')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
