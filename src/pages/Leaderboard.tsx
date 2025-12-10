import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Calendar, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/Header'; 

const Leaderboard = () => {
  const [timeframe, setTimeframe] = useState<'current' | 'last_month'>('current');

  // Fetch Leaderboard Data
  const { data: leaderboardData = [], isLoading } = useQuery({
    queryKey: ['global_leaderboard', timeframe],
    queryFn: async () => {
      // Date Filtering Logic
      const now = new Date();
      const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

      // We use iitm_exam_sessions to aggregate scores dynamically
      const { data, error } = await supabase
        .from('iitm_exam_sessions') 
        .select(`
          user_id,
          total_score,
          duration_seconds,
          end_time,
          full_name,
          user_email
        `)
        .eq('status', 'completed')
        .gt('total_score', 0);

      if (error) {
        console.error("Leaderboard fetch error:", error);
        return [];
      }

      // 1. Filter by Date
      const filtered = data.filter((item: any) => {
        if (!item.end_time) return false;
        const d = new Date(item.end_time);
        if (timeframe === 'current') return d >= new Date(firstDayCurrentMonth);
        if (timeframe === 'last_month') return d >= new Date(firstDayLastMonth) && d <= new Date(lastDayLastMonth);
        return true;
      });

      // 2. Aggregate by User (Summing Total Score for "Overall" Ranking)
      const userMap = new Map();
      
      filtered.forEach((session: any) => {
        if (!userMap.has(session.user_id)) {
          userMap.set(session.user_id, {
            user_id: session.user_id,
            full_name: session.full_name,
            user_email: session.user_email,
            total_score: 0,
            duration_seconds: 0,
            end_time: session.end_time, // Track latest activity
            exams_count: 0
          });
        }
        
        const user = userMap.get(session.user_id);
        user.total_score += (Number(session.total_score) || 0);
        user.duration_seconds += (session.duration_seconds || 0);
        user.exams_count += 1;
        
        // Keep the most recent date for display
        if (new Date(session.end_time) > new Date(user.end_time)) {
          user.end_time = session.end_time;
        }
      });

      // 3. Sort & Slice
      return Array.from(userMap.values())
        .sort((a: any, b: any) => b.total_score - a.total_score) // Highest Score First
        .slice(0, 50); // Top 50
    }
  });

  const getRankStyle = (index: number) => {
    switch (index) {
      case 0: return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.3)]";
      case 1: return "bg-gray-400/20 text-gray-400 border-gray-400/50 shadow-[0_0_15px_rgba(156,163,175,0.3)]";
      case 2: return "bg-amber-700/20 text-amber-600 border-amber-700/50 shadow-[0_0_15px_rgba(180,83,9,0.3)]";
      default: return "bg-white/5 text-muted-foreground border-white/10";
    }
  };

  const getMedalIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500 fill-current" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400 fill-current" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-700 fill-current" />;
    return <span className="font-mono font-bold text-sm w-5 text-center">#{index + 1}</span>;
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white pt-24 pb-20 px-4 relative overflow-hidden font-sans">
      <Header />
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-primary/20 blur-[120px] pointer-events-none rounded-full" />

      {/* Main Container */}
      <div className="w-full px-4 md:px-12 mx-auto relative z-10 space-y-10 max-w-6xl">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-7xl font-bold font-neuropol tracking-wide bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent drop-shadow-2xl">
            Hall of Fame
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm md:text-base">
            Celebrating the top performers of {timeframe === 'current' ? 'this month' : 'last month'}. 
            <br className="hidden md:block" /> Scores are aggregated across all exams.
          </p>
        </div>

        {/* Filters */}
        <div className="flex justify-center">
          <Tabs defaultValue="current" className="w-[400px]" onValueChange={(v: any) => setTimeframe(v)}>
            <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-white/10 p-1 h-12 rounded-xl">
              <TabsTrigger value="current" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg font-medium">
                <Calendar className="w-4 h-4 mr-2" /> This Month
              </TabsTrigger>
              <TabsTrigger value="last_month" className="data-[state=active]:bg-white/10 rounded-lg font-medium">
                <History className="w-4 h-4 mr-2" /> Past Month
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Leaderboard Card */}
        <Card className="bg-[#0c0c0e]/80 border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden w-full">
          <CardHeader className="border-b border-white/5 pb-4 px-6 md:px-8">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" /> 
                {timeframe === 'current' ? 'Current Standings' : 'Historical Records'}
              </CardTitle>
              <span className="text-xs text-muted-foreground uppercase tracking-widest font-mono bg-white/5 px-2 py-1 rounded">
                Top {leaderboardData.length}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 space-y-4">
                {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}
              </div>
            ) : leaderboardData.length > 0 ? (
              <div className="divide-y divide-white/5">
                {leaderboardData.map((user: any, index: number) => (
                  <div 
                    key={index} 
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 hover:bg-white/5 transition-colors group gap-4 md:gap-0"
                  >
                    <div className="flex items-center gap-4 md:gap-6">
                      {/* Rank Indicator */}
                      <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border bg-gradient-to-br shrink-0 transition-transform group-hover:scale-110", getRankStyle(index))}>
                        {getMedalIcon(index)}
                      </div>
                      
                      {/* User Info */}
                      <div className="flex items-center gap-4">
                        <Avatar className="w-10 h-10 md:w-12 md:h-12 border border-white/10 ring-2 ring-transparent group-hover:ring-white/10 transition-all">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.user_id}`} />
                          <AvatarFallback className="bg-white/10 text-xs">{user.full_name?.slice(0,2) || 'VN'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold text-white flex items-center gap-2 text-base md:text-lg">
                            {user.full_name || user.user_email?.split('@')[0] || 'Anonymous'}
                            {index === 0 && <span className="text-[9px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full border border-yellow-500/30 tracking-wider">KING</span>}
                          </div>
                          <div className="text-xs md:text-sm text-muted-foreground font-mono flex items-center gap-3">
                             <span>{user.exams_count} Exams</span>
                             <span className="text-white/10">|</span>
                             <span>Last: {new Date(user.end_time).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="flex md:block items-center justify-between md:text-right pl-16 md:pl-0">
                      <div className="md:hidden text-xs text-muted-foreground uppercase tracking-wider">Total Score</div>
                      <div>
                        <div className="text-2xl md:text-3xl font-bold font-mono text-white group-hover:text-primary transition-colors">
                          {user.total_score}
                        </div>
                        <div className="hidden md:block text-[10px] text-muted-foreground uppercase tracking-wider">Total Points</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-20 text-center text-muted-foreground flex flex-col items-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                  <Trophy className="w-10 h-10 opacity-20" />
                </div>
                <p className="text-lg font-medium text-white/50">No champions found for this period.</p>
                <Button variant="link" className="mt-2 text-primary" onClick={() => window.location.href='/degree'}>
                  Compete Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Leaderboard;
