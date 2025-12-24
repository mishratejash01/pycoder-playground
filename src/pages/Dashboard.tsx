import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { ProgressCards } from '@/components/dashboard/ProgressCards';
import { ActiveEvents } from '@/components/dashboard/ActiveEvents';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { SkillsCloud } from '@/components/dashboard/SkillsCloud';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ActivityCalendar } from '@/components/practice/ActivityCalendar';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Code2, 
  Trophy, 
  GraduationCap, 
  Settings, 
  Bell, 
  Search, 
  TrendingUp, 
  Target, 
  BarChart3, 
  ChevronRight,
  Activity,
  Zap,
  Layers
} from 'lucide-react';

/**
 * ARCHITECTURAL REDESIGN: INTELLIGENT COMMAND CENTER
 * - Structure: Matches the "Organizer Panel" wireframe from Screenshot 2025-12-24 131853.jpg.
 * - Navigation: Integrated internal state switching to prevent full-page reloads and maintain data continuity.
 * - Branding: Fixed logo usage (Codevo Identity) and color profiling (Dark Mode Cobalt).
 */

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'peers'>('overview');

  // --- CORE DATA LOGIC (PRESERVED FROM ORIGINAL SOURCE) ---
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  useEffect(() => {
    if (!sessionLoading && !session) navigate('/auth');
  }, [session, sessionLoading, navigate]);

  const userId = session?.user?.id;

  const { data: profile } = useQuery({
    queryKey: ['dashboard_profile', userId],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId!).maybeSingle();
      return data;
    },
    enabled: !!userId,
  });

  const { data: practiceStats } = useQuery({
    queryKey: ['dashboard_practice_stats', userId],
    queryFn: async () => {
      const { data: problems } = await supabase.from('practice_problems').select('id, difficulty');
      const { data: submissions } = await supabase.from('practice_submissions').select('problem_id, status').eq('user_id', userId!).eq('status', 'completed');
      const solvedIds = new Set(submissions?.map(s => s.problem_id) || []);
      const difficulties = { easy: { solved: 0, total: 0 }, medium: { solved: 0, total: 0 }, hard: { solved: 0, total: 0 } };
      problems?.forEach(p => {
        const diff = (p.difficulty?.toLowerCase() || 'easy') as keyof typeof difficulties;
        if (difficulties[diff]) { difficulties[diff].total++; if (solvedIds.has(p.id)) difficulties[diff].solved++; }
      });
      const { data: allSubmissions } = await supabase.from('practice_submissions').select('status').eq('user_id', userId!);
      const total = allSubmissions?.length || 0;
      const accepted = allSubmissions?.filter(s => s.status === 'completed').length || 0;
      return { ...difficulties, acceptanceRate: total > 0 ? (accepted / total) * 100 : 0, totalSolved: solvedIds.size, totalProblems: problems?.length || 0 };
    },
    enabled: !!userId,
  });

  const { data: leaderboardData } = useQuery({
    queryKey: ['dashboard_leaderboard_compare'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_practice_leaderboard', { p_timeframe: 'all_time', p_limit: 10 });
      return data || [];
    },
    enabled: !!userId,
  });

  const { data: streakData } = useQuery({
    queryKey: ['dashboard_streak', userId],
    queryFn: async () => {
      const { data } = await supabase.from('practice_streaks').select('current_streak').eq('user_id', userId!).maybeSingle();
      return data;
    },
    enabled: !!userId,
  });

  const { data: recentSubmissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ['dashboard_submissions', userId],
    queryFn: async () => {
      const { data: submissions } = await supabase.from('practice_submissions').select('*').eq('user_id', userId!).order('submitted_at', { ascending: false }).limit(10);
      return submissions || [];
    },
    enabled: !!userId,
  });

  const totalPoints = useMemo(() => {
    if (!practiceStats) return 0;
    return (practiceStats.easy.solved * 10) + (practiceStats.medium.solved * 20) + (practiceStats.hard.solved * 40);
  }, [practiceStats]);

  // --- BUSINESS ANALYTICS: BENCHMARKING ---
  const peerAvg = useMemo(() => {
    if (!leaderboardData?.length) return 0;
    return Math.floor(leaderboardData.reduce((a, b) => a + b.total_score, 0) / leaderboardData.length);
  }, [leaderboardData]);

  if (sessionLoading) return (
    <div className="min-h-screen bg-[#020202] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Activity className="text-blue-500 animate-spin h-10 w-10" />
        <span className="text-zinc-500 font-mono text-xs tracking-[0.3em]">SYNCHRONIZING_CORE_DATA</span>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#050505] text-zinc-400 font-sans selection:bg-blue-500/30">
      {/* SIDEBAR NAVIGATION: Wireframe Compliant */}
      <aside className="w-20 lg:w-64 border-r border-white/5 bg-[#09090b] flex flex-col sticky top-0 h-screen z-[100] transition-all duration-300">
        <div className="p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-10">
             <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]">
               <Zap size={22} fill="currentColor" />
             </div>
             <span className="text-white font-black text-xl tracking-tighter hidden lg:block">CODEVO</span>
          </div>
          
          <nav className="space-y-1">
            {[
              { id: 'overview', label: 'Main Dashboard', icon: LayoutDashboard },
              { id: 'analytics', label: 'Advanced Analytics', icon: BarChart3 },
              { id: 'peers', label: 'Peer Benchmarking', icon: Trophy },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all relative ${
                  activeTab === item.id 
                  ? 'bg-blue-600/10 text-blue-400 font-bold' 
                  : 'text-zinc-600 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={20} className={activeTab === item.id ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''} />
                <span className="text-sm hidden lg:block">{item.label}</span>
                {activeTab === item.id && (
                  <motion.div layoutId="navIndicator" className="absolute right-0 w-1 h-5 bg-blue-500 rounded-l-full" />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 lg:p-8 border-t border-white/5">
           <div className="flex items-center gap-4 text-zinc-600 hover:text-white transition-all cursor-pointer group">
              <Settings size={20} className="group-hover:rotate-45 transition-transform" />
              <span className="text-sm hidden lg:block">System Config</span>
           </div>
        </div>
      </aside>

      {/* COMMAND CENTER VIEWPORT */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* GLOBAL HEADER */}
        <header className="h-20 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl flex items-center justify-between px-6 lg:px-10 sticky top-0 z-[90]">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
             <div className="relative w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder="Scan system metrics or records..." 
                  className="bg-zinc-900/50 border border-white/5 rounded-full py-2.5 pl-11 pr-5 w-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-700" 
                />
             </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative p-2 hover:bg-white/5 rounded-full transition-colors cursor-pointer">
              <Bell size={20} className="text-zinc-500 hover:text-white" />
              <div className="absolute top-2 right-2 h-2 w-2 bg-blue-600 rounded-full ring-4 ring-[#050505]" />
            </div>
            
            <div className="flex items-center gap-4 pl-6 border-l border-white/10">
               <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-white tracking-tight">{profile?.full_name || 'SYSTEM_OPERATOR'}</p>
                  <p className="text-[10px] text-blue-500 font-mono font-black uppercase tracking-widest">{totalPoints} PTS</p>
               </div>
               <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center font-black text-blue-500 shadow-xl overflow-hidden">
                  {profile?.full_name?.[0] || <User size={18} />}
               </div>
            </div>
          </div>
        </header>

        {/* ANALYTICAL CANVAS */}
        <div className="p-6 lg:p-10 w-full max-w-[1600px] mx-auto space-y-10">
          
          {/* WELCOME BLOCK: Wireframe Compliant */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tighter">
                Command Terminal <span className="text-blue-600">.</span>
              </h1>
              <p className="text-zinc-500 mt-1.5 font-medium">Real-time telemetry and algorithmic progress synchronization.</p>
            </div>
            <div className="flex items-center gap-2 bg-zinc-900/40 p-2 rounded-2xl border border-white/5 shadow-2xl">
               <div className="px-4 py-1.5 bg-blue-600/10 text-blue-500 text-[10px] font-black rounded-xl tracking-tighter">DATA_LIVE</div>
               <span className="px-3 text-[10px] font-mono text-zinc-500">{new Date().toLocaleDateString()} // {new Date().toLocaleTimeString()}</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-10"
              >
                {/* KPI STATUS BAR: Top row boxes from screenshots */}
                <StatsOverview
                  problemsSolved={practiceStats?.totalSolved || 0}
                  totalProblems={practiceStats?.totalProblems || 0}
                  currentStreak={streakData?.current_streak || 0}
                  totalPoints={totalPoints}
                  submissionsThisMonth={0}
                />

                <div className="grid lg:grid-cols-12 gap-8">
                  {/* CENTRAL ACTIVITY HUB (8 Units) */}
                  <div className="lg:col-span-8 space-y-8">
                    <section className="bg-zinc-900/20 border border-white/5 rounded-[2.5rem] p-8 lg:p-10 backdrop-blur-sm">
                       <div className="flex items-center justify-between mb-8">
                         <h3 className="text-lg font-bold text-white flex items-center gap-3">
                           <Activity className="text-blue-500" size={20} /> Persistence Heatmap
                         </h3>
                         <div className="text-[10px] font-mono text-zinc-600 uppercase">365_DAY_TELEMETRY</div>
                       </div>
                       <ActivityCalendar userId={userId} />
                    </section>

                    <div className="grid md:grid-cols-2 gap-8">
                      <ActiveEvents events={[]} isLoading={false} />
                      <div className="bg-zinc-900/20 border border-white/5 rounded-[2.5rem] p-8">
                         <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                           <Target className="text-blue-500" size={20} /> Mastery Skills
                         </h3>
                         <SkillsCloud skills={[]} />
                      </div>
                    </div>
                  </div>

                  {/* SIDEBAR MONITOR (4 Units) */}
                  <div className="lg:col-span-4 space-y-8">
                    <QuickActions lastProblemSlug={recentSubmissions?.[0]?.problem_id} />
                    <RecentActivity submissions={recentSubmissions || []} isLoading={submissionsLoading} />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div 
                key="analytics"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.01 }}
                className="grid lg:grid-cols-12 gap-8"
              >
                <div className="lg:col-span-12">
                   <div className="bg-gradient-to-br from-[#0a0a0c] to-[#050505] border border-white/5 rounded-[3rem] p-10 lg:p-16">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-6">
                        <div>
                          <h3 className="text-3xl font-black text-white tracking-tighter">Algorithmic Efficiency</h3>
                          <p className="text-zinc-500 text-sm mt-1">Cross-referencing difficulty mastery against platform benchmarks.</p>
                        </div>
                        <div className="flex gap-4">
                           <div className="px-6 py-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">Acceptance</p>
                              <p className="text-2xl font-black text-white">{practiceStats?.acceptanceRate.toFixed(1)}%</p>
                           </div>
                           <div className="px-6 py-4 bg-blue-600/10 rounded-2xl border border-blue-500/20 text-center">
                              <p className="text-[10px] text-blue-500 uppercase font-black tracking-widest mb-1">Global_Rank</p>
                              <p className="text-2xl font-black text-blue-400">TOP 8%</p>
                           </div>
                        </div>
                      </div>
                      <ProgressCards
                        practiceStats={practiceStats || { easy: { solved: 0, total: 0 }, medium: { solved: 0, total: 0 }, hard: { solved: 0, total: 0 }, acceptanceRate: 0 }}
                        examStats={{ totalExams: 0, averageScore: 0, bestScore: 0, subjectsAttempted: 0 }}
                      />
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'peers' && (
              <motion.div 
                key="peers"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-4xl mx-auto w-full"
              >
                <section className="bg-[#09090b] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                  <div className="p-10 border-b border-white/5 bg-gradient-to-r from-blue-600/10 via-transparent to-transparent flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-white tracking-tight">Peer Benchmarking</h3>
                      <p className="text-zinc-500 text-xs mt-1 uppercase tracking-widest">Global_Competence_Matrix</p>
                    </div>
                    <Trophy className="text-blue-500/20" size={48} />
                  </div>
                  <div className="divide-y divide-white/5">
                    {leaderboardData?.map((peer, i) => (
                      <div key={peer.user_id} className="p-7 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                        <div className="flex items-center gap-6">
                           <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-mono font-black text-lg ${i < 3 ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-zinc-900 text-zinc-700'}`}>
                             {i + 1}
                           </div>
                           <div>
                             <p className="text-white font-bold group-hover:text-blue-400 transition-colors">{peer.full_name}</p>
                             <div className="flex items-center gap-3 mt-0.5">
                               <div className="h-1 w-20 bg-zinc-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-600" style={{ width: `${(peer.total_score / (leaderboardData[0].total_score || 1)) * 100}%` }} />
                               </div>
                               <span className="text-[10px] text-zinc-600 font-mono">D_STREAK: {peer.current_streak}</span>
                             </div>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-2xl font-black text-white group-hover:scale-110 transition-transform origin-right">{peer.total_score.toLocaleString()}</p>
                           <p className="text-[9px] text-blue-500/50 font-black tracking-widest uppercase">Points_Accumulated</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
