import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { useCodeRunner, Language } from '@/hooks/useCodeRunner';
import { CodeEditor } from '@/components/CodeEditor';
import { Play, Send, CheckCircle2, XCircle, ChevronLeft, Loader2, Bug, Terminal, FileCode2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function PracticeSolver() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { executeCode, loading } = useCodeRunner();

  const [activeLanguage, setActiveLanguage] = useState<Language>('python');
  const [code, setCode] = useState('');
  const [consoleTab, setConsoleTab] = useState('testcases');
  const [outputResult, setOutputResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch Problem Data with Debugging
  const { data: problem, isLoading: problemLoading, error } = useQuery({
    queryKey: ['practice_problem', slug],
    queryFn: async () => {
      console.log("Fetching problem for slug:", slug);
      const { data, error } = await supabase
        .from('practice_problems')
        .select('*')
        .eq('slug', slug)
        .maybeSingle(); // Prevents crashing on 0 rows
      
      if (error) {
        console.error("Supabase Error:", error);
        throw error;
      }
      return data;
    },
    enabled: !!slug, // Only run if slug exists
    retry: false
  });

  // 2. Safe Data Extraction
  const testCases = Array.isArray(problem?.test_cases) ? problem.test_cases : [];
  
  // 3. Initialize Editor
  useEffect(() => {
    if (problem) {
      // @ts-ignore - Supabase types might imply JSON, but we cast to object
      const templates = problem.starter_templates || {};
      // @ts-ignore
      const template = templates[activeLanguage] || `# Write your ${activeLanguage} code here\n`;
      setCode(template);
    }
  }, [problem, activeLanguage]);

  // 4. Run Logic
  const handleRun = async () => {
    if (!problem) return;
    setConsoleTab('output');
    setOutputResult({ status: 'running' });
    
    const sampleTest = testCases.find((t: any) => t.is_public) || testCases[0];
    
    if (!sampleTest) {
      setOutputResult({ status: 'error', message: 'No test cases found.' });
      return;
    }

    let codeToRun = code;
    // Auto-inject driver code for Python class-based solutions
    if (activeLanguage === 'python' && sampleTest.input) {
       const cleanInput = typeof sampleTest.input === 'string' ? sampleTest.input.replace(/[a-zA-Z0-9_]+\s=\s/g, '') : '';
       
       codeToRun += `\n\n# --- Driver Code (Auto-Injected) ---\ntry:\n    if 'Solution' in locals():\n        sol = Solution()\n        methods = [m for m in dir(sol) if not m.startswith('__')]\n        if methods:\n            print(getattr(sol, methods[0])(${cleanInput}))\n        else:\n            print("No method found in Solution class.")\n    elif 'twoSum' in locals():\n         print(twoSum(${cleanInput}))\n    else:\n        print("Error: Function definition not found.")\nexcept Exception as e:\n    print(f"Runtime Error: {e}")`;
    }

    const result = await executeCode(activeLanguage, codeToRun, "");
    
    const cleanOutput = result.output?.trim();
    const expectedStr = String(sampleTest.output || '').trim();
    const passed = cleanOutput === expectedStr || (cleanOutput && cleanOutput.includes(expectedStr));

    setOutputResult({
      status: 'complete',
      passed,
      userOutput: cleanOutput,
      expected: expectedStr,
      input: String(sampleTest.input),
      error: result.error
    });
  };

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Login Required", description: "Please login to submit.", variant: "destructive" });
      navigate('/auth');
      return;
    }
    setSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      setSubmitting(false);
      toast({ title: "Submitted", description: "Solution accepted!", className: "bg-green-600 text-white border-none" });
    }, 1500);
  };

  // --- LOADING STATE ---
  if (problemLoading) return (
    <div className="h-screen bg-[#09090b] flex flex-col items-center justify-center gap-4 text-white">
      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      <div className="font-mono text-xs tracking-widest text-gray-500">LOADING CHALLENGE...</div>
    </div>
  );

  // --- ERROR / EMPTY STATE ---
  if (error || !problem) return (
    <div className="h-screen bg-[#09090b] flex flex-col items-center justify-center gap-6 p-6 text-white">
      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
        <Bug className="w-8 h-8 text-red-500" />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Problem Not Found</h1>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          We couldn't load the problem data. This usually means the database table is empty or the URL slug is incorrect.
        </p>
        <Button variant="outline" onClick={() => navigate('/practice-arena')} className="border-white/10 hover:bg-white/5">
          Return to Arena
        </Button>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-[#050505] text-white overflow-hidden font-sans selection:bg-primary/30">
      
      {/* 1. HEADER */}
      <header className="h-14 bg-[#0a0a0a] border-b border-white/5 flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/practice-arena')} className="text-gray-400 hover:text-white h-9 w-9">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-sm tracking-wide text-gray-100">{problem.title}</h1>
            <Badge variant="outline" className={cn("text-[10px] py-0 h-5 border-white/10 bg-white/5", 
              problem.difficulty === 'Easy' ? "text-green-400" : 
              problem.difficulty === 'Medium' ? "text-yellow-400" : "text-red-400")}>
              {problem.difficulty}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={activeLanguage} onValueChange={(v) => setActiveLanguage(v as Language)}>
            <SelectTrigger className="h-8 w-[130px] bg-[#151515] border-white/10 text-xs font-medium text-gray-300 focus:ring-0 hover:bg-[#1a1a1a] transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#151515] border-white/10 text-gray-300">
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="java">Java</SelectItem>
              <SelectItem value="cpp">C++</SelectItem>
            </SelectContent>
          </Select>

          <div className="h-5 w-px bg-white/10 mx-1" />

          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleRun} 
            disabled={loading} 
            className="h-8 text-xs bg-white/5 hover:bg-white/10 text-white border border-white/5"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2"/> : <Play className="w-3.5 h-3.5 mr-2 fill-current"/>}
            Run
          </Button>
          
          <Button 
            size="sm" 
            onClick={handleSubmit} 
            disabled={submitting} 
            className="h-8 text-xs bg-green-600 hover:bg-green-500 text-white font-semibold border-0 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2"/> : <Send className="w-3.5 h-3.5 mr-2"/>}
            Submit
          </Button>
        </div>
      </header>

      {/* 2. WORKSPACE PANELS */}
      <div className="flex-1 overflow-hidden relative">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          
          {/* LEFT: DESCRIPTION */}
          <ResizablePanel defaultSize={40} minSize={25} className="bg-[#0
