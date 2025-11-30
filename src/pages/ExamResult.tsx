import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle, Clock, Trophy, Target, ArrowRight, Home, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionResult {
  id: string;
  title: string;
  status: 'Correct' | 'Incorrect' | 'Skipped';
  timeSpent: number;
  score: number;
  attempts: number;
}

interface ExamResultState {
  stats: {
    score: number;
    totalScore: number;
    accuracy: number;
    correct: number;
    totalQuestions: number;
    attempted: number;
  };
  questionDetails: QuestionResult[];
  terminationReason?: string;
  totalTime: number;
}

const ExamResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ExamResultState;

  // Redirect if no state (e.g. direct access)
  if (!state) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">No Result Data Found</h1>
        <Button onClick={() => navigate('/')}>Return Home</Button>
      </div>
    );
  }

  const { stats, questionDetails, terminationReason, totalTime } = state;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
           <div className={cn("inline-flex items-center justify-center w-20 h-20 rounded-full mb-2 border-4 shadow-2xl", 
             terminationReason ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-green-500/10 border-green-500/20 text-green-500")}>
             {terminationReason ? <AlertTriangle className="w-10 h-10" /> : <Trophy className="w-10 h-10" />}
           </div>
           <h1 className="text-4xl md:text-5xl font-bold font-neuropol tracking-wide">
             {terminationReason ? "Exam Terminated" : "Assessment Complete"}
           </h1>
           {terminationReason && (
             <p className="text-red-400 bg-red-950/30 border border-red-900/50 px-4 py-2 rounded-full inline-block">
               Reason: {terminationReason}
             </p>
           )}
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[#0c0c0e] border-white/10 text-white">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Score</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.score.toFixed(0)} <span className="text-sm font-normal text-muted-foreground">/ {stats.totalScore}</span></div>
            </CardContent>
          </Card>
          <Card className="bg-[#0c0c0e] border-white/10 text-white">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Accuracy</CardTitle></CardHeader>
            <CardContent>
              <div className={cn("text-3xl font-bold", stats.accuracy >= 70 ? "text-green-500" : "text-orange-500")}>{stats.accuracy}%</div>
            </CardContent>
          </Card>
          <Card className="bg-[#0c0c0e] border-white/10 text-white">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Time</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono">{formatTime(totalTime)}</div>
            </CardContent>
          </Card>
          <Card className="bg-[#0c0c0e] border-white/10 text-white">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Attempted</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.attempted} <span className="text-sm font-normal text-muted-foreground">/ {stats.totalQuestions}</span></div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Report Table */}
        <Card className="bg-[#0c0c0e] border-white/10 text-white overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-white/5">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" /> Detailed Performance Report
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-black/20">
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead className="text-muted-foreground">Question</TableHead>
                  <TableHead className="text-muted-foreground text-center">Status</TableHead>
                  <TableHead className="text-muted-foreground text-center">Attempts</TableHead>
                  <TableHead className="text-muted-foreground text-center">Time Spent</TableHead>
                  <TableHead className="text-muted-foreground text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questionDetails.map((q) => (
                  <TableRow key={q.id} className="border-white/5 hover:bg-white/5">
                    <TableCell className="font-medium">{q.title}</TableCell>
                    <TableCell className="text-center">
                      <span className={cn("px-2 py-1 rounded text-xs font-bold uppercase", 
                        q.status === 'Correct' ? "bg-green-500/10 text-green-500" : 
                        q.status === 'Incorrect' ? "bg-red-500/10 text-red-500" : "bg-gray-500/10 text-gray-500"
                      )}>
                        {q.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">{q.attempts}</TableCell>
                    <TableCell className="text-center font-mono text-muted-foreground">{formatTime(q.timeSpent)}</TableCell>
                    <TableCell className="text-right font-bold">{q.score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
          <Button 
            size="lg" 
            variant="outline" 
            className="border-white/10 hover:bg-white/5 h-12 px-8 text-base"
            onClick={() => { sessionStorage.clear(); navigate('/degree'); }}
          >
            <ArrowRight className="w-4 h-4 mr-2" /> Attempt Another Set
          </Button>
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-white h-12 px-8 text-base"
            onClick={() => { sessionStorage.clear(); navigate('/'); }}
          >
            <Home className="w-4 h-4 mr-2" /> Return to Home
          </Button>
        </div>

      </div>
    </div>
  );
};

export default ExamResult;
