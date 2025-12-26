import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QrCode, Check, Loader2 } from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface UserStatsCardProps {
  userId: string | undefined;
}

export function UserStatsCard({ userId }: UserStatsCardProps) {
  const queryClient = useQueryClient();
  const [newUsername, setNewUsername] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['user_stats_silver', userId],
    queryFn: async () => {
      if (!userId) return null;

      // Fetch Profile for Username
      const { data: profile } = await supabase.from('profiles').select('username').eq('id', userId).maybeSingle();

      // Fetch submissions
      const { data: submissions } = await supabase.from('practice_submissions').select('problem_id, status, score, submitted_at, practice_problems(difficulty)').eq('user_id', userId).eq('status', 'completed');

      const { data: allProblems } = await supabase.from('practice_problems').select('difficulty');

      const difficultyStats = {
        Easy: { solved: 0, total: allProblems?.filter(p => p.difficulty === 'Easy').length || 0 },
        Medium: { solved: 0, total: allProblems?.filter(p => p.difficulty === 'Medium').length || 0 },
        Hard: { solved: 0, total: allProblems?.filter(p => p.difficulty === 'Hard').length || 0 },
      };

      submissions?.forEach((s: any) => {
        const diff = s.practice_problems?.difficulty as keyof typeof difficultyStats;
        if (diff) difficultyStats[diff].solved++;
      });

      const sparklineData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dateStr = date.toISOString().split('T')[0];
        const count = submissions?.filter(s => s.submitted_at?.startsWith(dateStr)).length || 0;
        return { day: dateStr, count };
      });

      const { data: streak } = await supabase.from('practice_streaks').select('current_streak').eq('user_id', userId).maybeSingle();
      const points = submissions?.reduce((sum, s) => sum + (s.score || 0), 0) || 0;

      return {
        solved: submissions?.length || 0,
        username: profile?.username,
        points,
        streak: streak?.current_streak || 0,
        difficulty: difficultyStats,
        sparkline: sparklineData,
      };
    },
    enabled: !!userId,
  });

  const handleUpdateUsername = async () => {
    if (!newUsername || newUsername.trim().length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }
    setIsUpdating(true);
    const { error } = await supabase.from('profiles').update({ username: newUsername }).eq('id', userId);
    if (error) {
      toast.error("Error setting username");
    } else {
      toast.success("Username set successfully");
      queryClient.invalidateQueries({ queryKey: ['user_stats_silver', userId] });
    }
    setIsUpdating(false);
  };

  if (isLoading || !stats) return <div className="h-[400px] w-full animate-pulse bg-[#0c0c0c] rounded-2xl border border-[#1a1a1a]" />;

  return (
    <div className="relative w-full bg-[#0c0c0c] p-8 font-sans">
      {/* Header with Solved Count and QR Logic */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex flex-col">
          <span className="text-[0.6rem] tracking-[2px] text-[#555555] uppercase font-bold mb-2">Solved Count</span>
          <span className="text-5xl font-thin leading-none bg-gradient-to-b from-white to-[#999999] bg-clip-text text-transparent">
            {stats.solved}
          </span>
        </div>

        {/* QR Section */}
        <div className="relative flex flex-col items-center">
          <div className={cn(
            "w-20 h-20 bg-white p-2 rounded-xl transition-all duration-700 shadow-2xl",
            (!stats.username) && "blur-md scale-95 grayscale"
          )}>
            <QrCode className="w-full h-full text-black" />
          </div>

          {/* Overlapping Input Block for Username */}
          {(!stats.username) && (
            <div className="absolute inset-x-0 bottom-0 px-1 translate-y-3 z-20">
              <div className="bg-black border border-white/20 rounded-lg p-0.5 flex items-center shadow-2xl ring-1 ring-primary/20">
                <Input 
                  placeholder="Set Username" 
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="h-6 text-[9px] bg-transparent border-none text-white focus-visible:ring-0 px-2"
                />
                <Button 
                  size="icon" 
                  className="h-5 w-5 bg-primary hover:bg-primary/90 rounded-md shrink-0" 
                  onClick={handleUpdateUsername}
                  disabled={isUpdating}
                >
                  {isUpdating ? <Loader2 className="w-2 h-2 animate-spin" /> : <Check className="w-2 h-2" />}
                </Button>
              </div>
            </div>
          )}
          <span className="text-[9px] font-bold text-[#333] mt-4 uppercase tracking-[0.2em]">Profile QR</span>
        </div>
      </div>

      {/* Sparkline */}
      <div className="h-16 mb-8 opacity-60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={stats.sparkline}>
            <Area type="monotone" dataKey="count" stroke="#ffffff" fill="rgba(255,255,255,0.05)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Difficulty Grid */}
      <div className="grid grid-cols-3 gap-2 mb-8">
        {['Easy', 'Medium', 'Hard'].map((label) => {
          const d = label as keyof typeof stats.difficulty;
          return (
            <div key={label} className="bg-white/[0.02] border border-[#1a1a1a] rounded-xl py-4 px-2 text-center transition-all hover:bg-white/[0.05]">
              <span className="block text-[0.5rem] text-[#555555] uppercase tracking-wider mb-1">{label}</span>
              <div className="text-xl font-light text-white">
                {stats.difficulty[d].solved}<small className="text-[#333] text-[0.6rem] ml-0.5">/{stats.difficulty[d].total}</small>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats Footer */}
      <div className="flex justify-between items-center pt-6 border-t border-white/5">
        <div className="flex flex-col">
          <span className="text-[0.5rem] tracking-[2px] text-[#555555] uppercase mb-1">Streak</span>
          <span className="text-lg font-normal text-white">{stats.streak}</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[0.5rem] tracking-[2px] text-[#555555] uppercase mb-1">Points</span>
          <span className="text-lg font-normal text-white">{stats.points}</span>
        </div>
      </div>
    </div>
  );
}
