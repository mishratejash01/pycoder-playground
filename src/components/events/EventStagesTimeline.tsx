import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, isPast } from 'date-fns';
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
    { id: '1', title: 'Registration Opens', description: 'Secure your spot for the assembly.', start_date: eventStartDate, end_date: registrationDeadline || null, order_index: 0 },
    { id: '2', title: 'Main Event', description: 'Protocol execution phase.', start_date: eventStartDate, end_date: eventEndDate, order_index: 1 },
    { id: '3', title: 'Conclusion', description: 'Final termination and review.', start_date: eventEndDate, end_date: null, order_index: 2 },
  ];

  const displayStages = stages.length > 0 ? stages : defaultStages;

  if (loading) return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-white" /></div>;

  return (
    <div className="w-full max-w-[800px] mx-auto font-sans">
      <div className="flex items-center gap-4 mb-12">
        <div className="w-0.5 h-6 bg-[#ff8c00]" />
        <h2 className="font-serif text-4xl font-normal text-white">Stages & Timeline</h2>
      </div>

      <div className="relative pl-10 before:absolute before:left-[10px] before:top-1 before:bottom-1 before:w-px before:bg-[#1a1a1a]">
        {displayStages.map((stage, index) => {
          const isCompleted = isPast(new Date(stage.start_date));
          const isActive = !isCompleted && index === 0; // Simplified logic for demo

          return (
            <div key={stage.id} className="relative mb-8">
              <div className={cn(
                "absolute -left-[35px] top-1 w-5 h-5 bg-black border flex items-center justify-center z-10",
                isCompleted ? "border-[#00ff88] text-[#00ff88]" : "border-[#1a1a1a]"
              )}>
                {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
              </div>

              <div className={cn("bg-[#050505] border border-[#1a1a1a] p-8", isCompleted && "opacity-50")}>
                <h4 className="text-[10px] uppercase tracking-[3px] text-[#555555] mb-3">Protocol {String(index + 1).padStart(2, '0')}</h4>
                <h3 className="font-serif text-2xl text-white mb-2">{stage.title}</h3>
                <p className="text-[#555555] text-sm font-light leading-relaxed">{stage.description}</p>
                
                <div className="mt-6 text-sm text-[#e0e0e0]">
                  {format(new Date(stage.start_date), 'MMM dd, yyyy')}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
