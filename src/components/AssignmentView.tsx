import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CodeEditor } from './CodeEditor';
import { TestCaseView } from './TestCaseView';
import { usePyodide } from '@/hooks/usePyodide';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Play, Code2, BookOpen, Flag, AlertTriangle, RefreshCw } from 'lucide-react';
import type { QuestionStatus } from '@/pages/Index';
import { cn } from '@/lib/utils';

interface AssignmentViewProps {
  assignmentId: string;
  onStatusUpdate: (status: QuestionStatus) => void;
  currentStatus?: QuestionStatus;
}

// Regex to find function definition
const getFunctionName = (code: string) => {
  const match = code.match(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
  return match ? match[1] : null;
};

// Normalize output for flexible comparison (ignores extra spaces)
const normalizeOutput = (str: string) => {
  if (!str) return '';
  return str.replace(/'/g, '"').replace(/\s+/g, '').trim();
};

export const AssignmentView = ({ assignmentId, onStatusUpdate, currentStatus }: AssignmentViewProps) => {
  const [code, setCode] = useState<string>(''); 
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [testResults, setTestResults] = useState<Record<string, { output: string; passed: boolean; error?: string | null }>>({});
  const [bottomTab, setBottomTab] = useState<'console' | 'testcases'>('testcases');
  
  const { runCode, runTestFunction, loading: pyodideLoading } = usePyodide();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- Data Fetching ---
  const { data: assignment, isLoading, error, refetch } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      if (!assignmentId) throw new Error("No ID");
      const { data, error } = await supabase.from('assignments').select('*').eq('id', assignmentId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!assignmentId
  });

  const { data: testCases = [] } = useQuery({
    queryKey: ['testCases', assignmentId],
    queryFn: async () => {
      if (!assignmentId) return [];
      const { data } = await supabase.from('test_cases').select('*').eq('assignment_id', assignmentId).order('is_public', { ascending: false });
      return data || [];
    },
    enabled: !!assignmentId
  });

  const { data: latestSubmission } = useQuery({
    queryKey: ['submission', assignmentId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from('submissions').select('code, score').eq('assignment_id', assignmentId).eq('user_id', user.id).order('submitted_at', { ascending: false }).limit(1).maybeSingle();
      return data;
    },
    enabled: !!assignmentId
  });

  // --- Persistence ---
  useEffect(() => {
    const sessionKey = `exam_draft_${assignmentId}`;
    const savedDraft = sessionStorage.getItem(sessionKey);
    if (savedDraft) setCode(savedDraft);
    else if (latestSubmission?.code) setCode(latestSubmission.code);
    else setCode('# Write your Python code here\n');
    setTestResults({});
    setConsoleOutput('');
  }, [assignmentId, latestSubmission]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    sessionStorage.setItem(`exam_draft_${assignmentId}`, newCode);
  };

  // --- SUBMISSION HANDLER ---
  const submitMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please log in');
      
      const functionName = getFunctionName(code);
      if (!functionName) throw new Error("Could not find a function definition (def name...).");

      const publicTests = testCases.filter(tc => tc.is_public);
      const privateTests = testCases.filter(tc => !tc.is_public);
      let publicPassed = 0;
      let privatePassed = 0;
      const newTestResults: Record<string, any> = {};

      // Execute tests sequentially
      const executeTests = async (tests: any[]) => {
        let passedCount = 0;
        for (const test of tests) {
          try {
            // Run specific test case
            const result = await runTestFunction(code, functionName, test.input);
            
            if (!result.success) {
              newTestResults[test.id] = { 
                passed: false, 
                output: "Error", 
                error: result.error 
              };
              continue;
            }

            // Compare Results
            const actual = normalizeOutput(result.result);
            const expected = normalizeOutput(test.expected_output);
            const isMatch = actual === expected;

            if (isMatch) passedCount++;

            newTestResults[test.id] = {
              passed: isMatch,
              output: result.result, // Raw python repr()
              error: isMatch ? null : `Expected: ${test.expected_output}`
            };
          } catch (e: any) {
            newTestResults[test.id] = { passed: false, output: "", error: e.message };
          }
        }
        return passedCount;
      };

      publicPassed = await executeTests(publicTests);
      privatePassed = await executeTests(privateTests);

      setTestResults(newTestResults);

      const totalTests = testCases.length;
      const score = totalTests > 0 ? ((publicPassed + privatePassed) / totalTests) * (assignment.max_score || 100) : 0;

      await supabase.from('submissions').insert({
        assignment_id: assignmentId,
        user_id: user.id,
        code,
        score,
        public_tests_passed: publicPassed,
        public_tests_total: publicTests.length,
        private_tests_passed: privatePassed,
        private_tests_total: privateTests.length,
      });

      return { score, publicPassed, privatePassed, totalTests };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['submission', assignmentId] });
      toast({ 
        title: data.score === (assignment?.max_score || 100) ? 'Perfect Score! 🎉' : 'Submission Complete', 
        description: `Passed ${data.publicPassed + data.privatePassed}/${data.totalTests} tests.` 
      });
      onStatusUpdate('attempted');
      setBottomTab('testcases');
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      setConsoleOutput(err.message);
      setBottomTab('console');
    }
  });

  const handleRun = async () => {
    if (pyodideLoading) return;
    setConsoleOutput('Running...');
    setBottomTab('console');
    // Just run the script for output checking (manual debug)
    const result = await runCode(code);
    setConsoleOutput(result.error ? `Error:\n${result.error}` : (result.output || 'Code executed successfully.'));
  };

  if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-white"/></div>;
  if (error || !assignment) return <div className="text-white text-center p-10">Error loading problem. <Button onClick={() => refetch()} variant="outline" className="ml-2">Retry</Button></div>;

  return (
    <div className="h-full w-full bg-[#09090b] text-white overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Panel */}
        <ResizablePanel defaultSize={40} minSize={30} className="bg-[#0c0c0e] border-r border-white/10 flex flex-col">
          <div className="h-12 border-b border-white/10 flex items-center px-4 bg-black/20 shrink-0">
            <span className="text-sm font-medium"><BookOpen className="inline w-4 h-4 mr-2 text-primary"/> Problem</span>
          </div>
          <ScrollArea className="flex-1 p-6">
            <h1 className="text-2xl font-bold mb-4">{assignment.title}</h1>
            <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">{assignment.description}</div>
          </ScrollArea>
        </ResizablePanel>
        
        <ResizableHandle withHandle className="bg-black border-l border-r border-white/5 w-2" />

        {/* Right Panel */}
        <ResizablePanel defaultSize={60}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={70} className="flex flex-col bg-[#09090b]">
              <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-black/40 shrink-0">
                <span className="text-sm font-medium"><Code2 className="inline w-4 h-4 mr-2 text-green-500"/> main.py</span>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={handleRun} disabled={pyodideLoading} className="h-7 text-xs"><Play className="w-3 h-3 mr-1"/> Run</Button>
                  <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending} size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-500">{submitMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin"/> : 'Submit'}</Button>
                </div>
              </div>
              <div className="flex-1 relative"><CodeEditor value={code} onChange={handleCodeChange} /></div>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-black border-t border-b border-white/5 h-2" />

            <ResizablePanel defaultSize={30} className="bg-[#0c0c0e] flex flex-col">
              <Tabs value={bottomTab} onValueChange={(v) => setBottomTab(v as any)} className="flex-1 flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/20 shrink-0">
                  <TabsList className="h-7 bg-white/5 border border-white/10 p-0.5">
                    <TabsTrigger value="testcases" className="text-xs h-6">Test Cases</TabsTrigger>
                    <TabsTrigger value="console" className="text-xs h-6">Console</TabsTrigger>
                  </TabsList>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setConsoleOutput('')}><RefreshCw className="w-3 h-3"/></Button>
                </div>
                <div className="flex-1 overflow-hidden relative">
                  <TabsContent value="testcases" className="h-full m-0 p-4 overflow-auto"><TestCaseView testCases={testCases} testResults={testResults} /></TabsContent>
                  <TabsContent value="console" className="h-full m-0 p-4 overflow-auto bg-[#0a0a0a] font-mono text-sm text-green-400"><pre>{consoleOutput || "// No output"}</pre></TabsContent>
                </div>
              </Tabs>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
