import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// --- Custom Hand-Drawn Calendar Icon (Scaled Down from your HTML) ---
const HandDrawnCalendarIcon = () => (
  <div className="relative w-6 h-7 shrink-0 mr-2 select-none" style={{ filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.5))' }}>
    
    {/* Sketchy Rings (Absolute Positioned on Top) */}
    <div className="absolute -top-[3px] left-0 w-full flex justify-around px-[4px] z-20">
      <div className="w-[4px] h-[8px] bg-[#a8dadc] border-[1.5px] border-[#1a1a1a] rounded-[2px]" />
      <div className="w-[4px] h-[8px] bg-[#a8dadc] border-[1.5px] border-[#1a1a1a] rounded-[2px]" />
    </div>

    {/* Calendar Body Container */}
    <div className="relative top-[2px] bg-white border-[1.5px] border-[#1a1a1a] rounded-[4px_5px_3px_4px] overflow-hidden z-10 h-[22px] w-full">
      
      {/* Red Banner Header */}
      <div className="h-[6px] bg-[#e63946] border-b-[1.5px] border-[#1a1a1a]" />

      {/* Inner Grid */}
      <div className="p-[2px] grid grid-cols-4 gap-[1.5px]">
        {Array(8).fill(null).map((_, i) => (
          <div key={i} className="bg-[#a8dadc] border-[1px] border-[#1a1a1a] h-[3px] rounded-[1px]" />
        ))}
      </div>
    </div>
  </div>
);
// ---------------------------------------------------------------------

interface ActivityCalendarProps {
  userId: string | undefined;
}

export function ActivityCalendar({ userId }: ActivityCalendarProps) {
  // Fetch ~140 days to fill the wider layout
  const { data: submissions = [] } = useQuery({
    queryKey: ['user_activity_expanded', userId],
    queryFn: async () => {
      if (!userId) return [];
      const daysToFetch = 140; 
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysToFetch);
      
      const { data, error } = await supabase
        .from('practice_submissions')
        .select('submitted_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('submitted_at', startDate.toISOString());
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId
  });

  const activityMap = new Map<string, number>();
  submissions.forEach(s => {
    if (s.submitted_at) {
      const date = s.submitted_at.split('T')[0];
      activityMap.set(date, (activityMap.get(date) || 0) + 1);
    }
  });

  // Generate 20 weeks of data
  const totalWeeks = 20; 
  const weeks: { date: string; count: number }[][] = [];
  const today = new Date();
  
  for (let week = 0; week < totalWeeks; week++) {
    const weekDates: { date: string; count: number }[] = [];
    for (let day = 0; day < 7; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (totalWeeks - 1 - week) * 7 - (6 - day));
      const dateStr = date.toISOString().split('T')[0];
      weekDates.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        count: activityMap.get(dateStr) || 0
      });
    }
    weeks.push(weekDates);
  }

  const getIntensity = (count: number) => {
    if (count === 0) return 'bg-white/5';
    if (count === 1) return 'bg-blue-900/50';
    if (count === 2) return 'bg-blue-700/60';
    if (count <= 4) return 'bg-blue-600/70';
    return 'bg-blue-500';
  };

  if (!userId) return null;

  return (
    <Card className="bg-[#0f0f12] border-white/5 rounded-[24px] shadow-2xl overflow-hidden">
      <CardHeader className="pb-4 px-6 pt-6">
        {/* Title with Custom Hand-Drawn Icon */}
        <CardTitle className="text-[1.1rem] font-bold text-white flex items-center gap-1 font-sans tracking-tight">
          <HandDrawnCalendarIcon />
          Activity Record
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {/* Full-width activity grid */}
        <div className="flex justify-between gap-[3px] w-full">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-[3px]">
              {week.map((dayData, dayIdx) => (
                <div
                  key={`${weekIdx}-${dayIdx}`}
                  className={cn(
                    "w-[11px] h-[11px] rounded-[2px] transition-all duration-300 hover:scale-150 hover:z-10 cursor-help",
                    getIntensity(dayData.count)
                  )}
                  title={`${dayData.date}: ${dayData.count} submissions`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-1.5 mt-4 text-[9px] text-zinc-500 font-sans uppercase font-bold tracking-widest">
          <span>Less</span>
          {[0, 1, 2, 4].map(i => (
            <div key={i} className={cn("w-2 h-2 rounded-[1px]", getIntensity(i))} />
          ))}
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}
