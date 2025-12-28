import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Trophy, History, Calendar, Zap, Target, Flame, Clock, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/Header'; 
import { Session } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  username: string | null;
  avatar_url: string | null;
  problems_solved: number;
  total_score: number;
  current_streak: number;
  time_spent_minutes: number;
}

const Leaderboard = () => {
  const [timeframe, setTimeframe] = useState<'all_time' | 'this_month' | 'this_week'>('all_time');
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
  }, []);

  const { data: leaderboardData = [], isLoading } = useQuery({
    queryKey: ['practice_leaderboard', timeframe],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_practice_leaderboard', {
        p_timeframe: timeframe,
        p_limit: 50
      });
      if (error) return [];
      return (data || []) as LeaderboardEntry[];
    },
  });

  const top3 = leaderboardData.slice(0, 3);
  const rest = leaderboardData.slice(3);
  const currentUserRank = session?.user?.id 
    ? leaderboardData.findIndex(u => u.user_id === session.user.id) + 1
    : 0;

  const PodiumItem = ({ user, rank }: { user: LeaderboardEntry; rank: number }) => (
    <div className={cn(
      "flex flex-col items-center text-center",
      rank === 1 ? "order-2 -translate-y-8" : rank === 2 ? "order-1" : "order-3"
    )}>
      <div className={cn(
        "relative p-1 rounded-full border-2 mb-4",
        rank === 1 ? "border-[#c5a059]" : rank === 2 ? "border-[#a8a9ad]" : "border-[#9c6b48]"
      )}>
        <Avatar className={cn(rank === 1 ? "w-28 h-28" : "w-20 h-20")}>
          <AvatarImage src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.user_id}`} />
          <AvatarFallback>{user.full_name?.slice(0,2).toUpperCase()}</AvatarFallback>
        </Avatar>
      </div>
      <h3 className="font-serif italic font-semibold text-lg text-white mb-1">{user.full_name}</h3>
      <p className={cn(
        "font-bold text-xl tracking-tight",
        rank === 1 ? "text-[#c5a059]" : "text-white"
      )}>
        {user.total_score.toLocaleString()} <span className="text-[10px] text-zinc-500 uppercase ml-1 font-bold">XP</span>
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0c0d0e] text-[#e4e4e7] font-sans selection:bg-[#c5a059]/30">
      <Header session={session} onLogout={() => supabase.auth.signOut()} />
      
      {/* Luxury Background Glow */}
      <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-4/5 h-[500px] bg-[radial-gradient(circle,rgba(197,160,89,0.05)_0%,transparent_70%)] pointer-events-none z-0" />

      <div className="relative z-10 container mx-auto px-6 max-w-4xl pt-32 pb-20">
        <header className="text-center mb-20">
          <span className="text-[11px] uppercase tracking-[3px] text-[#c5a059] font-bold mb-4 block">Official Rankings</span>
          <h1 className="font-serif italic text-6xl font-semibold mb-4 tracking-tight text-white">Hall of Fame</h1>
          <p className="text-zinc-500 text-sm max-w-md mx-auto">Recognizing the top performing members of our global community.</p>
          
          <nav className="flex justify-center gap-8 mt-12 border-b border-white/5">
            {[
              { id: 'this_week', label: 'Weekly', icon: Zap },
              { id: 'this_month', label: 'Monthly', icon: Calendar },
              { id: 'all_time', label: 'All Time', icon: History }
            ].map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id as any)}
                className={cn(
                  "pb-3 text-xs uppercase tracking-widest font-bold transition-all border-b-2",
                  timeframe === tf.id ? "text-[#c5a059] border-[#c5a059]" : "text-zinc-500 border-transparent hover:text-white"
                )}
              >
                {tf.label}
              </button>
            ))}
          </nav>
        </header>

        {/* Podium */}
        {!isLoading && leaderboardData.length > 0 && (
          <section className="flex justify-center items-end gap-6 md:gap-16 mb-20">
            {top3.length >= 2 && <PodiumItem user={top3[1]} rank={2} />}
            {top3.length >= 1 && <PodiumItem user={top3[0]} rank={1} />}
            {top3.length >= 3 && <PodiumItem user={top3[2]} rank={3} />}
          </section>
        )}

        {/* Integrated Table */}
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 text-[10px] uppercase font-bold tracking-[2px] text-zinc-500">
            <div className="col-span-1">Rank</div>
            <div className="col-span-6">Member</div>
            <div className="col-span-2 text-center hidden md:block">Stats</div>
            <div className="col-span-3 text-right">Total Score</div>
          </div>

          <AnimatePresence mode="popLayout">
            {isLoading ? (
              [1, 2, 3].map(i => <div key={i} className="h-20 w-full bg-white/5 rounded-xl animate-pulse" />)
            ) : (
              rest.map((user, idx) => {
                const rank = idx + 4;
                const isCurrentUser = session?.user?.id === user.user_id;

                return (
                  <motion.div
                    key={user.user_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "grid grid-cols-12 gap-4 items-center px-6 py-5 rounded-xl border transition-all duration-300",
                      isCurrentUser 
                        ? "bg-[#c5a059]/5 border-[#c5a059]/30" 
                        : "bg-[#141517] border-white/5 hover:border-[#c5a059]/30 hover:scale-[1.01]"
                    )}
                  >
                    <div className="col-span-1 font-serif italic text-lg text-zinc-500">
                      {String(rank).padStart(2, '0')}
                    </div>

                    <div className="col-span-6 flex items-center gap-4">
                      <Avatar className="w-9 h-9 border border-white/5">
                        <AvatarImage src={user.avatar_url || ''} />
                        <AvatarFallback className="bg-zinc-800 text-[10px]">{user.full_name?.slice(0,2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <span className="block font-semibold text-sm text-white truncate">{user.full_name}</span>
                        <span className="block text-[10px] text-zinc-500 font-mono truncate">@{user.username || 'user'}</span>
                      </div>
                    </div>

                    <div className="col-span-2 hidden md:flex items-center justify-center gap-4">
                      <div className="flex flex-col items-center">
                        <Target className="w-3 h-3 text-emerald-500 mb-1" />
                        <span className="text-[10px] font-bold text-zinc-400">{user.problems_solved}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <Flame className="w-3 h-3 text-orange-500 mb-1" />
                        <span className="text-[10px] font-bold text-zinc-400">{user.current_streak}</span>
                      </div>
                    </div>

                    <div className="col-span-3 text-right font-bold text-white text-base">
                      {user.total_score.toLocaleString()}
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Italy Style Floating Footer for User Rank */}
        {session && currentUserRank > 3 && (
          <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
            <div className="bg-[#141517] border border-[#c5a059]/40 rounded-full py-3 px-6 flex items-center justify-between shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <span className="font-serif italic text-[#c5a059] text-xl">#{currentUserRank}</span>
                <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Your Standing</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-zinc-500 hover:text-white p-0 h-auto">
                <ChevronUp className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}

        <footer className="mt-32 text-center">
          <p className="text-[11px] uppercase tracking-[3px] text-zinc-600 font-bold italic">
            Results updated every 24 hours
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Leaderboard;
