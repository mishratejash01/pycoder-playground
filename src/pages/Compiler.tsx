import { useState, useEffect, useRef, useCallback } from 'react';
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
  Wifi, Activity, Cpu, Maximize2, Minimize2, Command, Sparkles,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from '@/hooks/use-mobile';

// --- PREMIUM CONFIGURATION WITH REAL LOGOS ---

const LANGUAGES_CONFIG = [
  { 
    id: 'python', 
    name: 'Python', 
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
    color: 'text-yellow-400',
    gradient: 'from-yellow-400/20 to-blue-500/20'
  },
  { 
    id: 'javascript', 
    name: 'JavaScript', 
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
    color: 'text-yellow-300',
    gradient: 'from-yellow-300/20 to-orange-500/20'
  },
  { 
    id: 'java', 
    name: 'Java', 
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
    color: 'text-red-400',
    gradient: 'from-red-400/20 to-orange-500/20'
  },
  { 
    id: 'cpp', 
    name: 'C++', 
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg',
    color: 'text-blue-500',
    gradient: 'from-blue-500/20 to-cyan-500/20'
  },
  { 
    id: 'c', 
    name: 'C', 
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg',
    color: 'text-blue-400',
    gradient: 'from-blue-400/20 to-indigo-500/20'
  },
  { 
    id: 'sql', 
    name: 'SQL', 
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg',
    color: 'text-purple-400',
    gradient: 'from-purple-400/20 to-pink-500/20'
  },
  { 
    id: 'bash', 
    name: 'Bash', 
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg',
    color: 'text-white',
    gradient: 'from-zinc-500/20 to-zinc-300/20'
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
  
  const executionStartRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // --- CODE RUNNERS ---
  const { 
    runCode: runPython, output: pythonOutput, isRunning: pythonRunning, 
    isReady: pythonReady, isWaitingForInput: pythonWaitingForInput, 
    writeInputToWorker: writePythonInput, stopExecution: stopPython, hasSharedArrayBuffer
  } = usePyodide();

  const {
    runCode: runJS, output: jsOutput, isRunning: jsRunning, 
    isWaitingForInput: jsWaitingForInput, writeInput: writeJSInput, stopExecution: stopJS,
  } = useJavaScriptRunner();

  const {
    runCode: runInteractive, output: interactiveOutput, isRunning: interactiveRunning, 
    isWaitingForInput: interactiveWaitingForInput, writeInput: writeInteractiveInput, stopExecution: stopInteractive,
  } = useInteractiveRunner(activeLanguage);

  const isPython = activeLanguage === 'python';
  const isJavaScript = activeLanguage === 'javascript';
  
  const getCurrentRunnerState = useCallback(() => {
    if (isPython) return { output: pythonOutput, isRunning: pythonRunning, isWaitingForInput: pythonWaitingForInput, isReady: pythonReady };
    else if (isJavaScript) return { output: jsOutput, isRunning: jsRunning, isWaitingForInput: jsWaitingForInput, isReady: true };
    else return { output: interactiveOutput, isRunning: interactiveRunning, isWaitingForInput: interactiveWaitingForInput, isReady: true };
  }, [isPython, isJavaScript, pythonOutput, pythonRunning, pythonWaitingForInput, pythonReady, jsOutput, jsRunning, jsWaitingForInput, interactiveOutput, interactiveRunning, interactiveWaitingForInput]);

  const runnerState = getCurrentRunnerState();
  const isLoading = runnerState.isRunning || (isPython && !pythonReady);
  const isExecuting = runnerState.isRunning;

  // --- EFFECTS ---
  useEffect(() => {
    if (isExecuting && executionStartRef.current === null) {
      executionStartRef.current = Date.now();
      timerIntervalRef.current = setInterval(() => {
        if (executionStartRef.current) setExecutionTime(Date.now() - executionStartRef.current);
      }, 50);
    } else if (!isExecuting && executionStartRef.current !== null) {
      if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
      executionStartRef.current = null;
    }
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [isExecuting]);

  useEffect(() => {
    supabase.from('languages').select('id, is_locked').then(({ data, error }) => {
      if (!error && data) {
        const statusMap: Record<string, boolean> = {};
        data.forEach((lang: any) => statusMap[lang.id] = lang.is_locked);
        setLockedLanguages(statusMap);
      }
    });
  }, []);

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
    toast({ title: "System Reset", description: "Codebase reverted.", className: "bg-[#0c0c0e] border border-white/10 text-white" });
  };

  const handleRun = async () => {
    if (isLoading) return;
    if (lockedLanguages[activeLanguage]) { toast({ title: "Access Denied", description: "Language locked.", variant: "destructive" }); return; }
    setExecutionTime(null);
    executionStartRef.current = Date.now();
    if (isPython) runPython(code);
    else if (isJavaScript) runJS(code);
    else runInteractive(code);
  };

  const handleStop = () => {
    if (isPython) stopPython(); else if (isJavaScript) stopJS(); else stopInteractive();
    toast({ title: "Sequence Aborted", description: "Execution terminated.", variant: "destructive" });
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
      toast({ title: "Archive Saved", description: `${filename} downloaded.` });
    } catch { toast({ title: "Error", description: "Download failed.", variant: "destructive" }); }
  };

  const handleTerminalInput = useCallback((char: string) => {
    if (isPython) writePythonInput(char);
    else if (isJavaScript) writeJSInput(char);
    else writeInteractiveInput(char);
  }, [isPython, isJavaScript, writePythonInput, writeJSInput, writeInteractiveInput]);

  const handleClearTerminal = () => {
    if (!isExecuting) {
      if (isPython) runPython(''); else if (isJavaScript) runJS(''); else runInteractive('');
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        setIsFullScreen(true);
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        setIsFullScreen(false);
    }
  };

  const activeLangConfig = LANGUAGES_CONFIG.find(l => l.id === activeLanguage);

  return (
    <div className="h-screen flex flex-col bg-[#050505] text-white overflow-hidden font-sans selection:bg-primary/30 relative">
      
      {/* --- AMBIENT BACKGROUND FX --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className={cn("absolute top-[-20%] left-[10%] w-[60vw] h-[60vw] rounded-full blur-[150px] opacity-20 animate-pulse transition-colors duration-1000", activeLangConfig?.color.replace('text-', 'bg-'))} />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      </div>

      {/* --- HEADER --- */}
      <header className="relative z-50 h-16 shrink-0 border-b border-white/5 bg-[#050505]/90 backdrop-blur-2xl flex items-center justify-between px-6">
        
        {/* Left: Premium Branding */}
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="w-10 h-10 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:text-white text-zinc-400 transition-all group">
            <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </Button>
          
          <div className="hidden md:flex flex-col">
             <div className="flex items-center gap-2 select-none group cursor-pointer">
                <span className="text-lg font-black tracking-tight text-white group-hover:text-zinc-200 transition-colors">CODEVO</span>
                <span className="px-1.5 py-0.5 rounded-md bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-[10px] font-bold text-yellow-500 tracking-wider shadow-[0_0_10px_-3px_rgba(234,179,8,0.3)]">
                  PRO
                </span>
             </div>
             <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                <span>v3.0.4 <span className="text-zinc-700 mx-1">|</span> STABLE</span>
             </div>
          </div>
        </div>

        {/* Center: Language Capsule */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center">
           <div className="flex items-center gap-1 p-1 rounded-full bg-[#0a0a0c] border border-white/10 shadow-xl backdrop-blur-3xl relative group/capsule">
              <div className="absolute inset-0 rounded-full bg-white/5 blur-xl opacity-0 group-hover/capsule:opacity-20 transition-opacity duration-500" />
              
              <Select value={activeLanguage} onValueChange={handleLanguageChange}>
                <SelectTrigger className="h-9 border-none bg-transparent text-sm font-medium text-white focus:ring-0 hover:bg-white/5 rounded-full pl-3 pr-2 min-w-[160px] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 shrink-0">
                      <img src={activeLangConfig?.logo} alt={activeLangConfig?.name} className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                    </div>
                    <span className="truncate text-zinc-200">{activeLangConfig?.name}</span>
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-[#0c0c0e]/95 backdrop-blur-2xl border-white/10 text-white rounded-xl shadow-2xl min-w-[220px] p-2">
                  <div className="px-2 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Select Environment</div>
                  {LANGUAGES_CONFIG.map((lang) => (
                    <SelectItem 
                      key={lang.id} 
                      value={lang.id} 
                      disabled={lockedLanguages[lang.id]}
                      className="text-xs font-medium focus:bg-white/10 cursor-pointer rounded-lg py-2 my-0.5 transition-all group/item data-[state=checked]:bg-white/10"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <img src={lang.logo} alt={lang.name} className="w-5 h-5 object-contain opacity-70 group-hover/item:opacity-100 transition-opacity grayscale group-hover/item:grayscale-0" />
                        <span className={cn("transition-colors group-hover/item:text-white text-zinc-400", activeLanguage === lang.id && "text-white")}>{lang.name}</span>
                        {lockedLanguages[lang.id] && <Lock className="w-3 h-3 text-red-500 ml-auto" />}
                        {activeLanguage === lang.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_5px_white]" />}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="w-px h-4 bg-white/10 mx-1" />

              <div className="flex items-center gap-2 px-3 text-zinc-400">
                 <Clock className={cn("w-3.5 h-3.5", isExecuting && "text-primary animate-pulse")} />
                 <span className={cn("font-mono text-xs tabular-nums transition-colors", isExecuting && "text-white")}>
                   {isExecuting ? formatTime(executionTime || 0) : executionTime !== null ? formatTime(executionTime) : '0.00s'}
                 </span>
              </div>
           </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#0a0a0c] rounded-lg p-1 border border-white/5">
             <Button onClick={handleReset} variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white rounded-md hover:bg-white/10 transition-colors" title="Reset Code">
                <RotateCcw className="w-3.5 h-3.5" />
             </Button>
             <Button onClick={handleDownload} variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white rounded-md hover:bg-white/10 transition-colors" title="Download Source">
                <Download className="w-3.5 h-3.5" />
             </Button>
             <Button onClick={toggleFullScreen} variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white rounded-md hover:bg-white/10 hidden sm:flex transition-colors" title="Toggle Fullscreen">
                {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
             </Button>
          </div>

          <div className="w-px h-8 bg-white/10 hidden sm:block" />

          {isExecuting ? (
            <Button 
              onClick={handleStop}
              className="h-9 px-5 bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20 font-bold text-[10px] tracking-widest uppercase shadow-[0_0_20px_-5px_rgba(239,68,68,0.5)] animate-pulse"
            >
              <Square className="w-3.5 h-3.5 mr-2 fill-current" /> Stop
            </Button>
          ) : (
            <Button 
              onClick={handleRun} 
              disabled={isLoading || lockedLanguages[activeLanguage]} 
              className={cn(
                "group relative h-9 px-6 font-bold text-[10px] tracking-widest uppercase overflow-hidden transition-all rounded-md",
                isLoading ? "bg-zinc-800 text-zinc-500" : "bg-white text-black hover:shadow-[0_0_25px_-5px_rgba(255,255,255,0.5)] hover:scale-105 active:scale-95"
              )}
            >
              <div className="relative z-10 flex items-center gap-2">
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                {isLoading ? "INIT..." : "RUN CODE"}
              </div>
            </Button>
          )}
        </div>
      </header>

      {/* --- WORKSPACE --- */}
      <div className="flex-1 overflow-hidden relative z-10 p-3 md:p-6">
        <div className="h-full w-full rounded-2xl border border-white/10 bg-[#0a0a0c]/40 backdrop-blur-xl overflow-hidden shadow-2xl flex flex-col relative group/workspace">
          
          {/* Subtle Border Glow */}
          <div className="absolute inset-0 rounded-2xl border border-white/5 pointer-events-none z-20 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]" />

          <ResizablePanelGroup direction="vertical" className="h-full relative z-10">
            
            {/* EDITOR PANEL */}
            <ResizablePanel defaultSize={isMobile ? 60 : 70} minSize={30} className="bg-[#09090b]/60 relative flex flex-col">
              {/* File Tab */}
              <div className="flex items-center justify-between h-9 px-4 border-b border-white/5 bg-[#0c0c0e]/50">
                 <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 bg-white/5 px-3 py-1 rounded-t-sm border-t border-x border-white/5 translate-y-[5px] relative z-10">
                    <img src={activeLangConfig?.logo} className="w-3 h-3 opacity-70" alt="lang" />
                    {getFileName(activeLanguage)}
                 </div>
                 <div className="text-[10px] text-zinc-600 font-mono flex items-center gap-2">
                    <Settings className="w-3 h-3 hover:text-white cursor-pointer transition-colors" />
                 </div>
              </div>

              <div className="flex-1 relative">
                 <CodeEditor 
                   value={code} 
                   onChange={setCode} 
                   language={activeLanguage}
                 />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-[#050505] border-t border-b border-white/5 h-2 hover:bg-primary/50 transition-colors group-hover/handle:shadow-[0_0_10px_rgba(59,130,246,0.5)]" />

            {/* TERMINAL PANEL */}
            <ResizablePanel defaultSize={isMobile ? 40 : 30} minSize={15} className="bg-[#08080a] flex flex-col min-h-[100px] relative">
              
              {/* Terminal Header */}
              <div className="flex items-center justify-between px-4 h-10 border-b border-white/5 bg-[#0a0a0c] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    <TerminalIcon className="w-3.5 h-3.5 text-blue-400" /> 
                    Terminal
                  </div>
                  {isPython && !hasSharedArrayBuffer && (
                    <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      <div className="w-1 h-1 rounded-full bg-amber-500" />
                      <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wide">Limited</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {isExecuting && (
                    <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-green-500/5 border border-green-500/10">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[9px] font-bold text-green-400 tracking-wider uppercase">
                        {runnerState.isWaitingForInput ? 'Wait Input' : 'Running'}
                      </span>
                    </div>
                  )}
                  
                  <button 
                    onClick={handleClearTerminal}
                    disabled={isExecuting}
                    className="p-1.5 rounded hover:bg-white/5 text-zinc-600 hover:text-white transition-colors disabled:opacity-30"
                    title="Clear Console"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              {/* Terminal Body */}
              <div className="flex-1 relative bg-[#050505] overflow-hidden">
                <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 z-0" />
                {isPython && !pythonReady ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 gap-4 z-10">
                    <div className="relative flex items-center justify-center">
                       <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse" />
                       <Loader2 className="w-8 h-8 animate-spin text-blue-500 relative z-10" />
                    </div>
                    <p className="text-[10px] font-mono tracking-wider uppercase text-zinc-400">Loading Kernel</p>
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

      {/* --- FOOTER STATUS --- */}
      <footer className="h-7 bg-[#08080a] border-t border-white/5 flex items-center justify-between px-6 shrink-0 text-[10px] font-mono text-zinc-600 select-none">
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors cursor-help">
               <Wifi className="w-3 h-3 text-emerald-500" />
               <span className="hidden sm:inline">ONLINE</span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors cursor-help">
               <Activity className="w-3 h-3 text-blue-500" />
               <span>24ms</span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors cursor-help hidden sm:flex">
               <Cpu className="w-3 h-3 text-purple-500" />
               <span>{isPython ? 'PYODIDE' : isJavaScript ? 'V8' : 'PISTON'}</span>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 hover:text-zinc-300 transition-colors">
               <Command className="w-3 h-3" />
               <span>READY</span>
            </div>
            <span className="hidden sm:inline">UTF-8</span>
            <div className="flex items-center gap-1.5 text-zinc-400">
               <img src={activeLangConfig?.logo} className="w-3 h-3 opacity-60 grayscale" alt="" />
               {activeLangConfig?.name}
            </div>
         </div>
      </footer>

    </div>
  );
};

export default Compiler;
