import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Calendar, History, TrendingUp, User } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper to format date as "Month Year"
const formatMonth = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('default', { month: 'long', year: 'numeric' });
};

const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState('current');

  // Fetch Current Month Leaderboard
  const { data: currentLeaderboard = [], isLoading: isCurrentLoading } = useQuery({
    queryKey: ['leaderboard', 'current'],
    queryFn: async () => {
      // In a real scenario, this would likely be a materialized view or a complex join
      // For now, we simulate fetching "Top 100" from exam_sessions for the current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('exam_sessions')
        .select('user_id, full_name, total_score, questions_correct, duration_seconds')
        .eq('status', 'completed')
        .gte('created_at', startOfMonth.toISOString())
        .order('total_score', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data.map((entry, index) => ({ ...entry, rank: index + 1 }));
    }
  });

  // Fetch Historical Leaderboard (Past Month Top 20)
  const { data: historyLeaderboard = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: ['leaderboard', 'history'],
    queryFn: async () => {
      // Simulate fetching data for the previous month
      const today = new Date();
      const firstDayPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);

      const { data, error } = await supabase
        .from('exam_sessions')
        .select('user_id, full_name, total_score, questions_correct, created_at')
        .eq('status', 'completed')
        .gte('created_at', firstDayPrevMonth.toISOString())
        .lte('created_at', lastDayPrevMonth.toISOString())
        .order('total_score', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data.map((entry, index) => ({ ...entry, rank: index + 1 }));
    }
  });

  const TopThree = ({ data }: { data: any[] }) => (
    <div className="grid grid-cols-3 gap-4 mb-8 items-end max-w-2xl mx-auto">
      {/* 2nd Place */}
      <div className="flex flex-col items-center order-1">
        <div className="relative">
          <Avatar className="w-16 h-16 border-4 border-gray-400 shadow-[0_0_20px_rgba(156,163,175,0.4)]">
            <AvatarFallback className="bg-gray-800 text-gray-300">2</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-600 text-[10px] text-white px-2 py-0.5 rounded-full font-bold">2ND</div>
        </div>
        <div className="mt-4 text-center">
          <p className="font-bold text-gray-300 text-sm truncate w-24">{data[1]?.full_name || 'Empty'}</p>
          <p className="text-xs text-muted-foreground">{data[1]?.total_score || 0} pts</p>
        </div>
      </div>

      {/* 1st Place */}
      <div className="flex flex-col items-center order-2 -mt-8">
        <div className="relative">
          <div className="absolute -top-8 text-yellow-500 animate-bounce"><Trophy className="w-8 h-8 fill-current" /></div>
          <Avatar className="w-24 h-24 border-4 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.5)]">
            <AvatarFallback className="bg-yellow-950 text-yellow-500 text-xl font-bold">1</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-600 text-xs text-black px-3 py-0.5 rounded-full font-bold">1ST</div>
        </div>
        <div className="mt-4 text-center">
          <p className="font-bold text-yellow-500 text-lg truncate w-32">{data[0]?.full_name || 'Empty'}</p>
          <p className="text-sm text-yellow-500/80">{data[0]?.total_score || 0} pts</p>
        </div>
      </div>

      {/* 3rd Place */}
      <div className="flex flex-col items-center order-3">
        <div className="relative">
          <Avatar className="w-16 h-16 border-4 border-amber-700 shadow-[0_0_20px_rgba(180,83,9,0.4)]">
            <AvatarFallback className="bg-amber-950 text-amber-700">3</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-800 text-[10px] text-white px-2 py-0.5 rounded-full font-bold">3RD</div>
        </div>
        <div className="mt-4 text-center">
          <p className="font-bold text-amber-700 text-sm truncate w-24">{data[2]?.full_name || 'Empty'}</p>
          <p className="text-xs text-muted-foreground">{data[2]?.total_score || 0} pts</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-white pt-24 pb-12 px-4 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 mb-2">Monthly Reset</Badge>
          <h1 className="text-4xl md:text-6xl font-bold font-neuropol tracking-wide">Hall of Fame</h1>
          <p className="text-muted-foreground">Compete, code, and climb the ranks.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="bg-black/40 border border-white/10 p-1 rounded-full">
              <TabsTrigger value="current" className="rounded-full px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                <TrendingUp className="w-4 h-4 mr-2" /> Current Month
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-full px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                <History className="w-4 h-4 mr-2" /> Past History
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="current" className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {!isCurrentLoading && currentLeaderboard.length > 0 && <TopThree data={currentLeaderboard} />}
            
            <Card className="bg-[#0c0c0e] border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Calendar className="w-5 h-5 text-primary" />
                  {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} Standings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="hover:bg-transparent border-white/5">
                      <TableHead className="w-16 text-center text-muted-foreground">Rank</TableHead>
                      <TableHead className="text-muted-foreground">User</TableHead>
                      <TableHead className="text-center text-muted-foreground">Correct</TableHead>
                      <TableHead className="text-right text-muted-foreground">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isCurrentLoading ? (
                      [...Array(5)].map((_, i) => <TableRow key={i}><TableCell colSpan={4} className="h-12"><div className="h-2 bg-white/5 rounded animate-pulse" /></TableCell></TableRow>)
                    ) : (
                      currentLeaderboard.slice(3).map((entry: any) => (
                        <TableRow key={entry.user_id} className="border-white/5 hover:bg-white/5 transition-colors">
                          <TableCell className="text-center font-mono font-bold text-muted-foreground">#{entry.rank}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                <User className="w-4 h-4 text-gray-400" />
                              </div>
                              <span className="font-medium text-gray-200">{entry.full_name || `Coder ${entry.user_id.slice(0, 4)}`}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-gray-400">{entry.questions_correct}</TableCell>
                          <TableCell className="text-right font-bold text-primary">{entry.total_score}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="animate-in fade-in slide-in-from-bottom-4">
             <Card className="bg-[#0c0c0e] border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2"><Medal className="w-5 h-5 text-yellow-500" /> Last Month's Champions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="hover:bg-transparent border-white/5">
                      <TableHead className="w-16 text-center text-muted-foreground">Rank</TableHead>
                      <TableHead className="text-muted-foreground">User</TableHead>
                      <TableHead className="text-right text-muted-foreground">Date</TableHead>
                      <TableHead className="text-right text-muted-foreground">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isHistoryLoading ? (
                       [...Array(3)].map((_, i) => <TableRow key={i}><TableCell colSpan={4} className="h-12"><div className="h-2 bg-white/5 rounded animate-pulse" /></TableCell></TableRow>)
                    ) : historyLeaderboard.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No history available yet.</TableCell></TableRow>
                    ) : (
                      historyLeaderboard.map((entry: any) => (
                        <TableRow key={entry.user_id} className="border-white/5 hover:bg-white/5">
                          <TableCell className="text-center font-mono font-bold text-muted-foreground">#{entry.rank}</TableCell>
                          <TableCell className="font-medium text-gray-200">{entry.full_name || 'Anonymous'}</TableCell>
                          <TableCell className="text-right text-muted-foreground text-xs">{new Date(entry.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right font-bold text-yellow-500">{entry.total_score}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Leaderboard;
