import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { useEnhancedCodeRunner, Language, EnhancedExecutionResult } from '@/hooks/useEnhancedCodeRunner';
import { CodeEditor } from '@/components/CodeEditor';
import { 
  Play, Send, ChevronLeft, Loader2, Bug, Terminal, FileCode2, Timer, 
  Home, RefreshCw, CheckCircle2, BookOpen, MessageSquare, History, 
  Beaker, Sparkles, Zap, Maximize2, Minimize2, ChevronRight, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { BookmarkButton } from '@/components/practice/BookmarkButton';
import { LikeDislikeButtons } from '@/components/practice/LikeDislikeButtons';
import { HintsAccordion } from '@/components/practice/HintsAccordion';
import { ProblemNotes } from '@/components/practice/ProblemNotes';
import { SubmissionHistory } from '@/components/practice/SubmissionHistory';
import { DiscussionTab } from '@/components/practice/DiscussionTab';
import { JudgingLoader } from '@/components/practice/JudgingLoader';
import { VerdictDisplay } from '@/components/practice/VerdictDisplay';
import { PerformanceChart } from '@/components/practice/PerformanceChart';
import { CustomTestSandbox } from '@/components/practice/CustomTestSandbox';
import { wrapCodeForExecution, Language as WrapperLanguage } from '@/utils/codeWrappers';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to safely display input/output
const formatValue = (val: any) => {
  if (typeof val === 'object' && val !== null) return JSON.stringify(val);
  return String(val);
};

export default function PracticeSolver() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { executeWithJudging, runSingleTest, judgingPhase, elapsedMs, resetJudging } = useEnhancedCodeRunner();

  const [activeLanguage, setActiveLanguage] = useState<Language>('python');
  const [code, setCode] = useState('');
  const [userId, setUserId] = useState<string | undefined>();
  
  const [descriptionTab, setDescriptionTab] = useState<'description' | 'editorial' | 'submissions' | 'discussion'>('description');
  const [consoleTab, setConsoleTab] = useState<'testcase' | 'custom' | 'result'>('testcase');
  const [activeTestCaseId, setActiveTestCaseId] = useState(0);
  
  const [executionResult, setExecutionResult] = useState<EnhancedExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id);
    });
  }, []);

  const { data: problem, isLoading: problemLoading, error } = useQuery({
    queryKey: ['practice_problem', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('practice_problems')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
    retry: false
  });

  const { data: hasAttempted } = useQuery({
    queryKey: ['has_attempted', problem?.id, userId],
    queryFn: async () => {
      if (!userId || !problem?.id) return false;
      const { data } = await supabase
        .from('practice_submissions')
        .select('id')
        .eq('problem_id', problem.id)
        .eq('user_id', userId)
        .limit(1);
      return (data?.length || 0) > 0;
    },
    enabled: !!userId && !!problem?.id
  });

  const testCases = Array.isArray(problem?.test_cases) ? problem.test_cases as any[] : [];
  const hints = Array.isArray(problem?.hints) ? problem.hints as string[] : [];
  
  useEffect(() => {
    if (problem) {
      const templates = problem.starter_templates || {};
      const template = (templates as any)[activeLanguage] || `# Write your ${activeLanguage} code here\n`;
      setCode(template);
      setElapsedTime(0);
      timerRef.current = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [problem, activeLanguage]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const prepareCode = (userCode: string, input: any) => {
    const rawInput = formatValue(input || '');
    return wrapCodeForExecution(
      activeLanguage as WrapperLanguage,
      userCode,
      rawInput
    );
  };

  const handleRun = async () => {
    if (!problem || testCases.length === 0) return;
    setConsoleTab('result');
    setExecutionResult(null);
    setIsRunning(true);
    
    const publicTests = testCases.filter(t => t.is_public);
    const result = await executeWithJudging(
      activeLanguage,
      code,
      publicTests.length > 0 ? publicTests : [testCases[activeTestCaseId]],
      prepareCode
    );
    
    setExecutionResult(result);
    setIsRunning(false);
  };

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { 
      toast({ title: "Login Required", variant: "destructive" }); 
      navigate('/auth'); 
      return; 
    }
    
    setIsSubmitting(true);
    setConsoleTab('result');
    setExecutionResult(null);
    
    const result = await executeWithJudging(
      activeLanguage,
      code,
      testCases,
      prepareCode,
      problem?.id
    );
    
    setExecutionResult(result);
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (result.passed && problem) {
      const pointsMap: Record<string, number> = { 'Easy': 10, 'Medium': 30, 'Hard': 50 };
      const points = pointsMap[problem.difficulty] || 10;
      
      await supabase.from('practice_submissions').upsert({
        user_id: user.id, 
        problem_id: problem.id, 
        score: points, 
        status: 'completed',
        code, 
        language: activeLanguage, 
        test_cases_passed: testCases.length, 
        test_cases_total: testCases.length,
        runtime_ms: result.runtime_ms, 
        memory_kb: result.memory_kb,
        verdict: result.verdict,
        feedback_message: result.feedbackMessage
      }, { onConflict: 'user_id,problem_id' });
      
      toast({ title: `Success! +${points} Points`, className: "bg-emerald-600 border-none text-white shadow-lg" });
    }
    
    setIsSubmitting(false);
  };

  const handleRunCustomTest = async (input: string) => {
    const result = await runSingleTest(activeLanguage, code, input, prepareCode);
    return result;
  };

  const handleSelectSubmission = (submittedCode: string, lang: string) => {
    setCode(submittedCode);
    setActiveLanguage(lang as Language);
    setDescriptionTab('description');
  };

  const handleRetry = () => {
    setExecutionResult(null);
    resetJudging();
    setElapsedTime(0);
    timerRef.current = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        setIsFullScreen(true);
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            setIsFullScreen(false);
        }
    }
  };

  if (problemLoading) return (
    <div className="h-screen bg-[#080808] flex flex-col items-center justify-center gap-4 text-white relative overflow-hidden font-sans">
      <Loader2 className="w-8 h-8 text-[#94a3b8] animate-spin" />
      <div className="text-[10px] font-mono text-[#475569] uppercase tracking-widest">Loading Environment...</div>
    </div>
  );

  if (error || !problem) return (
    <div className="h-screen bg-[#080808] flex flex-col items-center justify-center gap-6 p-6 text-white font-sans">
      <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center border border-white/5">
        <Bug className="w-8 h-8 text-[#fca5a5]" />
      </div>
      <h1 className="text-xl font-serif italic text-[#f8fafc]">Data Retrieval Failed</h1>
      <Button variant="outline" onClick={() => navigate('/practice-arena')} className="border-white/10 hover:bg-white/5 text-xs uppercase tracking-widest">
        Return to Base
      </Button>
    </div>
  );

  const isJudging = judgingPhase.status !== 'idle' && judgingPhase.status !== 'complete';

  return (
    <div className="h-screen flex flex-col bg-[#080808] text-[#f8fafc] font-sans overflow-hidden selection:bg-white/20">
      
      {/* --- EXECUTIVE COMMAND BAR --- */}
      <header className="h-16 shrink-0 z-50 px-6 flex items-center justify-between border-b border-white/[0.08] bg-[#0c0c0c]">
        
        {/* Left: Problem Info */}
        <div className="flex items-center gap-5">
          <button onClick={() => navigate('/practice-arena')} className="text-[#475569] hover:text-[#f8fafc] transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center">
             <h1 className="font-serif italic text-lg text-[#f8fafc]">{problem.title}</h1>
             <span className="text-[10px] uppercase tracking-widest text-[#94a3b8] border border-white/[0.08] px-2 py-0.5 rounded-[2px] ml-3">
               {problem.difficulty}
             </span>
          </div>
        </div>

        {/* Center: Chronometer */}
        <div className="hidden md:block font-mono text-[13px] text-[#475569] tracking-[2px] bg-white/[0.02] px-3 py-1 rounded-[2px] border border-white/[0.08]">
          {formatTime(elapsedTime)}
        </div>

        {/* Right: Action Cluster */}
        <div className="flex items-center gap-4">
          
          <div className="flex items-center gap-1 bg-white/[0.02] rounded-[2px] p-0.5 border border-white/[0.08] mr-2">
            <BookmarkButton problemId={problem.id} userId={userId} />
            <LikeDislikeButtons problemId={problem.id} userId={userId} likes={problem.likes || 0} dislikes={problem.dislikes || 0} />
          </div>

          <Select value={activeLanguage} onValueChange={(v) => setActiveLanguage(v as Language)}>
            <SelectTrigger className="h-8 w-[130px] bg-transparent border-none text-[11px] uppercase tracking-widest font-semibold text-[#94a3b8] focus:ring-0 focus:outline-none hover:text-[#f8fafc] transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0c0c0c] border-white/[0.08] text-[#94a3b8]">
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="typescript">TypeScript</SelectItem>
              <SelectItem value="java">Java</SelectItem>
              <SelectItem value="cpp">C++</SelectItem>
            </SelectContent>
          </Select>

          <button 
            onClick={handleRun} 
            disabled={isRunning || isSubmitting || isJudging} 
            className="text-[11px] font-semibold uppercase tracking-widest px-5 py-2 rounded-[2px] border border-white/[0.08] text-[#94a3b8] bg-transparent hover:border-[#94a3b8] hover:text-[#f8fafc] transition-all disabled:opacity-50"
          >
            {isRunning ? 'Running...' : 'Run Analysis'}
          </button>

          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting || isRunning || isJudging} 
            className="text-[11px] font-semibold uppercase tracking-widest px-5 py-2 rounded-[2px] border border-transparent text-[#080808] bg-[#f8fafc] hover:bg-[#94a3b8] hover:scale-[1.02] transition-all shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Final'}
          </button>

          <button onClick={toggleFullScreen} className="text-[#475569] hover:text-[#f8fafc] hidden lg:block">
             {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* --- MAIN WORKSPACE --- */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          
          {/* LEFT PANEL: Intel Briefing */}
          <ResizablePanel defaultSize={40} minSize={25} className="bg-[#0c0c0c] border-r border-white/[0.08] flex flex-col relative group/left">
            
            {/* Tabs Navigation */}
            <div className="flex px-6 border-b border-white/[0.08] gap-6 shrink-0">
              {[
                { value: 'description', label: 'Briefing' },
                { value: 'editorial', label: 'Editorial' },
                { value: 'submissions', label: 'Log' },
                { value: 'discussion', label: 'Comms' },
              ].map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setDescriptionTab(tab.value as any)}
                  className={cn(
                    "text-[10px] uppercase tracking-[1.5px] py-4 relative transition-colors",
                    descriptionTab === tab.value 
                      ? "text-[#f8fafc] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-[#f8fafc]" 
                      : "text-[#475569] hover:text-[#94a3b8]"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 relative overflow-hidden bg-[#0c0c0c]">
              {descriptionTab === 'description' && (
                <ScrollArea className="h-full">
                  <div className="p-10 max-w-3xl mx-auto">
                    <h2 className="font-serif italic text-3xl text-[#f8fafc] mb-6">{problem.title}</h2>
                    
                    <div className="text-[15px] leading-relaxed text-[#94a3b8] mb-8 font-sans space-y-4">
                      <div className="whitespace-pre-wrap">{problem.description}</div>
                    </div>

                    {testCases.length > 0 && (
                      <div className="mb-8">
                        <span className="text-[9px] uppercase tracking-widest text-[#475569] block mb-3">Simulation Data</span>
                        {testCases.filter((t: any) => t.is_public).map((t: any, i: number) => (
                          <div key={i} className="bg-[#080808] border border-white/[0.08] rounded-[2px] p-4 mb-4">
                             <div className="mb-2">
                               <span className="text-[10px] text-[#475569] uppercase tracking-wider block mb-1">Input</span>
                               <code className="text-[13px] font-mono text-[#d1d1d1]">{formatValue(t.input)}</code>
                             </div>
                             <div>
                               <span className="text-[10px] text-[#475569] uppercase tracking-wider block mb-1">Expected Output</span>
                               <code className="text-[13px] font-mono text-[#94a3b8]">{formatValue(t.output)}</code>
                             </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-6 mt-12 pt-8 border-t border-white/[0.08]">
                       <HintsAccordion hints={hints} hasAttempted={!!hasAttempted} />
                       <ProblemNotes problemId={problem.id} userId={userId} />
                    </div>
                  </div>
                </ScrollArea>
              )}

              {descriptionTab === 'editorial' && (
                <ScrollArea className="h-full">
                  <div className="p-10">
                    {problem.editorial ? (
                      <div className="prose prose-invert prose-sm max-w-none font-sans text-[#94a3b8]"><p className="whitespace-pre-wrap">{problem.editorial}</p></div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[300px] text-[#475569]">
                        <BookOpen className="w-6 h-6 mb-3 opacity-50" />
                        <p className="text-[10px] uppercase tracking-widest">Classified Information</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}

              {descriptionTab === 'submissions' && (
                <SubmissionHistory problemId={problem.id} userId={userId} onSelectSubmission={handleSelectSubmission} />
              )}

              {descriptionTab === 'discussion' && (
                <DiscussionTab problemId={problem.id} userId={userId} />
              )}
            </div>

            {/* Verdict Overlay (Success State) */}
            <AnimatePresence>
              {executionResult?.passed && (
                <motion.div 
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="absolute bottom-0 left-0 right-0 z-20 bg-[#0c120c] border-t border-emerald-900/50 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
                >
                   <div className="p-8">
                      <div className="flex items-center justify-between mb-6">
                         <div>
                            <h3 className="font-serif italic text-2xl text-[#4ade80] mb-1">Mission Accomplished</h3>
                            <p className="text-[10px] uppercase tracking-[2px] text-emerald-500/70">All Test Cases Verified</p>
                         </div>
                         <div className="flex gap-3">
                           <button onClick={handleRetry} className="text-[10px] uppercase tracking-widest px-4 py-2 border border-white/[0.1] text-[#94a3b8] hover:text-white hover:border-white/20 transition-colors">
                             Optimize
                           </button>
                           <button onClick={() => navigate('/practice-arena')} className="text-[10px] uppercase tracking-widest px-4 py-2 bg-emerald-900/20 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-900/30 transition-colors">
                             Return to HQ
                           </button>
                         </div>
                      </div>
                      <PerformanceChart
                        runtimePercentile={executionResult.runtimePercentile || 50}
                        memoryPercentile={executionResult.memoryPercentile || 50}
                        runtime_ms={executionResult.runtime_ms}
                        memory_kb={executionResult.memory_kb}
                        testsPassed={executionResult.testResults.length}
                        testsTotal={executionResult.testResults.length}
                      />
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-[#080808] w-1 border-l border-r border-white/[0.05]" />

          {/* RIGHT PANEL: Editor & Console */}
          <ResizablePanel defaultSize={60} className="flex flex-col bg-[#0a0a0a]">
            
            {/* TOP: Code Editor */}
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={60} className="flex flex-col relative">
                <div className="absolute top-4 right-4 z-10 opacity-30 hover:opacity-100 transition-opacity">
                   <Settings className="w-4 h-4 text-[#94a3b8] cursor-pointer" />
                </div>
                <div className="flex-1">
                  <CodeEditor value={code} onChange={setCode} language={activeLanguage} />
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle className="bg-[#0c0c0c] h-1 border-t border-b border-white/[0.05]" />
              
              {/* BOTTOM: Console */}
              <ResizablePanel defaultSize={40} className="bg-[#0c0c0c] flex flex-col min-h-[200px]">
                
                {/* Console Header */}
                <div className="h-10 border-b border-white/[0.08] flex items-center px-5 gap-6 bg-white/[0.01] shrink-0">
                  <button 
                    onClick={() => setConsoleTab('testcase')}
                    className={cn(
                      "text-[10px] uppercase tracking-widest cursor-pointer transition-colors h-full flex items-center border-b-[2px]",
                      consoleTab === 'testcase' ? "border-[#f8fafc] text-[#f8fafc]" : "border-transparent text-[#475569] hover:text-[#94a3b8]"
                    )}
                  >
                    Test Cases
                  </button>
                  <button 
                    onClick={() => setConsoleTab('custom')}
                    className={cn(
                      "text-[10px] uppercase tracking-widest cursor-pointer transition-colors h-full flex items-center border-b-[2px]",
                      consoleTab === 'custom' ? "border-[#f8fafc] text-[#f8fafc]" : "border-transparent text-[#475569] hover:text-[#94a3b8]"
                    )}
                  >
                    Custom Input
                  </button>
                  <button 
                    onClick={() => setConsoleTab('result')}
                    className={cn(
                      "text-[10px] uppercase tracking-widest cursor-pointer transition-colors h-full flex items-center border-b-[2px]",
                      consoleTab === 'result' ? "border-[#f8fafc] text-[#f8fafc]" : "border-transparent text-[#475569] hover:text-[#94a3b8]"
                    )}
                  >
                    Execution Log
                    {executionResult && (
                       <span className={cn("ml-2 w-1.5 h-1.5 rounded-full", executionResult.passed ? "bg-emerald-400" : "bg-red-400")} />
                    )}
                  </button>
                </div>

                {/* Console Content */}
                <div className="flex-1 overflow-auto bg-[#080808] font-mono p-6 relative">
                  
                  {consoleTab === 'testcase' && (
                    <div className="h-full flex flex-col">
                      <div className="flex gap-2 mb-6">
                        {testCases.filter(t => t.is_public).map((_, i) => (
                          <button 
                            key={i} 
                            onClick={() => setActiveTestCaseId(i)} 
                            className={cn(
                              "px-3 py-1 text-[10px] rounded-[2px] border transition-all",
                              activeTestCaseId === i 
                                ? "bg-[#141414] border-white/[0.2] text-[#f8fafc]" 
                                : "bg-transparent border-white/[0.08] text-[#475569] hover:text-[#94a3b8]"
                            )}
                          >
                            Node {i + 1}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-6">
                        <div>
                          <span className="text-[9px] uppercase tracking-widest text-[#475569] block mb-2">Input Stream</span>
                          <div className="bg-[#0c0c0c] border border-white/[0.08] p-4 text-[13px] text-[#d1d1d1]">
                             {formatValue(testCases[activeTestCaseId]?.input)}
                          </div>
                        </div>
                        {testCases[activeTestCaseId]?.output && (
                          <div>
                            <span className="text-[9px] uppercase tracking-widest text-[#475569] block mb-2">Expected Output</span>
                            <div className="bg-[#0c0c0c] border border-white/[0.08] p-4 text-[13px] text-[#94a3b8]">
                               {formatValue(testCases[activeTestCaseId]?.output)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {consoleTab === 'custom' && (
                    <CustomTestSandbox
                      defaultInput={testCases[0]?.input ? formatValue(testCases[0].input) : ''}
                      onRunCustomTest={handleRunCustomTest}
                      isRunning={judgingPhase.status === 'running'}
                    />
                  )}

                  {consoleTab === 'result' && (
                    <div className="h-full">
                      {isJudging ? (
                        <div className="h-full flex items-center justify-center">
                           <JudgingLoader phase={judgingPhase} elapsedMs={elapsedMs} />
                        </div>
                      ) : !executionResult ? (
                        <div className="h-full flex flex-col items-center justify-center text-[#475569]">
                           <Terminal className="w-8 h-8 mb-4 opacity-20" />
                           <p className="text-[10px] uppercase tracking-widest">System Standby</p>
                           <p className="text-[10px] mt-2 opacity-60">Initialize execution sequence</p>
                        </div>
                      ) : executionResult.passed ? (
                         <div className="h-full flex flex-col items-center justify-center text-[#f8fafc]">
                            <div className="w-16 h-16 bg-[#0c120c] rounded-full flex items-center justify-center border border-emerald-900 mb-6 shadow-[0_0_20px_rgba(74,222,128,0.1)]">
                               <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h3 className="font-serif italic text-xl text-[#f8fafc] mb-2">Verification Successful</h3>
                            <p className="text-[11px] text-[#475569] max-w-[250px] text-center leading-relaxed">
                               All parameters within operational limits. Detailed metrics available in the briefing panel.
                            </p>
                         </div>
                      ) : (
                        <VerdictDisplay
                          verdict={executionResult.verdict}
                          feedbackMessage={executionResult.feedbackMessage}
                          feedbackSuggestion={executionResult.feedbackSuggestion}
                          failedTestIndex={executionResult.failedTestIndex}
                          testResults={executionResult.testResults}
                          errorDetails={executionResult.errorDetails}
                          runtime_ms={executionResult.runtime_ms}
                          memory_kb={executionResult.memory_kb}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Verdict Banner (Bottom of Console - Always visible if result exists) */}
                {executionResult?.passed && (
                   <div className="bg-[#0c120c] border-t border-emerald-900/30 px-6 py-4 flex items-center justify-between shrink-0">
                      <div className="font-serif italic text-[#4ade80] text-[15px]">Verification Successful</div>
                      <div className="text-[10px] uppercase tracking-widest text-[#475569] flex gap-4">
                         <span>Latency: <span className="text-[#f8fafc] ml-1">{executionResult.runtime_ms}ms</span></span>
                         <span>Memory: <span className="text-[#f8fafc] ml-1">{(executionResult.memory_kb / 1024).toFixed(1)}MB</span></span>
                      </div>
                   </div>
                )}
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
