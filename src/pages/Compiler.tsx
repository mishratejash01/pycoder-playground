import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CodeEditor } from '@/components/CodeEditor';
import { Language } from '@/hooks/useCodeRunner';
import { usePyodide } from '@/hooks/usePyodide';
import { useJavaScriptRunner } from '@/hooks/useJavaScriptRunner';
import { useInteractiveRunner } from '@/hooks/useInteractiveRunner';
import { TerminalView } from '@/components/TerminalView';
import { 
  Loader2, Play, RefreshCw, Home, Terminal as TerminalIcon, 
  Download, Lock, Square, Clock, RotateCcw, Zap, Settings, 
  Wifi, Activity, Cpu, Maximize2, Minimize2, ChevronRight, Command
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';

// --- PREMIUM CONFIGURATION WITH REAL LOGOS ---

const LANGUAGES_CONFIG = [
  { 
    id: 'python', 
    name: 'Python', 
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
    color: 'text-yellow-400' 
  },
  { 
    id: 'javascript', 
    name: 'JavaScript', 
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
    color: 'text-yellow-300' 
  },
  { 
    id: 'java', 
    name: 'Java', 
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
    color: 'text-red-400' 
  },
  { 
    id: 'cpp', 
    name: 'C++', 
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg',
    color: 'text-blue-500' 
  },
  { 
    id: 'c', 
    name: 'C', 
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg',
    color: 'text-blue-400' 
  },
  { 
    id: 'sql', 
    name: 'SQL', 
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg',
    color: 'text-purple-400' 
  },
  { 
    id: 'bash', 
    name: 'Bash', 
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg',
    color: 'text-white' 
  },
] as const;

// --- EXPANDED STARTER TEMPLATES ---

const getStarterTemplate = (lang: Language) => {
  switch(lang) {
    case 'java': 
      return `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        
        // --- MISSION START ---
        System.out.println(">> JAVA RUNTIME ENVIRONMENT ACTIVE");
        System.out.print(">> Enter Agent Name: ");
        
        String name = sc.nextLine();
        
        System.out.println(">> Authenticating " + name + "...");
        System.out.println(">> Access Granted.");
        
        // Your logic here
        
        sc.close();
    }
}`;
    case 'cpp': 
      return `#include <iostream>
#include <string>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    // --- C++ OPTIMIZED CORE ---
    string input_data;
    
    cout << ">> SYSTEM INITIALIZED." << endl;
    cout << ">> Awaiting Input Command: ";
    
    getline(cin, input_data);
    
    cout << ">> Processing: " << input_data << endl;
    cout << ">> Execution Complete." << endl;
    
    return 0;
}`;
    case 'c': 
      return `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    char buffer[100];
    
    printf(">> C KERNEL LOADED.\\n");
    printf(">> Enter command sequence: ");
    
    fgets(buffer, 100, stdin);
    // Remove newline
    buffer[strcspn(buffer, "\\n")] = 0; 
    
    printf(">> Received: %s\\n", buffer);
    printf(">> Memory cleared.\\n");
    
    return 0;
}`;
    case 'javascript': 
      return `// --- JAVASCRIPT ASYNC RUNTIME ---

console.log(">> V8 ENGINE ONLINE");

// Interactive Input Wrapper
const userInput = await prompt(">> Enter system parameters: ");

console.log(\`>> Analyzing \${userInput}...\`);

const metrics = [
  { id: 1, status: 'OK' },
  { id: 2, status: 'OPTIMIZED' }
];

console.table(metrics);
console.log(">> Process terminated.");`;
    case 'sql': 
      return `-- --- SQL DATA MATRIX ---

-- 1. Initialize Schema
CREATE TABLE missions (
    id INTEGER PRIMARY KEY,
    codename TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    priority INTEGER
);

-- 2. Inject Data
INSERT INTO missions (codename, status, priority) VALUES 
    ('PROJECT_GENESIS', 'ACTIVE', 1),
    ('OPERATION_NIGHTFALL', 'COMPLETED', 2),
    ('PROTOCOL_OMEGA', 'CLASSIFIED', 5);

-- 3. Query Matrix
SELECT * FROM missions 
WHERE priority <= 2
ORDER BY priority ASC;`;
    case 'bash': 
      return `#!/bin/bash

echo ">> BASH SHELL ACCESS GRANTED"
echo ">> Current User: $USER"

read -p ">> Enter target directory: " target

if [ -z "$target" ]; then
    echo ">> No target specified. Defaulting to root."
else
    echo ">> Navigating to $target..."
fi

echo ">> Script execution finished."`;
    default: 
      return `# --- PYTHON 3 NEURAL INTERFACE ---
import time
import sys

def boot_system():
    print(">> LOADING KERNEL MODULES...")
    time.sleep(0.5)
    print(">> READY.")

boot_system()

# Interactive Input
user_cmd = input(">> Enter Python Expression: ")

try:
    result = eval(user_cmd)
    print(f">> Result: {result}")
except Exception as e:
    print(f">> Error: {e}")

print(">> Session Closed.")`;
  }
};

const getFileName = (lang: Language) => {
    switch(lang) {
    case 'java': return 'Main.java';
    case 'cpp': return 'main.cpp';
    case 'c': return 'main.c';
    case 'javascript': return 'index.js';
    case 'sql': return 'query.sql';
    case 'bash': return 'script.sh';
    default: return 'main.py';
  }
};

const formatTime = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  const seconds = (ms / 1000).toFixed(2);
  return `${seconds}s`;
};

// --- MAIN COMPONENT ---

const Compiler = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // --- STATE ---
  const [activeLanguage, setActiveLanguage] = useState<Language>(() => {
    return (localStorage.getItem('codevo-lang') as Language) || 'python';
  });
  
  const [code, setCode] = useState<string>(() => {
    return localStorage.getItem('codevo-code') || getStarterTemplate('python');
  });

  const [lockedLanguages, setLockedLanguages] = useState<Record<string, boolean>>({});
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Refs for timing
  const executionStartRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // --- CODE RUNNERS ---
  const { 
    runCode: runPython, 
    output: pythonOutput, 
    isRunning: pythonRunning, 
    isReady: pythonReady, 
    isWaitingForInput: pythonWaitingForInput, 
    writeInputToWorker: writePythonInput, 
    stopExecution: stopPython, 
    hasSharedArrayBuffer
  } = usePyodide();

  const {
    runCode: runJS, 
    output: jsOutput, 
    isRunning: jsRunning, 
    isWaitingForInput: jsWaitingForInput, 
    writeInput: writeJSInput, 
    stopExecution: stopJS,
  } = useJavaScriptRunner();

  const {
    runCode: runInteractive, 
    output: interactiveOutput, 
    isRunning: interactiveRunning, 
    isWaitingForInput: interactiveWaitingForInput, 
    writeInput: writeInteractiveInput, 
    stopExecution: stopInteractive,
  } = useInteractiveRunner(activeLanguage);

  const isPython = activeLanguage === 'python';
  const isJavaScript = activeLanguage === 'javascript';
  
  // Unified Runner State
  const getCurrentRunnerState = useCallback(() => {
    if (isPython) {
      return { output: pythonOutput, isRunning: pythonRunning, isWaitingForInput: pythonWaitingForInput, isReady: pythonReady };
    } else if (isJavaScript) {
      return { output: jsOutput, isRunning: jsRunning, isWaitingForInput: jsWaitingForInput, isReady: true };
    } else {
      return { output: interactiveOutput, isRunning: interactiveRunning, isWaitingForInput: interactiveWaitingForInput, isReady: true };
    }
  }, [isPython, isJavaScript, pythonOutput, pythonRunning, pythonWaitingForInput, pythonReady, jsOutput, jsRunning, jsWaitingForInput, interactiveOutput, interactiveRunning, interactiveWaitingForInput]);

  const runnerState = getCurrentRunnerState();
  const isLoading = runnerState.isRunning || (isPython && !pythonReady);
  const isExecuting = runnerState.isRunning;

  // --- EFFECTS ---

  // Timer Logic
  useEffect(() => {
    if (isExecuting && executionStartRef.current === null) {
      executionStartRef.current = Date.now();
      timerIntervalRef.current = setInterval(() => {
        if (executionStartRef.current) {
          setExecutionTime(Date.now() - executionStartRef.current);
        }
      }, 50); // High precision update
    } else if (!isExecuting && executionStartRef.current !== null) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      executionStartRef.current = null;
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isExecuting]);

  // Fetch Locked Languages
  useEffect(() => {
    const fetchLanguages = async () => {
      const { data, error } = await supabase
        .from('languages')
        .select('id, is_locked');

      if (!error && data) {
        const statusMap: Record<string, boolean> = {};
        data.forEach((lang: any) => {
          statusMap[lang.id] = lang.is_locked;
        });
        setLockedLanguages(statusMap);
      }
    };

    fetchLanguages();
  }, []);

  // Persist Code & Language
  useEffect(() => {
    localStorage.setItem('codevo-code', code);
    localStorage.setItem('codevo-lang', activeLanguage);
  }, [code, activeLanguage]);

  // --- HANDLERS ---

  const handleLanguageChange = (val: string) => {
    const newLang = val as Language;
    
    if (lockedLanguages[newLang]) {
        toast({ title: "Module Locked", description: "This language protocol is currently disabled.", variant: "destructive" });
        return;
    }

    setActiveLanguage(newLang);
    setCode(getStarterTemplate(newLang));
    setExecutionTime(null);
  };

  const handleReset = () => {
    setCode(getStarterTemplate(activeLanguage));
    setExecutionTime(null);
    toast({ 
      title: "System Reset", 
      description: "Codebase reverted to default operational parameters.",
      className: "bg-[#0c0c0e] border border-white/10 text-white"
    });
  };

  const handleRun = async () => {
    if (isLoading) return;
    
    if (lockedLanguages[activeLanguage]) {
        toast({ title: "Access Denied", description: "Language module locked.", variant: "destructive" });
        return;
    }

    setExecutionTime(null);
    executionStartRef.current = Date.now();

    if (isPython) {
      runPython(code);
    } else if (isJavaScript) {
      runJS(code);
    } else {
      runInteractive(code);
    }
  };

  const handleStop = () => {
    if (isPython) {
      stopPython();
    } else if (isJavaScript) {
      stopJS();
    } else {
      stopInteractive();
    }
    toast({ title: "Sequence Aborted", description: "Execution terminated manually.", variant: "destructive" });
  };

  const handleDownload = () => {
    try {
      const filename = getFileName(activeLanguage);
      const blob = new Blob([code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: "Archive Saved", description: `${filename} downloaded successfully.` });
    } catch (err) {
      toast({ title: "Error", description: "Failed to generate file archive.", variant: "destructive" });
    }
  };

  const handleTerminalInput = useCallback((char: string) => {
    if (isPython) {
      writePythonInput(char);
    } else if (isJavaScript) {
      writeJSInput(char);
    } else {
      writeInteractiveInput(char);
    }
  }, [isPython, isJavaScript, writePythonInput, writeJSInput, writeInteractiveInput]);

  const handleClearTerminal = () => {
    if (!isExecuting) {
      if (isPython) {
        runPython(''); // Empty run to clear
      } else if (isJavaScript) {
        runJS('');
      } else {
        runInteractive('');
      }
    }
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

  const activeLangConfig = LANGUAGES_CONFIG.find(l => l.id === activeLanguage);

  return (
    <div className="h-screen flex flex-col bg-[#020202] text-white overflow-hidden font-sans selection:bg-primary/30 relative">
      
      {/* --- AMBIENT BACKGROUND FX --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-20%] left-[10%] w-[60vw] h-[60vw] bg-blue-600/5 rounded-full blur-[150px] animate-pulse" />
         <div className="absolute bottom-[-20%] right-[10%] w-[50vw] h-[50vw] bg-purple-600/5 rounded-full blur-[150px]" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      </div>

      {/* --- HEADER: TITAN DECK --- */}
      <header className="relative z-50 h-16 shrink-0 border-b border-white/5 bg-[#050505]/90 backdrop-blur-2xl flex items-center justify-between px-6 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="w-10 h-10 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:text-white text-zinc-400 transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Home className="w-5 h-5 group-hover:scale-110 transition-transform relative z-10" />
          </Button>
          
          <div className="hidden md:flex items-center gap-4">
             <div className="h-8 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
             <div className="flex flex-col justify-center">
                <span className="text-[10px] font-bold text-zinc-500 tracking-[0.3em] uppercase font-neuropol hover:text-primary transition-colors cursor-default">
                  CODEVO <span className="text-primary">PRO</span>
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                   <div className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_10px_currentColor]", isExecuting ? "bg-green-500 text-green-500 animate-pulse" : "bg-blue-500 text-blue-500")} />
                   <span className="text-[10px] font-mono font-medium text-zinc-400">
                     {isExecuting ? 'EXECUTION IN PROGRESS' : 'ENVIRONMENT READY'}
                   </span>
                </div>
             </div>
          </div>
        </div>

        {/* Center: Language Module */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center p-1 rounded-2xl bg-[#08080a] border border-white/10 shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)]">
           <Select value={activeLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="h-10 min-w-[180px] bg-transparent border-none text-sm font-bold text-white focus:ring-0 hover:bg-white/5 rounded-xl transition-all data-[state=open]:bg-white/5 group">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 p-0.5 bg-white/5 rounded-md border border-white/5 flex items-center justify-center group-hover:border-white/20 transition-colors">
                  <img src={activeLangConfig?.logo} alt={activeLangConfig?.name} className="w-full h-full object-contain drop-shadow-md" />
                </div>
                <span className="group-hover:text-primary transition-colors">{activeLangConfig?.name}</span>
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#0c0c0e] border-white/10 text-white rounded-xl backdrop-blur-2xl shadow-2xl min-w-[200px] p-2">
              {LANGUAGES_CONFIG.map((lang) => (
                <SelectItem 
                  key={lang.id} 
                  value={lang.id} 
                  disabled={lockedLanguages[lang.id]}
                  className="text-xs font-medium focus:bg-white/10 cursor-pointer rounded-lg py-2 my-0.5 transition-colors group"
                >
                  <div className="flex items-center gap-3 w-full">
                    <img src={lang.logo} alt={lang.name} className="w-5 h-5 object-contain opacity-70 group-hover:opacity-100 transition-opacity" />
                    <span className={cn("transition-colors", lang.color)}>{lang.name}</span>
                    {lockedLanguages[lang.id] && <Lock className="w-3 h-3 text-red-500 ml-auto" />}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="h-6 w-px bg-white/5 mx-2" />

          {/* Timer Widget */}
          <div className="flex items-center gap-3 px-4 min-w-[100px] justify-center">
             <Clock className={cn("w-4 h-4", isExecuting ? "text-green-400 animate-spin-slow" : "text-zinc-600")} />
             <span className="font-mono text-sm font-medium text-zinc-300 tabular-nums tracking-wider">
               {isExecuting ? formatTime(executionTime || 0) : executionTime !== null ? formatTime(executionTime) : '0.00s'}
             </span>
          </div>
        </div>

        {/* Right: Action Deck */}
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-[#08080a] rounded-xl p-1 border border-white/5 shadow-inner">
             <Button onClick={handleReset} variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-all hover:scale-105" title="Reset Code">
                <RotateCcw className="w-4 h-4" />
             </Button>
             <Button onClick={handleDownload} variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-all hover:scale-105" title="Download Source">
                <Download className="w-4 h-4" />
             </Button>
             <Button onClick={toggleFullScreen} variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 hidden sm:flex transition-all hover:scale-105" title="Toggle Fullscreen">
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
             </Button>
          </div>

          <div className="h-10 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent hidden sm:block" />

          {isExecuting ? (
            <Button 
              onClick={handleStop}
              className="h-10 px-6 bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20 font-bold text-xs tracking-wider shadow-[0_0_30px_-10px_rgba(239,68,68,0.5)] animate-pulse rounded-xl uppercase"
            >
              <Square className="w-4 h-4 mr-2 fill-current" /> Terminate
            </Button>
          ) : (
            <Button 
              onClick={handleRun} 
              disabled={isLoading || lockedLanguages[activeLanguage]} 
              className={cn(
                "group relative h-10 px-8 font-bold text-xs tracking-widest uppercase overflow-hidden transition-all rounded-xl",
                isLoading ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" : "bg-white text-black hover:scale-105 shadow-[0_0_30px_-5px_rgba(255,255,255,0.4)]"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 z-0" />
              <div className="relative z-10 flex items-center gap-2">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                {isLoading ? "INITIALIZING" : "RUN CODE"}
              </div>
            </Button>
          )}
        </div>
      </header>

      {/* --- WORKSPACE --- */}
      <div className="flex-1 overflow-hidden relative z-10 p-2 md:p-6">
        <div className="h-full w-full rounded-3xl border border-white/10 bg-[#0a0a0c]/50 backdrop-blur-xl overflow-hidden shadow-2xl flex flex-col relative group/workspace">
          
          {/* Active Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover/workspace:opacity-100 transition-opacity duration-700 pointer-events-none" />

          {/* Decorative Corner Borders */}
          <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-primary/30 rounded-tl-2xl pointer-events-none z-20" />
          <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-primary/30 rounded-tr-2xl pointer-events-none z-20" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-primary/30 rounded-bl-2xl pointer-events-none z-20" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-primary/30 rounded-br-2xl pointer-events-none z-20" />

          <ResizablePanelGroup direction="vertical" className="h-full relative z-10">
            
            {/* EDITOR PANEL */}
            <ResizablePanel defaultSize={isMobile ? 60 : 70} minSize={30} className="bg-[#09090b]/80 relative group">
              {/* Floating File Tab */}
              <div className="absolute top-0 left-6 z-10">
                 <div className="px-4 py-1.5 bg-[#0c0c0e] rounded-b-lg border border-t-0 border-white/10 text-xs font-mono text-zinc-400 flex items-center gap-2 shadow-xl border-t-primary/50">
                    <img src={activeLangConfig?.logo} className="w-3.5 h-3.5 opacity-70" alt="lang" />
                    {getFileName(activeLanguage)}
                 </div>
              </div>

              {/* Settings Toggle */}
              <div className="absolute top-0 right-6 z-10">
                 <div className="px-3 py-1.5 bg-[#0c0c0e] rounded-b-lg border border-t-0 border-white/10 text-[10px] font-mono text-zinc-500 flex items-center gap-2 shadow-xl cursor-pointer hover:text-white hover:bg-white/5 transition-all">
                    <Settings className="w-3 h-3" /> Config
                 </div>
              </div>

              <CodeEditor 
                value={code} 
                onChange={setCode} 
                language={activeLanguage}
              />
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-[#050505] border-t border-b border-white/5 h-2 hover:bg-primary/50 transition-colors group-hover/handle:shadow-[0_0_10px_rgba(59,130,246,0.5)]" />

            {/* TERMINAL PANEL */}
            <ResizablePanel defaultSize={isMobile ? 40 : 30} minSize={15} className="bg-[#08080a] flex flex-col min-h-[100px] relative">
              
              {/* Terminal Header */}
              <div className="flex items-center justify-between px-4 h-11 border-b border-white/5 bg-[#0a0a0c] shrink-0">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    <TerminalIcon className="w-4 h-4 text-primary" /> 
                    Output Stream
                  </div>
                  {isPython && !hasSharedArrayBuffer && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[9px] font-bold text-amber-500 uppercase tracking-wide">
                      Safe Mode
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {isExecuting && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/5 border border-green-500/10 shadow-[0_0_15px_-5px_rgba(34,197,94,0.3)]">
                      <Zap className="w-3 h-3 text-green-400 fill-green-400 animate-pulse" />
                      <span className="text-[9px] font-bold text-green-400 tracking-wider">
                        {runnerState.isWaitingForInput ? 'AWAITING INPUT' : 'PROCESSING'}
                      </span>
                    </div>
                  )}
                  
                  <button 
                    onClick={handleClearTerminal}
                    disabled={isExecuting}
                    className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-colors disabled:opacity-50 hover:rotate-180 duration-500"
                    title="Clear Log"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              {/* Terminal Body */}
              <div className="flex-1 relative bg-[#050505] overflow-hidden">
                <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 z-0" />
                {isPython && !pythonReady ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 gap-6 z-10">
                    <div className="relative">
                       <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse" />
                       <div className="relative z-10 bg-[#0c0c0e] border border-white/10 p-4 rounded-2xl shadow-2xl">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                       </div>
                    </div>
                    <div className="text-center space-y-2">
                       <p className="text-xs font-bold tracking-widest uppercase text-white">Initializing Neural Engine</p>
                       <div className="flex items-center justify-center gap-1">
                          <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce"></span>
                       </div>
                    </div>
                  </div>
                ) : (
                  <TerminalView 
                    output={runnerState.output} 
                    onInput={handleTerminalInput}
                    isWaitingForInput={runnerState.isWaitingForInput}
                    language={activeLanguage}
                    isRunning={runnerState.isRunning}
                  />
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>

      {/* --- STATUS FOOTER --- */}
      <footer className="h-8 bg-[#08080a] border-t border-white/5 flex items-center justify-between px-6 shrink-0 text-[10px] font-mono text-zinc-500 select-none relative z-50">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 hover:text-white transition-colors cursor-help group">
               <Wifi className="w-3 h-3 text-green-500 group-hover:scale-110 transition-transform" />
               <span>CONNECTED TO MAINNET</span>
            </div>
            <div className="flex items-center gap-2 hover:text-white transition-colors cursor-help group">
               <Activity className="w-3 h-3 text-blue-500 group-hover:scale-110 transition-transform" />
               <span>LATENCY: 24ms</span>
            </div>
            <div className="flex items-center gap-2 hover:text-white transition-colors cursor-help hidden sm:flex group">
               <Cpu className="w-3 h-3 text-purple-500 group-hover:scale-110 transition-transform" />
               <span>WORKER: {isPython ? 'PYODIDE WASM' : isJavaScript ? 'V8 ISOLATE' : 'PISTON CONTAINER'}</span>
            </div>
         </div>
         <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2">
               <Command className="w-3 h-3" />
               <span>Ln 1, Col 1</span>
            </div>
            <span className="hidden sm:inline">UTF-8</span>
            <div className="flex items-center gap-2 text-zinc-300 bg-white/5 px-2 py-0.5 rounded border border-white/5">
               <img src={activeLangConfig?.logo} className="w-3 h-3 opacity-80" alt="" />
               {activeLangConfig?.name}
            </div>
         </div>
      </footer>

    </div>
  );
};

export default Compiler;
