import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Maximize2, X } from 'lucide-react';
import { 
  LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip, AreaChart, Area,
  BarChart, Bar, CartesianGrid
} from 'recharts';
import { cn } from '@/lib/utils';

interface UserStatsCardProps {
  userId: string | undefined;
}

export function UserStatsCard({ userId }: UserStatsCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['user_stats_detailed', userId],
    queryFn: async () => {
      if (!userId) return null;

      // Fetch points and rank
      const { data: profile } = await supabase
        .from('profiles')
        .select('points, global_rank')
        .eq('id', userId)
        .single();

      // Fetch difficulty counts
      const { data: submissions } = await supabase
        .from('practice_submissions')
        .select('problem_id, status, practice_problems(difficulty)')
        .eq('user_id', userId)
        .eq('status', 'completed');

      const difficultyMap = { Easy: 0, Medium: 0, Hard: 0 };
      submissions?.forEach((s: any) => {
        const diff = s.practice_problems?.difficulty as keyof typeof difficultyMap;
        if (diff) difficultyMap[diff]++;
      });

      // Fetch last 7 days for sparkline
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data: sparkData } = await supabase
        .from('practice_submissions')
        .select('submitted_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('submitted_at', sevenDaysAgo.toISOString());

      const sparkline = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dateStr = date.toISOString().split('T')[0];
        return {
          val: sparkData?.filter(s => s.submitted_at?.startsWith(dateStr)).length || 0
        };
      });

      // Fetch full history for modal (Line Chart)
      const { data: historyData } = await supabase
        .from('practice_submissions')
        .select('submitted_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('submitted_at', { ascending: true });

      const history = historyData?.reduce((acc: any[], curr) => {
        const date = curr.submitted_at?.split('T')[0];
        const existing = acc.find(a => a.date === date);
        if (existing) existing.count++;
        else acc.push({ date, count: 1 });
        return acc;
      }, []) || [];

      return {
        points: profile?.points || 0,
        rank: profile?.global_rank || "Top 5%",
        solved: submissions?.length || 0,
        difficulty: difficultyMap,
        sparkline,
        history
      };
    },
    enabled: !!userId,
  });

  if (!stats) return null;

  return (
    <>
      {/* Main Enterprise Analytics Card */}
      <div className="w-full bg-[#0f0f12] border border-white/5 rounded-[24px] p-6 shadow-2xl font-sans text-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[1.1rem] font-bold tracking-tight">User Activity</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="p-2 bg-white/5 border border-white/5 rounded-[10px] text-zinc-500 hover:bg-[#a855f7] hover:text-white transition-all"
          >
            <Maximize2 size={18} />
          </button>
        </div>

        <div className="grid grid-cols-[1fr_1.5fr] gap-5 mb-6">
          <div className="flex flex-col justify-center">
            <span className="text-[2.5rem] font-extrabold leading-none mb-1">{stats.solved}</span>
            <span className="text-[0.8rem] text-zinc-500 uppercase tracking-widest font-bold">Solved</span>
          </div>
          <div className="h-[120px] bg-[#a855f7]/5 border border-white/5 rounded-[16px] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.sparkline}>
                <defs>
                  <linearGradient id="colorSpark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="val" 
                  stroke="#a855f7" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorSpark)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <div className="flex-1 p-3 bg-white/5 border border-white/5 rounded-[12px] text-center">
            <span className="block text-[0.75rem] text-zinc-500 mb-1">Easy</span>
            <span className="font-bold text-[0.9rem] text-[#22c55e]">{stats.difficulty.Easy}/3</span>
          </div>
          <div className="flex-1 p-3 bg-white/5 border border-white/5 rounded-[12px] text-center">
            <span className="block text-[0.75rem] text-zinc-500 mb-1">Med</span>
            <span className="font-bold text-[0.9rem] text-[#eab308]">{stats.difficulty.Medium}/8</span>
          </div>
          <div className="flex-1 p-3 bg-white/5 border border-white/5 rounded-[12px] text-center">
            <span className="block text-[0.75rem] text-zinc-500 mb-1">Hard</span>
            <span className="font-bold text-[0.9rem] text-[#ef4444]">{stats.difficulty.Hard}/1</span>
          </div>
        </div>

        <div className="grid grid-cols-3 pt-5 border-t border-white/5 text-center">
          <div>
            <span className="block text-[0.7rem] text-zinc-500 mb-1 font-bold uppercase tracking-wider">Streak</span>
            <span className="text-[1.1rem] font-bold text-[#f97316]">24</span>
          </div>
          <div>
            <span className="block text-[0.7rem] text-zinc-500 mb-1 font-bold uppercase tracking-wider">Points</span>
            <span className="text-[1.1rem] font-bold text-[#a855f7]">{stats.points}</span>
          </div>
          <div>
            <span className="block text-[0.7rem] text-zinc-500 mb-1 font-bold uppercase tracking-wider">Rank</span>
            <span className="text-[1.1rem] font-bold text-[#06b6d4]">{stats.rank}</span>
          </div>
        </div>
      </div>

      {/* Detailed Performance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-[10px] flex justify-center items-center p-10 animate-in fade-in duration-300">
          <div className="w-full max-w-[900px] bg-[#0f0f12] border border-white/5 rounded-[32px] p-10 relative">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-[1.8rem] font-bold text-white mb-2">Performance History</h1>
                <p className="text-zinc-500">Detailed analysis of your progress since joining</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X size={32} />
              </button>
            </div>

            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#71717a', fontSize: 12 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#71717a', fontSize: 12 }} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f0f12', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#a855f7' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#a855f7" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#a855f7', strokeWidth: 2 }} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
