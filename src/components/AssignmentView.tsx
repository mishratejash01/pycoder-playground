import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CodeEditor } from './CodeEditor';
import { ScoreDisplay } from './ScoreDisplay';
import { TestCaseView } from './TestCaseView';
import { usePyodide } from '@/hooks/usePyodide';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Play, Terminal, Code2, BookOpen, CheckCircle, Flag } from 'lucide-react';
import type { QuestionStatus } from '@/pages/Index';
import { cn } from '@/lib/utils';

interface AssignmentViewProps {
  assignmentId: string;
  onStatusUpdate: (status: QuestionStatus) => void;
  currentStatus?: QuestionStatus;
}

export const AssignmentView = ({ assignmentId, onStatusUpdate, currentStatus }: AssignmentViewProps) => {
  const [code, setCode] = useState('# Write your Python code here\n');
  const [activeTab, setActiveTab] = useState('overview');
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [testResults, setTestResults] = useState<Record<string, { output: string; passed: boolean; error?: string | null }>>({});
  
  const { runCode, loading: pyodideLoading } = usePyodide();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch Assignment Data
  const { data: assignment } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch Test Cases
  const { data: testCases = [] } = useQuery({
    queryKey: ['testCases', assignmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_cases')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('is_public', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Reset code when assignment changes (optional, usually we want to persist draft)
  useEffect(() => {
    // In a real app, you might fetch the user's saved draft from Supabase here
    setCode('# Write your Python code here\n');
    setTestResults({});
    setConsoleOutput('');
  }, [assignmentId]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please log in to submit');

      const publicTests = testCases.filter(tc => tc.is_public);
      const privateTests = testCases.filter(tc => !tc.is_public);

      let publicPassed = 0;
      let privatePassed = 0;

      // Run Public Tests
      for (const test of publicTests) {
        const result = await runCode(code, test.input);
        if (result.success && result.output.trim() === test.expected_output.trim()) {
          publicPassed++;
        }
      }

      // Run Private Tests
      for (const test of privateTests) {
        const result = await runCode(code, test.input);
        if (result.success && result.output.trim() === test.expected_output.trim()) {
          privatePassed++;
        }
      }

      const totalTests = testCases.length;
      const passedTests = publicPassed + privatePassed;
      const score = (passedTests / totalTests) * (assignment?.max_score || 100);

      const { error } = await supabase.from('submissions').insert({
        assignment_id: assignmentId,
        user_id: user.id,
        code,
        score,
        public_tests_passed: publicPassed,
        public_tests_total: publicTests.length,
        private_tests_passed: privatePassed,
        private_tests_total: privateTests.length,
      });

      if (error) throw error;
      return { score };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['submission', assignmentId] });
      toast({
        title: 'Solution Submitted',
        description: `Your answer has been recorded. Score: ${data.score.toFixed(0)}`,
      });
      // Mark as Attempted (Green)
      onStatusUpdate('attempted');
    },
    onError: (error: any) => {
      toast({
        title: 'Submission Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleRun = async () => {
    if (pyodideLoading) return;
    setConsoleOutput('Running...');
    setActiveTab('console');
    const result = await runCode(code, '');
    setConsoleOutput(result.error ? `Error:\n${result.error}` : (result.output || 'Code ran successfully (No output).'));
  };

  const handleMarkForReview = () => {
    onStatusUpdate('review');
    toast({
      title: "Marked for Review",
      description: "You can come back to this question later.",
    });
  };

  if (!assignment) return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* Control Bar */}
      <div className="border-b border-white/10 bg-black/20 px-4 py-2 flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
          <TabsList className="h-9 bg-black/40 border border-white/10 p-1 rounded-lg">
            <TabsTrigger value="overview" className="text-xs px-3 py-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Overview</TabsTrigger>
            <TabsTrigger value="code" className="text-xs px-3 py-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Code Editor</TabsTrigger>
            <TabsTrigger value="testcases" className="text-xs px-3 py-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Test Cases</TabsTrigger>
            <TabsTrigger value="console" className="text-xs px-3 py-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Console</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex items-center gap-2">
           <Button
            variant="outline"
            size="sm"
            onClick={handleMarkForReview}
            className={cn(
              "h-8 text-xs gap-2 border-orange-500/50 text-orange-500 hover:bg-orange-500/10",
              currentStatus === 'review' && "bg-orange-500/20"
            )}
          >
            <Flag className="w-3 h-3" />
            {currentStatus === 'review' ? 'Marked' : 'Review'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <TabsContent value="overview" className="p-6 m-0 h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">{assignment.title}</h1>
            <Card className="border-white/10 bg-black/40 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="prose prose-invert max-w-none prose-p:text-muted-foreground prose-headings:text-primary">
                  <div className="whitespace-pre-wrap">{assignment.description}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="code" className="m-0 h-full flex flex-col">
          <div className="flex-1 min-h-[400px] border-b border-white/10">
            <CodeEditor value={code} onChange={setCode} />
          </div>
          {/* Action Footer */}
          <div className="p-4 bg-black/40 backdrop-blur-md flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              Status: <span className={cn("font-bold", currentStatus === 'attempted' ? 'text-green-500' : 'text-orange-500')}>
                {currentStatus ? currentStatus.toUpperCase() : 'NOT ATTEMPTED'}
              </span>
            </span>
            <div className="flex gap-3">
              <Button variant="ghost" size="sm" onClick={handleRun} disabled={pyodideLoading} className="gap-2">
                <Play className="w-4 h-4" /> Run
              </Button>
              <Button 
                onClick={() => submitMutation.mutate()} 
                disabled={pyodideLoading || submitMutation.isPending}
                size="sm"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-emerald-900/20"
              >
                {submitMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Submit Answer'}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="testcases" className="p-6 m-0">
          <TestCaseView testCases={testCases} testResults={testResults} />
        </TabsContent>

        <TabsContent value="console" className="p-6 m-0 h-full">
          <div className="bg-black/80 border border-white/10 p-4 rounded-lg font-mono text-sm h-full text-green-400 overflow-auto shadow-inner">
            {consoleOutput || "Output will appear here..."}
          </div>
        </TabsContent>
      </div>
    </div>
  );
};
