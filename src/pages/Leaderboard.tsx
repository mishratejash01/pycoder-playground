import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Calendar, History, Flame, Clock, Target, TrendingUp, Infinity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/Header'; 
import { Session } from '@supabase/supabase-js';

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  username: string | null;
  avatar_url: string | null;
  problems_solved: number;
  total_score: number;
  total_submissions: number;
  current_streak: number;
  longest_streak: number;
  time_spent_minutes: number;
  last_active: string;
}

const Leaderboard = () => {
  const [timeframe, setTimeframe] = useState<'all_time' | 'this_month' | 'this_week'>('all_time');
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  // Fetch Leaderboard Data using the new RPC function
  const { data: leaderboardData = [], isLoading } = useQuery({
    queryKey: ['practice_leaderboard', timeframe],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_practice_leaderboard', {
        p_timeframe: timeframe,
        p_limit: 50
      });

      if (error) {
        console.error('Leaderboard fetch error:', error);
        return [];
      }

      return (data || []) as LeaderboardEntry[];
    },
  });

  // Find current user's position
  const currentUserRank = session?.user?.id 
    ? leaderboardData.findIndex(u => u.user_id === session.user.id) + 1
    : 0;

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

  const formatTimeSpent = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case 'this_week': return 'this week';
      case 'this_month': return 'this month';
      default: return 'all time';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-20 px-4 relative overflow-hidden font-sans">
      <Header session={session} onLogout={handleLogout} />
      
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
            Celebrating the top performers of {getTimeframeLabel()}. 
            <br className="hidden md:block" /> Ranked by problems solved, points earned & activity.
          </p>
        </div>

        {/* Current User Position Banner */}
        {session && currentUserRank > 0 && (
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-sm">
                You're ranked <span className="font-bold text-primary">#{currentUserRank}</span> {getTimeframeLabel()}!
              </span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex justify-center">
          <Tabs value={timeframe} className="w-full max-w-md" onValueChange={(v: any) => setTimeframe(v)}>
            <TabsList className="grid w-full grid-cols-3 bg-card/50 border border-border/50 p-1 h-12 rounded-xl">
              <TabsTrigger value="all_time" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg font-medium text-xs md:text-sm">
                <Infinity className="w-4 h-4 mr-1 md:mr-2" /> All Time
              </TabsTrigger>
              <TabsTrigger value="this_month" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg font-medium text-xs md:text-sm">
                <Calendar className="w-4 h-4 mr-1 md:mr-2" /> Month
              </TabsTrigger>
              <TabsTrigger value="this_week" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg font-medium text-xs md:text-sm">
                <History className="w-4 h-4 mr-1 md:mr-2" /> Week
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Stats Legend */}
        <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span>Problems Solved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            <span>Total Points</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>Current Streak</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span>Time on Platform</span>
          </div>
        </div>

        {/* Leaderboard Card */}
        <Card className="bg-card/80 border-border/50 backdrop-blur-xl shadow-2xl overflow-hidden w-full">
          <CardHeader className="border-b border-border/50 pb-4 px-6 md:px-8">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" /> 
                {timeframe === 'all_time' ? 'All-Time Champions' : timeframe === 'this_month' ? 'Monthly Leaders' : 'Weekly Stars'}
              </CardTitle>
              <Badge variant="outline" className="text-xs uppercase tracking-widest font-mono">
                Top {leaderboardData.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 space-y-4">
                {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-secondary/50 rounded-xl animate-pulse" />)}
              </div>
            ) : leaderboardData.length > 0 ? (
              <div className="divide-y divide-border/50">
                {leaderboardData.map((user, index) => {
                  const isCurrentUser = session?.user?.id === user.user_id;
                  
                  return (
                    <div 
                      key={user.user_id} 
                      className={cn(
                        "flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 hover:bg-secondary/30 transition-colors group gap-4 md:gap-0",
                        isCurrentUser && "bg-primary/5 border-l-2 border-l-primary"
                      )}
                    >
                      <div className="flex items-center gap-4 md:gap-6">
                        {/* Rank Indicator */}
                        <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border bg-gradient-to-br shrink-0 transition-transform group-hover:scale-110", getRankStyle(index))}>
                          {getMedalIcon(index)}
                        </div>
                        
                        {/* User Info */}
                        <div className="flex items-center gap-4">
                          <Link to={user.username ? `/u/${user.username}` : '#'}>
                            <Avatar className="w-10 h-10 md:w-12 md:h-12 border border-border ring-2 ring-transparent group-hover:ring-primary/30 transition-all">
                              <AvatarImage src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.user_id}`} />
                              <AvatarFallback className="bg-secondary text-xs">{user.full_name?.slice(0,2).toUpperCase() || 'AN'}</AvatarFallback>
                            </Avatar>
                          </Link>
                          <div>
                            <div className="font-bold text-foreground flex items-center gap-2 text-base md:text-lg">
                              <Link to={user.username ? `/u/${user.username}` : '#'} className="hover:text-primary transition-colors">
                                {user.full_name || 'Anonymous'}
                              </Link>
                              {index === 0 && <span className="text-[9px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full border border-yellow-500/30 tracking-wider">CHAMPION</span>}
                              {isCurrentUser && <span className="text-[9px] bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/30">YOU</span>}
                            </div>
                            <div className="text-xs md:text-sm text-muted-foreground font-mono flex flex-wrap items-center gap-2 md:gap-3">
                              <span className="flex items-center gap-1">
                                <Target className="w-3 h-3 text-emerald-400" />
                                {user.problems_solved}
                              </span>
                              <span className="text-border">|</span>
                              <span className="flex items-center gap-1">
                                <Flame className="w-3 h-3 text-orange-400" />
                                {user.current_streak}d
                              </span>
                              <span className="text-border">|</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-purple-400" />
                                {formatTimeSpent(user.time_spent_minutes)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="flex md:block items-center justify-between md:text-right pl-16 md:pl-0">
                        <div className="md:hidden text-xs text-muted-foreground uppercase tracking-wider">Total Points</div>
                        <div>
                          <div className="text-2xl md:text-3xl font-bold font-mono text-foreground group-hover:text-primary transition-colors">
                            {Number(user.total_score).toLocaleString()}
                          </div>
                          <div className="hidden md:block text-[10px] text-muted-foreground uppercase tracking-wider">
                            {user.total_submissions} submissions
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-20 text-center text-muted-foreground flex flex-col items-center">
                <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mb-6 border border-border">
                  <Trophy className="w-10 h-10 opacity-20" />
                </div>
                <p className="text-lg font-medium text-foreground/50">No champions found for this period.</p>
                <p className="text-sm text-muted-foreground mt-1">Start solving problems to appear on the leaderboard!</p>
                <Button variant="default" className="mt-4" asChild>
                  <Link to="/practice-arena">
                    <Target className="w-4 h-4 mr-2" /> Start Practicing
                  </Link>
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
