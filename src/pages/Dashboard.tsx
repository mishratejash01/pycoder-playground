import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { ProgressCards } from '@/components/dashboard/ProgressCards';
import { ActiveEvents } from '@/components/dashboard/ActiveEvents';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { SkillsCloud } from '@/components/dashboard/SkillsCloud';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ActivityCalendar } from '@/components/practice/ActivityCalendar';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { LayoutDashboard, Briefcase, Trophy, GraduationCap, Settings, Bell, User as UserIcon, Search } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

  // --- START LOGIC: PRESERVED EXACTLY ---
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  useEffect(() => {
    if (!sessionLoading && !session) {
      navigate('/auth');
    }
  }, [session, sessionLoading, navigate]);

  const userId = session?.user?.id;

  const { data: profile } = useQuery({
    queryKey: ['dashboard_profile', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId!)
        .maybeSingle();
      return data;
    },
    enabled: !!userId,
  });

  const { data: practiceStats } = useQuery({
    queryKey: ['dashboard_practice_stats', userId],
    queryFn: async () => {
      const { data: problems } = await supabase
        .from('practice_problems')
        .select('id, difficulty');
      
      const { data: submissions } = await supabase
        .from('practice_submissions')
        .select('problem_id, status')
        .eq('user_id', userId!)
        .eq('status', 'completed');

      const solvedIds = new Set(submissions?.map(s => s.problem_id) || []);
      const difficulties = { easy: { solved: 0, total: 0 }, medium: { solved: 0, total: 0 }, hard: { solved: 0, total: 0 } };
      
      problems?.forEach(p => {
        const diff = (p.difficulty?.toLowerCase() || 'easy') as keyof typeof difficulties;
        if (difficulties[diff]) {
          difficulties[diff].total++;
          if (solvedIds.has(p.id)) {
            difficulties[diff].solved++;
          }
        }
      });

      const { data: allSubmissions } = await supabase.from('practice_submissions').select('status').eq('user_id', userId!);
      const total = allSubmissions?.length || 0;
      const accepted = allSubmissions?.filter(s => s.status === 'completed').length || 0;
      const acceptanceRate = total > 0 ? (accepted / total) * 100 : 0;

      return { ...difficulties, acceptanceRate, totalSolved: solvedIds.size, totalProblems: problems?.length || 0 };
    },
    enabled: !!userId,
  });

  const { data: streakData } = useQuery({
    queryKey: ['dashboard_streak', userId],
    queryFn: async () => {
      const { data } = await supabase.from('practice_streaks').select('current_streak, longest_streak').eq('user_id', userId!).maybeSingle();
      return data;
    },
    enabled: !!userId,
  });

  const { data: examStats } = useQuery({
    queryKey: ['dashboard_exam_stats', userId],
    queryFn: async () => {
      const { data: sessions } = await supabase.from('iitm_exam_sessions').select('total_score, subject_id, status').eq('user_id', userId!).eq('status', 'completed');
      if (!sessions || sessions.length === 0) return { totalExams: 0, averageScore: 0, bestScore: 0, subjectsAttempted: 0 };
      const scores = sessions.map(s => s.total_score || 0);
      const subjects = new Set(sessions.map(s => s.subject_id));
      return { totalExams: sessions.length, averageScore: scores.reduce((a, b) => a + b, 0) / scores.length, bestScore: Math.max(...scores), subjectsAttempted: subjects.size };
    },
    enabled: !!userId,
  });

  const { data: userEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['dashboard_events', userId],
    queryFn: async () => {
      const { data: registrations } = await supabase.from('event_registrations').select('event_id, team_name, participation_type').eq('user_id', userId!);
      if (!registrations || registrations.length === 0) return [];
      const eventIds = registrations.map(r => r.event_id);
      const { data: events } = await supabase.from('events').select('id, title, slug, start_date, end_date, location, mode, image_url').in('id', eventIds).order('start_date', { ascending: true });
      return events?.map(event => {
        const reg = registrations.find(r => r.event_id === event.id);
        return { ...event, team_name: reg?.team_name, participation_type: reg?.participation_type };
      }) || [];
    },
    enabled: !!userId,
  });

  const { data: recentSubmissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ['dashboard_submissions', userId],
    queryFn: async () => {
      const { data: submissions } = await supabase.from('practice_submissions').select('id, problem_id, status, language, submitted_at, runtime_ms').eq('user_id', userId!).order('submitted_at', { ascending: false }).limit(15);
      if (!submissions || submissions.length === 0) return [];
      const problemIds = [...new Set(submissions.map(s => s.problem_id).filter(Boolean))];
      const { data: problems } = await supabase.from('practice_problems').select('id, title, slug').in('id', problemIds);
      const problemMap = new Map(problems?.map(p => [p.id, p]) || []);
      return submissions.map(s => ({ ...s, problem_title: problemMap.get(s.problem_id)?.title, problem_slug: problemMap.get(s.problem_id)?.slug }));
    },
    enabled: !!userId,
  });

  const { data: skills } = useQuery({
    queryKey: ['dashboard_skills', userId],
    queryFn: async () => {
      const { data: submissions } = await supabase.from('practice_submissions').select('problem_id').eq('user_id', userId!).eq('status', 'completed');
      if (!submissions || submissions.length === 0) return [];
      const problemIds = [...new Set(submissions.map(s => s.problem_id).filter(Boolean))];
      const { data: problems } = await supabase.from('practice_problems').select('tags').in('id', problemIds);
      const tagCounts: Record<string, number> = {};
      problems?.forEach(p => p.tags?.forEach((tag: string) => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; }));
      return Object.entries(tagCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    },
    enabled: !!userId,
  });

  const { data: monthlySubmissions } = useQuery({
    queryKey: ['dashboard_monthly', userId],
    queryFn: async () => {
      const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
      const { count } = await supabase.from('practice_submissions').select('id', { count: 'exact', head: true }).eq('user_id', userId!).gte('submitted_at', startOfMonth.toISOString());
      return count || 0;
    },
    enabled: !!userId,
  });

  const totalPoints = practiceStats ? (practiceStats.easy.solved * 10) + (practiceStats.medium.solved * 20) + (practiceStats.hard.solved * 40) : 0;
  const lastProblemSlug = recentSubmissions?.[0]?.problem_slug;
  // --- END LOGIC ---

  if (sessionLoading) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Skeleton className="h-12 w-12 rounded-full" /></div>;
  }

  if (!session) return null;

  return (
    <div className="flex min-h-screen bg-[#050505] text-zinc-300 font-sans">
      {/* SIDEBAR: Matches the dark blue-gray left panel in your photo */}
      <aside className="w-64 border-r border-zinc-800/50 bg-[#0a0a0b] hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="p-6">
          <div className="text-blue-500 font-bold text-2xl tracking-tighter mb-8">CODEVO</div>
          <nav className="space-y-1">
            {[
              { label: 'Dashboard', icon: LayoutDashboard, active: true },
              { label: 'Practice Arena', icon: Briefcase },
              { label: 'Opportunities', icon: Trophy },
              { label: 'IITM Exams', icon: GraduationCap },
            ].map((item) => (
              <div key={item.label} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${item.active ? 'bg-blue-600/10 text-blue-500 font-medium' : 'hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300'}`}>
                <item.icon size={20} />
                <span>{item.label}</span>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-zinc-800/50">
          <div className="flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-zinc-300 cursor-pointer">
            <Settings size={20} />
            <span>Settings</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col">
        {/* TOP NAV BAR: Matches the "Organizer Panel" bar in photo */}
        <header className="h-16 border-b border-zinc-800/50 bg-[#0a0a0b]/80 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-50">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
             <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                <input type="text" placeholder="Search problems or events..." className="bg-zinc-900/50 border border-zinc-800 rounded-full py-1.5 pl-10 pr-4 w-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all" />
             </div>
          </div>
          <div className="flex items-center gap-6">
            <Bell size={20} className="text-zinc-500 cursor-pointer hover:text-white" />
            <div className="flex items-center gap-3 pl-6 border-l border-zinc-800">
               <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-white">{profile?.full_name || 'Student'}</div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest">{totalPoints} Points</div>
               </div>
               <div className="h-10 w-10 rounded-full bg-blue-600/20 border border-blue-500/50 flex items-center justify-center text-blue-500 font-bold">
                  {profile?.full_name?.[0] || <UserIcon size={18} />}
               </div>
            </div>
          </div>
        </header>

        {/* DASHBOARD CONTENT BODY */}
        <div className="p-8 max-w-[1600px] mx-auto w-full space-y-8">
          {/* Welcome Title */}
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Welcome Back, {profile?.full_name?.split(' ')[0] || 'Coder'} 👋</h1>
            <p className="text-zinc-500 mt-1">Here is a summary of your overall coding performance</p>
          </div>

          {/* Top Bento Row: Matches the 4 status boxes in photo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <StatsOverview
                problemsSolved={practiceStats?.totalSolved || 0}
                totalProblems={practiceStats?.totalProblems || 0}
                currentStreak={streakData?.current_streak || 0}
                totalPoints={totalPoints}
                submissionsThisMonth={monthlySubmissions || 0}
              />
          </div>

          {/* Middle Layout: Matches Main Panel + Alerts Sidebar in photo */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column (Main Panel) */}
            <div className="lg:col-span-8 space-y-8">
               {/* 1. Practice Activity Calendar */}
               <section className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-6">Learning Consistency</h2>
                  <ActivityCalendar userId={userId} />
               </section>

               {/* 2. Registered Events (The "Recent Listing" area) */}
               <section>
                  <ActiveEvents events={userEvents || []} isLoading={eventsLoading} />
               </section>

               {/* 3. Progress Details */}
               <section>
                  <ProgressCards
                    practiceStats={practiceStats || { easy: { solved: 0, total: 0 }, medium: { solved: 0, total: 0 }, hard: { solved: 0, total: 0 }, acceptanceRate: 0 }}
                    examStats={examStats || { totalExams: 0, averageScore: 0, bestScore: 0, subjectsAttempted: 0 }}
                  />
               </section>
            </div>

            {/* Right Column (The "Alerts/Upcoming" Sidebar in photo) */}
            <div className="lg:col-span-4 space-y-6 sticky top-24">
               {/* Quick Actions Panel */}
               <QuickActions lastProblemSlug={lastProblemSlug} />

               {/* Recent Submissions Feed */}
               <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Live Updates</h2>
                  <RecentActivity submissions={recentSubmissions || []} isLoading={submissionsLoading} />
               </div>

               {/* Skills Breakdown */}
               <SkillsCloud skills={skills || []} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
