import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, BarChart2, User, XCircle, AlertCircle, Clock, CheckCircle2, MinusCircle, TrendingUp, Activity, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ExamResultState {
  stats: {
    score: number;
    totalScore: number;
    accuracy: number;
    correct: number;
    totalQuestions: number;
    attempted: number;
  };
  questionDetails: any[];
  terminationReason?: string;
  isError?: boolean;
  totalTime: number;
  examMetadata?: {
    subjectId: string | null;
    examType: string | null;
    setName: string | null;
  };
}

const ExamResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ExamResultState;

  if (!state) return <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center"><h1 className="text-2xl font-bold mb-4">No Result Data</h1><Button onClick={() => navigate('/')}>Home</Button></div>;

  const { stats, questionDetails, terminationReason, isError, totalTime, examMetadata } = state;
  const formatTime = (s: number) => { const m = Math.floor(s / 60); const sec = s % 60; return `${m}m ${sec}s`; };

  // 1. Fetch Full Question Data (for Categories & Expected Time)
  const { data: enrichmentData = [] } = useQuery({
    queryKey: ['exam_enrichment', examMetadata],
    queryFn: async () => {
      if (!examMetadata?.subjectId) return [];
      const table = examMetadata.setName ? 'iitm_exam_question_bank' : 'iitm_assignments'; // Fallback logic
      const { data } = await supabase
        .from(table)
        .select('id, category, expected_time, title')
        .in('id', questionDetails.map(q => q.id));
      return data || [];
    },
    enabled: !!questionDetails.length
  });

  // 2. Fetch Leaderboard (Rank 1 for comparison)
  const { data: leaderboard = [] } = useQuery({
    queryKey: ['leaderboard', examMetadata],
    queryFn: async () => {
      if (!examMetadata?.subjectId) return [];
      const { data, error } = await supabase
        .from('iitm_leaderboard')
        .select('user_id, total_score, duration_seconds, rank')
        .eq('subject_id', examMetadata.subjectId)
        .eq('exam_type', decodeURIComponent(examMetadata.examType || ''))
        .eq('set_name', examMetadata.setName)
        .order('rank', { ascending: true })
        .limit(1);
      if (error) console.error(error);
      return data || [];
    },
    enabled: !!examMetadata
  });

  const avgScore = leaderboard.length > 0 
    ? leaderboard.reduce((acc, curr) => acc + (curr.total_score || 0), 0) / leaderboard.length 
    : 0;

  // --- ANALYTICS CALCULATIONS ---

  // Merge enrichment data
  const enrichedQuestions = questionDetails.map(q => {
    const meta = enrichmentData.find((e: any) => e.id === q.id);
    return {
      ...q,
      category: meta?.category || 'General',
      expectedTime: (meta?.expected_time || 20) * 60 // Convert mins to seconds
    };
  });

  // Topic Performance
  const topicStats = enrichedQuestions.reduce((acc: any, q) => {
    if (!acc[q.category]) acc[q.category] = { total: 0, correct: 0, score: 0, maxScore: 0 };
    acc[q.category].total++;
    acc[q.category].maxScore += 100; // Assume 100 per question for normalization if not present
    if (q.status === 'Correct') {
      acc[q.category].correct++;
      acc[q.category].score += (q.score || 0);
    }
    return acc;
  }, {});

  const topicData = Object.entries(topicStats).map(([topic, data]: any) => ({
    topic,
    accuracy: Math.round((data.correct / data.total) * 100),
    count: data.total
  })).sort((a, b) => b.accuracy - a.accuracy);

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-6 md:p-12 font-sans selection:bg-white/20">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Status Header */}
        <div className="text-center space-y-6">
           <div className={cn("inline-flex items-center justify-center w-24 h-24 rounded-full border-4 shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-all hover:scale-105", 
             isError ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-green-500/10 border-green-500/20 text-green-500")}>
             {isError ? <XCircle className="w-12 h-12" /> : <Trophy className="w-12 h-12" />}
           </div>
           <div className="space-y-2">
             <h1 className="text-4xl md:text-6xl font-bold font-neuropol tracking-wide text-white">
               {isError ? "Exam Terminated" : "Assessment Complete"}
             </h1>
             {terminationReason ? (
               <div className={cn("inline-flex items-center gap-2 px-4 py-1.5 rounded-full border", isError ? "bg-red-950/30 border-red-500/30 text-red-400" : "bg-blue-950/30 border-blue-500/30 text-blue-400")}>
                 <AlertCircle className="w-4 h-4" />
                 <span className="text-sm font-medium">{terminationReason}</span>
               </div>
             ) : <p className="text-muted-foreground text-lg">Your performance has been recorded successfully.</p>}
           </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <Card className="bg-[#0c0c0e] border-white/10 text-white hover:border-white/20 transition-colors">
            <CardHeader className="pb-2 space-y-0"><CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Score</CardTitle></CardHeader>
            <CardContent><div className="text-3xl md:text-4xl font-bold">{stats.score.toFixed(0)} <span className="text-lg text-muted-foreground font-normal">/ {stats.totalScore}</span></div></CardContent>
          </Card>
          <Card className="bg-[#0c0c0e] border-white/10 text-white hover:border-white/20 transition-colors">
            <CardHeader className="pb-2 space-y-0"><CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Accuracy</CardTitle></CardHeader>
            <CardContent>
              <div className={cn("text-3xl md:text-4xl font-bold flex items-center gap-2", stats.accuracy >= 70 ? "text-green-500" : stats.accuracy >= 40 ? "text-yellow-500" : "text-red-500")}>
                {stats.accuracy}% 
                <Activity className="w-5 h-5 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0c0c0e] border-white/10 text-white hover:border-white/20 transition-colors">
            <CardHeader className="pb-2 space-y-0"><CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Time Taken</CardTitle></CardHeader>
            <CardContent><div className="text-3xl md:text-4xl font-bold font-mono">{formatTime(totalTime)}</div></CardContent>
          </Card>
          <Card className="bg-[#0c0c0e] border-white/10 text-white hover:border-white/20 transition-colors">
            <CardHeader className="pb-2 space-y-0"><CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Questions</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl md:text-4xl font-bold">{stats.attempted}</div>
                <div className="text-sm text-muted-foreground">attempted of {stats.totalQuestions}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Row 1: Comparison & Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* 1. Score Comparison */}
          <Card className="bg-[#0c0c0e] border-white/10 text-white lg:col-span-1 flex flex-col">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-base"><BarChart2 className="w-4 h-4 text-blue-400" /> Relative Performance</CardTitle>
            </CardHeader>
            <CardContent className="p-8 flex-1 flex items-end justify-center gap-12">
              <div className="flex flex-col items-center gap-3 w-16 group">
                <div className="text-xl font-bold text-white group-hover:scale-110 transition-transform">{stats.score.toFixed(0)}</div>
                <div className="w-full bg-blue-600 rounded-t-sm relative shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all duration-1000 ease-out" style={{ height: `${Math.max(10, Math.min(100, (stats.score / stats.totalScore) * 150))}%` }}></div>
                <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider bg-blue-400/10 px-2 py-1 rounded">You</div>
              </div>
              <div className="flex flex-col items-center gap-3 w-16 group opacity-60 hover:opacity-100 transition-opacity">
                <div className="text-xl font-bold text-gray-300">{avgScore.toFixed(0)}</div>
                <div className="w-full bg-white/20 rounded-t-sm relative transition-all duration-1000 ease-out" style={{ height: `${Math.max(10, Math.min(100, (avgScore / stats.totalScore) * 150))}%` }}></div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider bg-white/5 px-2 py-1 rounded">Top 1</div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Topic Performance */}
          <Card className="bg-[#0c0c0e] border-white/10 text-white lg:col-span-2 flex flex-col">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-base"><PieChart className="w-4 h-4 text-purple-400" /> Topic Proficiency</CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1">
              {topicData.length > 0 ? (
                <div className="space-y-5">
                  {topicData.map((t, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        <span>{t.topic}</span>
                        <span>{t.accuracy}% ({t.count} Qs)</span>
                      </div>
                      <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full transition-all duration-1000 ease-out", 
                            t.accuracy >= 80 ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" : 
                            t.accuracy >= 50 ? "bg-yellow-500" : "bg-red-500"
                          )} 
                          style={{ width: `${t.accuracy}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">No topic data available.</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Analytics Row 2: Time Analysis */}
        <Card className="bg-[#0c0c0e] border-white/10 text-white">
          <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
            <CardTitle className="flex items-center gap-2 text-base"><Clock className="w-4 h-4 text-orange-400" /> Time Efficiency Analysis</CardTitle>
            <CardDescription className="text-xs text-gray-500">Time spent vs. Expected time per question</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-48 flex items-end gap-2 md:gap-4 overflow-x-auto pb-2 no-scrollbar">
              {enrichedQuestions.map((q, i) => {
                const heightPercent = Math.min(100, (q.timeSpent / (q.expectedTime || 120)) * 100);
                const isOvertime = q.timeSpent > (q.expectedTime || 120);
                return (
                  <div key={i} className="flex flex-col justify-end items-center gap-2 group min-w-[30px] flex-1">
                    <div className="relative w-full flex items-end justify-center h-full">
                      {/* Actual Time Bar */}
                      <div 
                        className={cn("w-3 md:w-4 rounded-t-sm transition-all duration-500", isOvertime ? "bg-red-500/80" : "bg-green-500/80 group-hover:bg-green-400")} 
                        style={{ height: `${Math.max(10, heightPercent)}%` }}
                        title={`Spent: ${formatTime(q.timeSpent)}`}
                      ></div>
                      {/* Expected Marker line */}
                      <div className="absolute w-full border-t border-dashed border-white/30 top-0 pointer-events-none opacity-50"></div> 
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">Q{i+1}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center gap-6 mt-4 text-[10px] text-muted-foreground uppercase tracking-widest">
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full" /> Efficient</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full" /> Overtime</div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Question Table */}
        <Card className="bg-[#0c0c0e] border-white/10 text-white overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-white/5 pb-4"><CardTitle className="flex items-center gap-2 text-base"><Target className="w-4 h-4 text-primary" /> Question Breakdown</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-black/20"><TableRow className="hover:bg-transparent border-white/5"><TableHead className="text-muted-foreground w-12 text-center">#</TableHead><TableHead className="text-muted-foreground">Question Description</TableHead><TableHead className="text-center text-muted-foreground">Category</TableHead><TableHead className="text-center text-muted-foreground">Time</TableHead><TableHead className="text-center text-muted-foreground">Status</TableHead><TableHead className="text-right text-muted-foreground">Score</TableHead></TableRow></TableHeader>
              <TableBody>
                {enrichedQuestions.map((q, i) => (
                  <TableRow key={q.id} className="border-white/5 hover:bg-white/5 group transition-colors">
                    <TableCell className="text-center text-muted-foreground font-mono text-xs">{i + 1}</TableCell>
                    <TableCell className="font-medium text-gray-300 text-sm py-4 max-w-md">
                      <div className="line-clamp-2 leading-relaxed text-gray-400 group-hover:text-white transition-colors" title={q.description || q.title}>
                        {q.description || q.title}
                      </div>
                    </TableCell>
                    <TableCell className="text-center"><Badge variant="outline" className="border-white/10 bg-white/5 text-gray-400 font-normal">{q.category}</Badge></TableCell>
                    <TableCell className={cn("text-center font-mono text-xs", q.timeSpent > q.expectedTime ? "text-red-400" : "text-gray-400")}>{formatTime(q.timeSpent)}</TableCell>
                    <TableCell className="text-center align-middle">
                      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border", 
                        q.status === 'Correct' ? "bg-green-500/10 text-green-500 border-green-500/20" : 
                        q.status === 'Skipped' ? "bg-gray-500/10 text-gray-500 border-gray-500/20" : "bg-red-500/10 text-red-500 border-red-500/20")}>
                        {q.status === 'Correct' && <CheckCircle2 className="w-3 h-3" />}
                        {q.status === 'Skipped' && <MinusCircle className="w-3 h-3" />}
                        {q.status === 'Incorrect' && <XCircle className="w-3 h-3" />}
                        {q.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold font-mono align-middle">{q.score || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8 pb-12">
          <Button size="lg" variant="outline" className="border-white/10 hover:bg-white/5 h-12 px-8" onClick={() => { sessionStorage.clear(); navigate('/degree'); }}><TrendingUp className="w-4 h-4 mr-2" /> Attempt Another</Button>
          <Button size="lg" className="bg-white text-black hover:bg-gray-200 h-12 px-8 font-bold" onClick={() => { sessionStorage.clear(); navigate('/'); }}><User className="w-4 h-4 mr-2" /> Return to Dashboard</Button>
        </div>
      </div>
    </div>
  );
};

export default ExamResult;
