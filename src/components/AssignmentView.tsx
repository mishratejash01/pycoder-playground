import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CodeEditor } from './CodeEditor';
import { TestCaseView } from './TestCaseView';
// CHANGE 1: Import the new universal hook instead of usePyodide
import { useCodeRunner, Language } from '@/hooks/useCodeRunner';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Play, BookOpen, Flag, RefreshCw, Code2, Lock, Unlock } from 'lucide-react';
import type { QuestionStatus } from '@/pages/Index';
import { cn } from '@/lib/utils';

const DEFAULT_TABLES = { assignments: 'assignments', testCases: 'test_cases', submissions: 'submissions' };

interface AssignmentViewProps {
  assignmentId: string;
  onStatusUpdate: (status: QuestionStatus) => void;
  currentStatus?: QuestionStatus;
  onAttempt?: (isCorrect: boolean, score: number) => void;
  tables?: { assignments: string; testCases: string; submissions: string; };
  disableCopyPaste?: boolean;
}

// Helper: Extract function/class name for Python wrapping
const getTargetName = (code: string) => {
  const funcMatch = code.match(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
  if (funcMatch) return funcMatch[1];
  const classMatch = code.match(/class\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*[:\(]/);
  if (classMatch) return classMatch[1];
  return null;
};

// Helper: Normalize output for comparison (handles whitespace/quotes)
const normalizeOutput = (str: string) => {
  if (!str) return '';
  return str.trim().replace(/'/g, '"').replace(/\s+/g, ' ').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').replace(/\[\s+/g, '[').replace(/\s+\]/g, ']');
};

// CHANGE 2: Helper to detect language from metadata
const detectLanguage = (title: string, category: string): Language => {
  const text = (title + category).toLowerCase();
  if (text.includes('java')) return 'java';
  if (text.includes('c++') || text.includes('cpp')) return 'cpp';
  if (text.includes('javascript') || text.includes('js')) return 'javascript';
  if (text.includes('c')) return 'c';
  return 'python'; // Default fallback
};

export const AssignmentView = ({ 
  assignmentId, 
  onStatusUpdate, 
  currentStatus, 
  onAttempt, 
  tables = DEFAULT_TABLES,
  disableCopyPaste = false 
}: AssignmentViewProps) => {
  const [code, setCode] = useState<string>(''); 
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [bottomTab, setBottomTab] = useState<'console' | 'testcases'>('testcases');
  
  // CHANGE 3: Use the universal code runner
  const { executeCode, loading: runnerLoading } = useCodeRunner();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assignment, isLoading, error, refetch } = useQuery({
    queryKey: ['assignment', assignmentId, tables.assignments],
    queryFn: async () => {
      // @ts-ignore
      const { data, error } = await supabase.from(tables.assignments).select('*').eq('id', assignmentId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!assignmentId
  });

  const { data: testCases = [] } = useQuery({
    queryKey: ['testCases', assignmentId, tables.testCases],
    queryFn: async () => {
      // @ts-ignore
      const { data } = await supabase.from(tables.testCases).select('*').eq('assignment_id', assignmentId).order('is_public', { ascending: false });
      return data || [];
    },
    enabled: !!assignmentId
  });

  const { data: latestSubmission } = useQuery({
    queryKey: ['submission', assignmentId, tables.submissions],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      // @ts-ignore
      const { data } = await supabase.from(tables.submissions).select('code, score, public_tests_passed, private_tests_passed').eq('assignment_id', assignmentId).eq('user_id', user.id).order('submitted_at', { ascending: false }).limit(1).maybeSingle();
      return data;
    },
    enabled: !!assignmentId
  });

  // CHANGE 4: Determine current language
  const currentLanguage = assignment 
    ? detectLanguage(assignment.title, assignment.category || '') 
    : 'python';

  useEffect(() => {
    const sessionKey = `exam_draft_${assignmentId}`;
    const savedDraft = sessionStorage.getItem(sessionKey);
    if (savedDraft) setCode(savedDraft);
    else if (latestSubmission?.code) setCode(latestSubmission.code);
    else if (assignment?.starter_code) setCode(assignment.starter_code);
    else setCode(currentLanguage === 'python' ? '# Write your Python code here\n' : '// Write your code here\n');
    setTestResults({});
    setConsoleOutput('');
  }, [assignmentId, latestSubmission, assignment, currentLanguage]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    sessionStorage.setItem(`exam_draft_${assignmentId}`, newCode);
  };

  // Helper: Prepare code for execution
  // For Python "function assignments", we append the call. 
  // For other languages (or Python scripts), we execute as-is with stdin.
  const prepareExecutionCode = (rawCode: string, input: string) => {
    if (currentLanguage === 'python') {
      const targetName = getTargetName(rawCode);
      // If a function definition exists and we have input, wrap it
      if (targetName && input) {
        // If input looks like arguments "(1, 2)", pass directly. If not, treat as string.
        // NOTE: This assumes inputs in DB are formatted like "1, 2" or "[1,2]" for the function.
        // If your test cases are raw values, you might need `(${input})`.
        // This wrapper tries to print the result of function_name(input)
        return `${rawCode}\n\n# Auto-generated runner\ntry:\n    print(${targetName}(${input}))\nexcept Exception as e:\n    print(e)`;
      }
    }
    return rawCode;
  };

  // CHANGE 5: Refactored Submit Logic to use executeCode
  const submitMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please log in');
      
      const publicTests = testCases.filter((tc:any) => tc.is_public);
      const privateTests = testCases.filter((tc:any) => !tc.is_public);
      const allTests = [...publicTests, ...privateTests];
      
      const newTestResults: Record<string, any> = {};
      let passedCount = 0;

      for (const test of allTests) {
        // Prepare code (wrapper for Python function calls if needed)
        // If it's a standard script (Java/C++), input goes to STDIN via executeCode
        const codeToRun = prepareExecutionCode(code, test.input);
        
        // Run code
        const result = await executeCode(currentLanguage, codeToRun, test.input);
        
        if (!result.success) {
          newTestResults[test.id] = { passed: false, output: "Error", error: result.error };
          continue;
        }

        const actual = normalizeOutput(result.output);
        const expected = normalizeOutput(test.expected_output);
        
        // Simple string matching (can be enhanced with regex or type parsing)
        const isMatch = actual === expected || actual.includes(expected);
        
        if (isMatch) passedCount++;
        newTestResults[test.id] = { 
          passed: isMatch, 
          output: result.output, 
          error: isMatch ? null : `Expected: ${test.expected_output}` 
        };
      }
      
      setTestResults(newTestResults);
      
      const total = allTests.length;
      const score = total > 0 ? (passedCount / total) * (assignment.max_score || 100) : 0;
      
      // Calculate split counts
      const pubPassed = publicTests.filter(t => newTestResults[t.id]?.passed).length;
      const privPassed = privateTests.filter(t => newTestResults[t.id]?.passed).length;

      // @ts-ignore
      await supabase.from(tables.submissions).insert({
        assignment_id: assignmentId,
        user_id: user.id,
        code,
        score,
        public_tests_passed: pubPassed,
        public_tests_total: publicTests.length,
        private_tests_passed: privPassed,
        private_tests_total: privateTests.length,
      });
      
      return { score, passedCount, total };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['submission', assignmentId] });
      toast({ title: 'Submission Complete', description: `Score: ${data.score.toFixed(0)}%` });
      onStatusUpdate('attempted');
      setBottomTab('testcases');
      if (onAttempt) onAttempt(data.passedCount === data.total, data.score);
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      setConsoleOutput(err.message);
      setBottomTab('console');
    }
  });

  // CHANGE 6: Refactored Run Logic
  const handleRun = async () => {
    if (runnerLoading) return;
    setConsoleOutput('Running...');
    setBottomTab('console');
    
    try {
      // Just run the code. If it's a script, it runs. 
      // If it's a function without a call, it might output nothing, which is expected behavior for "Run" unless user adds a print.
      const res = await executeCode(currentLanguage, code, "");
      
      if (res.success) {
        setConsoleOutput(res.output || "Code executed successfully (No output).");
      } else {
        setConsoleOutput(res.error || "Execution failed.");
      }
    } catch (err: any) {
      setConsoleOutput(err.message);
    }
  };

  const publicTests = testCases.filter((tc: any) => tc.is_public);
  const privateTests = testCases.filter((tc: any) => !tc.is_public);

  const currentPubPassed = testResults ? Object.values(testResults).filter((r:any, i) => testCases[i]?.is_public && r.passed).length : (latestSubmission?.public_tests_passed || 0);
  const currentPrivPassed = latestSubmission?.private_tests_passed || 0; 

  if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-white"/></div>;
  if (error || !assignment) return <div className="text-white text-center p-10"><Button onClick={() => refetch()}>Retry</Button></div>;

  return (
    <div className="h-full w-full bg-[#09090b] text-white overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* LEFT PANEL: Problem & Stats */}
        <ResizablePanel defaultSize={40} minSize={30} className="bg-[#0c0c0e] border-r border-white/10 flex flex-col">
          <div className="h-12 border-b border-white/10 flex items-center px-4 justify-between bg-black/20 shrink-0">
            <div className="flex items-center gap-2 text-sm font-medium text-white/90"><BookOpen className="w-4 h-4 text-primary" /> Problem Description</div>
            <div className="flex items-center gap-2">
               <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded border border-white/10 font-mono">
                 Score: {latestSubmission?.score?.toFixed(0) || 0} / {assignment.max_score}
               </span>
               <Button variant="ghost" size="icon" onClick={() => { onStatusUpdate('review'); toast({description:"Marked for Review"}); }} className={cn("h-7 w-7", currentStatus === 'review' ? "text-orange-500" : "text-muted-foreground")}><Flag className="w-4 h-4" /></Button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">{assignment.title}</h1>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span className="uppercase tracking-wider font-bold text-blue-400">{currentLanguage}</span>
                  <span>•</span>
                  <span>{assignment.category || "General"}</span>
                </div>
              </div>
              <div className="prose prose-invert prose-sm text-gray-300"><div className="whitespace-pre-wrap font-sans">{assignment.description}</div></div>
              {assignment.instructions && <div className="bg-blue-950/20 border border-blue-500/20 rounded-lg p-4 text-xs text-blue-200/70 whitespace-pre-wrap">{assignment.instructions}</div>}

              {/* VISUAL METER (Stats) */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                 {/* Public Tests */}
                 <div className="bg-white/5 rounded p-3 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-xs text-muted-foreground flex items-center gap-1"><Unlock className="w-3 h-3"/> Public Tests</span>
                       <span className="text-xs font-bold text-white">{currentPubPassed}/{publicTests.length}</span>
                    </div>
                    <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                       <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${publicTests.length ? (currentPubPassed/publicTests.length)*100 : 0}%` }} />
                    </div>
                 </div>
                 {/* Private Tests */}
                 <div className="bg-white/5 rounded p-3 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-xs text-muted-foreground flex items-center gap-1"><Lock className="w-3 h-3"/> Private Tests</span>
                       <span className="text-xs font-bold text-white">{currentPrivPassed}/{privateTests.length}</span>
                    </div>
                    <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${privateTests.length ? (currentPrivPassed/privateTests.length)*100 : 0}%` }} />
                    </div>
                 </div>
              </div>

            </div>
          </ScrollArea>
        </ResizablePanel>
        
        <ResizableHandle withHandle className="bg-black border-l border-r border-white/5 w-2 hover:bg-primary/20 transition-colors" />

        {/* RIGHT PANEL: Editor & Output */}
        <ResizablePanel defaultSize={60}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={70} className="flex flex-col bg-[#09090b]">
              <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-black/40 shrink-0">
                <div className="flex items-center gap-2 text-sm font-medium text-white/90">
                  <Code2 className="w-4 h-4 text-green-500" /> 
                  <span className="capitalize">{currentLanguage}</span> Editor
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={handleRun} disabled={runnerLoading} className="h-7 text-xs gap-1.5">
                    <Play className="w-3 h-3 mr-1"/> Run
                  </Button>
                  <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || runnerLoading} size="sm" className="h-7 text-xs gap-1.5 bg-green-600 hover:bg-green-500 text-white">
                    {submitMutation.isPending || runnerLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : 'Submit'}
                  </Button>
                </div>
              </div>
              <div className="flex-1 relative">
                <CodeEditor 
                  value={code} 
                  onChange={handleCodeChange} 
                  disableCopyPaste={disableCopyPaste}
                  // CHANGE 7: Pass language to CodeEditor
                  language={currentLanguage}
                />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle className="bg-black border-t border-b border-white/5 h-2 hover:bg-primary/20 transition-colors" />
            <ResizablePanel defaultSize={30} className="bg-[#0c0c0e] flex flex-col">
              <Tabs value={bottomTab} onValueChange={(v:any) => setBottomTab(v)} className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/20 shrink-0">
                  <TabsList className="h-7 bg-white/5 border border-white/10 p-0.5 gap-1">
                    <TabsTrigger value="testcases" className="text-xs h-6 px-3">Test Cases</TabsTrigger>
                    <TabsTrigger value="console" className="text-xs h-6 px-3">Console Output</TabsTrigger>
                  </TabsList>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-white" onClick={() => setConsoleOutput('')}><RefreshCw className="w-3 h-3"/></Button>
                </div>
                <div className="flex-1 min-h-0 relative">
                  <TabsContent value="testcases" className="h-full m-0 p-0"><TestCaseView testCases={testCases} testResults={testResults} /></TabsContent>
                  <TabsContent value="console" className="h-full m-0 p-0"><div className="h-full p-4 font-mono text-sm overflow-auto bg-[#0a0a0a]"><pre className={cn("whitespace-pre-wrap", consoleOutput.includes('Error') ? "text-red-400" : "text-blue-400")}>{consoleOutput || <span className="text-muted-foreground/40 italic"># No output</span>}</pre></div></TabsContent>
                </div>
              </Tabs>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
