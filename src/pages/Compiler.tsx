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
  Loader2, 
  Rocket, 
  Ban, 
  Layout, 
  Terminal as TerminalIcon, 
  FileDown, 
  Lock, 
  ListRestart, 
  Timer, 
  SlidersHorizontal, 
  Wifi, 
  Activity, 
  Cpu, 
  Scan, 
  Minimize, 
  Command, 
  Sparkles,
  ChevronRight, 
  Infinity, 
  Code2, 
  Globe, 
  Server,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from '@/hooks/use-mobile';

// --- GOD TIER CONFIGURATION ---
// "Event Horizon" Color Palette: Deep Space Black, Electric Cyan, Hyper-Violet

const LANGUAGES_CONFIG = [
  { 
    id: 'python', 
    name: 'Python', 
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
    glow: 'shadow-[0_0_30px_-5px_rgba(59,130,246,0.5)]', // Electric Blue
    border: 'group-hover/item:border-blue-500/50'
  },
  { 
    id: 'javascript', 
    name: 'JavaScript', 
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
    glow: 'shadow-[0_0_30px_-5px_rgba(250,204,21,0.4)]', // Solar Gold
    border: 'group-hover/item:border-yellow-500/50'
  },
  { 
    id: 'java', 
    name: 'Java', 
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
    glow: 'shadow-[0_0_30px_-5px_rgba(239,68,68,0.5)]', // Crimson Red
    border: 'group-hover/item:border-red-500/50'
  },
  { 
    id: 'cpp', 
    name: 'C++', 
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg',
    glow: 'shadow-[0_0_30px_-5px_rgba(56,189,248,0.5)]', // Sky Blue
    border: 'group-hover/item:border-cyan-500/50'
  },
  { 
    id: 'c', 
    name: 'C', 
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg',
    glow: 'shadow-[0_0_30px_-5px_rgba(99,102,241,0.5)]', // Indigo
    border: 'group-hover/item:border-indigo-500/50'
  },
  { 
    id: 'sql', 
    name: 'SQL', 
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg',
    glow: 'shadow-[0_0_30px_-5px_rgba(168,85,247,0.5)]', // Deep Purple
    border: 'group-hover/item:border-purple-500/50'
  },
  { 
    id: 'bash', 
    name: 'Bash', 
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg',
    glow: 'shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)]', // Starlight White
    border: 'group-hover/item:border-white/50'
  },
] as const;

// --- FULLY EXPANDED STARTER TEMPLATES ---

const getStarterTemplate = (lang: Language) => {
  switch(lang) {
    case 'java': 
      return `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        
        // --- JAVA RUNTIME INITIALIZED ---
        System.out.println(">> SYSTEM ONLINE.");
        System.out.print(">> Enter Command: ");
        
        if (sc.hasNextLine()) {
            String input = sc.nextLine();
            System.out.println(">> Processing: " + input);
            System.out.println(">> Status: EXECUTION COMPLETE");
        } else {
            System.out.println(">> No input detected.");
        }
        
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
    
    cout << ">> KERNEL ACTIVE." << endl;
    cout << ">> Awaiting Input Parameters: ";
    
    // Check if input is available
    if (getline(cin, input_data)) {
        cout << ">> Received Data: " << input_data << endl;
        cout << ">> Operations successful." << endl;
    } else {
        cout << ">> Input stream empty." << endl;
    }
    
    return 0;
}`;
    case 'c': 
      return `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    char buffer[100];
    
    printf(">> C ENVIRONMENT LOADED.\\n");
    printf(">> Enter execution token: ");
    
    if (fgets(buffer, 100, stdin) != NULL) {
        // Remove trailing newline
        buffer[strcspn(buffer, "\\n")] = 0; 
        printf(">> Token Accepted: %s\\n", buffer);
    } else {
        printf(">> No token provided.\\n");
    }
    
    printf(">> Memory released.\\n");
    return 0;
}`;
    case 'javascript': 
      return `// --- JAVASCRIPT V8 ENGINE ---

console.log(">> NODE.JS ENVIRONMENT READY");

async function main() {
    try {
        // Interactive input wrapper
        const userInput = await prompt(">> Identify User: ");
        
        console.log(\`>> Authenticating \${userInput}...\`);
        console.log(">> Access Level: ADMIN");
        
        const systemStatus = {
            memory: "OK",
            cpu: "OPTIMIZED",
            network: "SECURE"
        };
        
        console.table(systemStatus);
        
    } catch (error) {
        console.error(">> ERR:", error);
    }
}

main();`;
    case 'sql': 
      return `-- --- SQL DATA MATRIX ---

-- 1. Create a virtual schema
CREATE TABLE systems (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'OFFLINE',
    load_percentage INTEGER
);

-- 2. Inject dummy data
INSERT INTO systems (name, status, load_percentage) VALUES 
    ('CORE_REACTOR', 'ONLINE', 85),
    ('NAV_COMPUTER', 'ONLINE', 12),
    ('LIFE_SUPPORT', 'CRITICAL', 98);

-- 3. Execute Query
SELECT * FROM systems 
WHERE status = 'ONLINE'
ORDER BY load_percentage DESC;`;
    case 'bash': 
      return `#!/bin/bash

echo ">> BASH SHELL INITIALIZED"
echo ">> HOST: $HOSTNAME"
echo ">> USER: $USER"

read -p ">> Enter target directive: " directive

if [ -z "$directive" ]; then
    echo ">> No directive received. Standing by."
else
    echo ">> Executing directive: $directive"
    echo ">> [====================] 100%"
    echo ">> Done."
fi`;
    default: 
      return `# --- PYTHON 3 NEURAL INTERFACE ---
import time
import sys

def system_check():
    print(">> INITIALIZING SINGULARITY KERNEL...")
    for i in range(3):
        print(f">> LOADING MODULE {i+1}...")
        time.sleep(0.2)
    print(">> SYSTEM READY.")

system_check()

# Interactive Input
try:
    user_input = input(">> Enter Python Expression to Evaluate: ")
    if user_input:
        result = eval(user_input)
        print(f">> Result: {result}")
    else:
        print(">> No expression entered.")
except Exception as e:
    print(f">> RUNTIME ERROR: {e}")

print(">> Session Terminated.")`;
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
  
  // --- STATE MANAGEMENT ---
  
  const [activeLanguage, setActiveLanguage] = useState<Language>(() => {
    return (localStorage.getItem('codevo-lang') as Language) || 'python';
  });
  
  const [code, setCode] = useState<string>(() => {
    return localStorage.getItem('codevo-code') || getStarterTemplate('python');
  });

  const [lockedLanguages, setLockedLanguages] = useState<Record<string, boolean>>({});
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Refs for precise timing
  const executionStartRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // --- CODE RUNNERS (CUSTOM HOOKS) ---
  
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
  
  // Unified Runner State Calculation
  const getCurrentRunnerState = useCallback(() => {
    if (isPython) {
      return { 
        output: pythonOutput, 
        isRunning: pythonRunning, 
        isWaitingForInput: pythonWaitingForInput, 
        isReady: pythonReady 
      };
    } else if (isJavaScript) {
      return { 
        output: jsOutput, 
        isRunning: jsRunning, 
        isWaitingForInput: jsWaitingForInput, 
        isReady: true 
      };
    } else {
      return { 
        output: interactiveOutput, 
        isRunning: interactiveRunning, 
        isWaitingForInput: interactiveWaitingForInput, 
        isReady: true 
      };
    }
  }, [
    isPython, 
    isJavaScript, 
    pythonOutput, 
    pythonRunning, 
    pythonWaitingForInput, 
    pythonReady, 
    jsOutput, 
    jsRunning, 
    jsWaitingForInput, 
    interactiveOutput, 
    interactiveRunning, 
    interactiveWaitingForInput
  ]);

  const runnerState = getCurrentRunnerState();
  const isLoading = runnerState.isRunning || (isPython && !pythonReady);
  const isExecuting = runnerState.isRunning;

  // --- EFFECTS ---

  // 1. Timer Logic for Execution
  useEffect(() => {
    if (isExecuting && executionStartRef.current === null) {
      executionStartRef.current = Date.now();
      timerIntervalRef.current = setInterval(() => {
        if (executionStartRef.current) {
          setExecutionTime(Date.now() - executionStartRef.current);
        }
      }, 50); // High precision update (50ms)
    } else if (!isExecuting && executionStartRef.current !== null) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      executionStartRef.current = null;
    }
    
    // Cleanup on unmount
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isExecuting]);

  // 2. Fetch Locked Languages from Supabase
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

  // 3. Persist Code and Language Choice to LocalStorage
  useEffect(() => {
    localStorage.setItem('codevo-code', code);
    localStorage.setItem('codevo-lang', activeLanguage);
  }, [code, activeLanguage]);

  // --- EVENT HANDLERS ---

  const handleLanguageChange = (val: string) => {
    const newLang = val as Language;
    
    if (lockedLanguages[newLang]) {
        toast({ 
          title: "Module Locked", 
          description: "This language protocol is currently restricted.", 
          variant: "destructive" 
        });
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
      description: "Codebase restored to default factory settings.",
      className: "bg-black border border-white/20 text-white" 
    });
  };

  const handleRun = async () => {
    if (isLoading) return;
    
    if (lockedLanguages[activeLanguage]) {
        toast({ 
          title: "Access Denied", 
          description: "Language module locked.", 
          variant: "destructive" 
        });
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
    toast({ 
      title: "Sequence Aborted", 
      description: "Execution terminated manually by user.", 
      variant: "destructive" 
    });
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
      
      toast({ 
        title: "Source Extracted", 
        description: `${filename} saved to local drive.`, 
        className: "bg-black border border-white/20 text-white" 
      });
    } catch (err) {
      toast({ 
        title: "Error", 
        description: "Failed to generate source archive.", 
        variant: "destructive" 
      });
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
        runPython(''); 
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
    <div className="h-screen flex flex-col bg-[#000000] text-white overflow-hidden font-sans selection:bg-cyan-500/30 relative">
      
      {/* --- EVENT HORIZON BACKGROUND --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
         {/* The Void */}
         <div className="absolute inset-0 bg-black" />
         
         {/* Nebula Blooms - Cold Colors Only (No Cheap Yellow) */}
         <div className="absolute top-[-30%] left-[-10%] w-[80vw] h-[80vw] bg-indigo-900/10 rounded-full blur-[150px] animate-pulse duration-[8000ms]" />
         <div className="absolute bottom-[-30%] right-[-10%] w-[70vw] h-[70vw] bg-cyan-900/10 rounded-full blur-[150px] animate-pulse duration-[10000ms]" />
         
         {/* Starlight Noise */}
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.06] mix-blend-overlay" />
         
         {/* Grid Matrix */}
         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_60%,transparent_100%)] pointer-events-none" />
      </div>

      {/* --- HEADER: OBSIDIAN CRYSTAL --- */}
      <header className="relative z-50 h-16 shrink-0 border-b border-white/[0.08] bg-[#000000]/60 backdrop-blur-2xl flex items-center justify-between px-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,1)]">
        
        {/* BRANDING */}
        <div className="flex items-center gap-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="w-10 h-10 rounded-full border border-white/5 bg-white/[0.02] hover:bg-white/10 hover:border-white/20 text-zinc-400 hover:text-white transition-all duration-500 group">
            <Layout className="w-4 h-4 stroke-[1.5] group-hover:scale-110 transition-transform" />
          </Button>
          
          <div className="hidden md:flex flex-col justify-center gap-0.5 group cursor-pointer">
             <div className="flex items-center gap-3">
                <span className="text-2xl font-black tracking-tighter text-white font-neuropol drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                  CODEVO
                </span>
                <div className="h-5 w-[1px] bg-white/20 rotate-12" />
                <span className="text-[10px] font-bold tracking-[0.4em] text-cyan-400 uppercase drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
                  PRO
                </span>
             </div>
          </div>
        </div>

        {/* CENTER: COMMAND DECK */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center">
           <div className="flex items-center gap-2 p-1.5 rounded-full bg-[#050505]/80 border border-white/10 shadow-[0_0_30px_-10px_rgba(255,255,255,0.05)] backdrop-blur-md relative overflow-hidden group/deck">
              
              {/* Language Selector */}
              <Select value={activeLanguage} onValueChange={(v) => {
                  if (lockedLanguages[v]) { toast({ title: "Module Locked", variant: "destructive" }); return; }
                  setActiveLanguage(v as Language);
                  setCode(getStarterTemplate(v as Language));
                  setExecutionTime(null);
              }}>
                <SelectTrigger className="h-10 border-none bg-transparent text-sm font-bold text-white focus:ring-0 hover:bg-white/5 rounded-full pl-4 pr-3 min-w-[180px] transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 relative grayscale group-hover/deck:grayscale-0 transition-all duration-500">
                      <img src={activeLangConfig?.logo} alt={activeLangConfig?.name} className="w-full h-full object-contain" />
                    </div>
                    <span className="tracking-wide text-zinc-300 group-hover/deck:text-white transition-colors">{activeLangConfig?.name}</span>
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-[#050505] border-white/10 text-white rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,1)] min-w-[240px] p-2 backdrop-blur-3xl">
                  {LANGUAGES_CONFIG.map((lang) => (
                    <SelectItem 
                      key={lang.id} 
                      value={lang.id} 
                      disabled={lockedLanguages[lang.id]}
                      className={cn(
                        "text-xs font-medium focus:bg-white/10 cursor-pointer rounded-xl py-3 px-4 my-1 transition-all group/item data-[state=checked]:bg-white/5 border border-transparent",
                        lang.border
                      )}
                    >
                      <div className="flex items-center gap-4 w-full">
                        <img src={lang.logo} alt={lang.name} className="w-5 h-5 object-contain opacity-50 group-hover/item:opacity-100 transition-opacity grayscale group-hover/item:grayscale-0" />
                        <span className={cn("transition-colors text-zinc-500 group-hover/item:text-white uppercase tracking-wider font-bold")}>{lang.name}</span>
                        {activeLanguage === lang.id && (
                          <div className={cn("ml-auto w-1.5 h-1.5 rounded-full bg-white", lang.glow)} />
                        )}
                        {lockedLanguages[lang.id] && <Lock className="w-3 h-3 text-red-900 ml-auto" />}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="w-px h-5 bg-white/10" />

              {/* Timer Widget */}
              <div className="flex items-center gap-3 px-5 text-zinc-500">
                 <Timer className={cn("w-4 h-4 transition-colors stroke-[1.5]", isExecuting && "text-cyan-400 animate-spin-slow")} />
                 <span className={cn("font-mono text-xs tabular-nums tracking-widest transition-colors", isExecuting && "text-white text-shadow-glow")}>
                   {isExecuting ? formatTime(executionTime || 0) : executionTime !== null ? formatTime(executionTime) : '00.00s'}
                 </span>
              </div>
           </div>
        </div>

        {/* RIGHT: ACTION ARMORY */}
        <div className="flex items-center gap-4">
          {/* Tool Belt */}
          <div className="flex items-center bg-[#050505]/50 rounded-full p-1 border border-white/5 backdrop-blur-md">
             <Button onClick={() => { setCode(getStarterTemplate(activeLanguage)); setExecutionTime(null); toast({title:"Reset Complete", className:"bg-black text-white border-white/10"}); }} variant="ghost" size="icon" className="h-9 w-9 text-zinc-600 hover:text-white rounded-full hover:bg-white/10 transition-colors" title="Reset Codebase">
                <ListRestart className="w-4 h-4 stroke-[1.5]" />
             </Button>
             <Button onClick={handleDownload} variant="ghost" size="icon" className="h-9 w-9 text-zinc-600 hover:text-white rounded-full hover:bg-white/10 transition-colors" title="Export File">
                <FileDown className="w-4 h-4 stroke-[1.5]" />
             </Button>
             <Button onClick={toggleFullScreen} variant="ghost" size="icon" className="h-9 w-9 text-zinc-600 hover:text-white rounded-full hover:bg-white/10 hidden sm:flex transition-colors" title="Maximize Workspace">
                {isFullScreen ? <Minimize className="w-4 h-4 stroke-[1.5]" /> : <Scan className="w-4 h-4 stroke-[1.5]" />}
             </Button>
          </div>

          <div className="w-px h-8 bg-white/10 hidden sm:block" />

          {/* Ignition Switch */}
          {isExecuting ? (
            <Button 
              onClick={handleStop}
              className="h-10 px-6 bg-red-900/20 text-red-500 border border-red-500/30 hover:bg-red-900/40 font-bold text-[10px] tracking-[0.2em] uppercase shadow-[0_0_30px_-5px_rgba(239,68,68,0.4)] animate-pulse rounded-full transition-all"
            >
              <Ban className="w-4 h-4 mr-3 fill-current stroke-none" /> Abort
            </Button>
          ) : (
            <Button 
              onClick={handleRun} 
              disabled={isLoading || lockedLanguages[activeLanguage]} 
              className={cn(
                "group relative h-10 px-8 font-bold text-[10px] tracking-[0.25em] uppercase overflow-hidden transition-all rounded-full bg-transparent border border-white/20 text-white hover:border-cyan-500/50 hover:text-cyan-50 hover:shadow-[0_0_40px_-10px_rgba(34,211,238,0.5)] active:scale-95",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/0 via-cyan-500/20 to-cyan-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <div className="relative z-10 flex items-center gap-3">
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5 fill-current stroke-none" />}
                {isLoading ? "INIT..." : "IGNITE"}
              </div>
            </Button>
          )}
        </div>
      </header>

      {/* --- WORKSPACE: THE VOID --- */}
      <div className="flex-1 overflow-hidden relative z-10 p-3 md:p-6">
        <div className="h-full w-full rounded-[2rem] border border-white/[0.08] bg-[#030303]/80 backdrop-blur-xl overflow-hidden shadow-2xl flex flex-col relative group/frame transition-all duration-1000">
          
          {/* Alive Borders - Interaction Effect */}
          <div className="absolute inset-0 rounded-[2rem] border border-transparent group-hover/frame:border-white/10 transition-colors duration-1000 pointer-events-none z-50" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover/frame:opacity-100 transition-opacity duration-1000" />

          <ResizablePanelGroup direction="vertical" className="h-full relative z-10">
            
            {/* EDITOR PANEL */}
            <ResizablePanel defaultSize={isMobile ? 60 : 70} minSize={30} className="bg-[#050505]/50 relative flex flex-col">
              {/* File Tab */}
              <div className="flex items-center justify-between h-10 px-6 border-b border-white/[0.06] bg-black/40">
                 <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    <div className={cn("w-1.5 h-1.5 rounded-full transition-all duration-500", isExecuting ? "bg-cyan-500 shadow-[0_0_15px_cyan]" : "bg-zinc-700")} />
                    SOURCE // {getFileName(activeLanguage)}
                 </div>
                 <div className="text-[10px] text-zinc-700 font-mono hover:text-zinc-400 transition-colors cursor-pointer flex items-center gap-2">
                    <SlidersHorizontal className="w-3 h-3 stroke-[1.5]" /> CONFIG
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

            <ResizableHandle withHandle className="bg-[#020202] border-t border-b border-white/[0.06] h-2 hover:bg-cyan-900/30 transition-colors group-hover/handle:border-cyan-500/30" />

            {/* TERMINAL PANEL */}
            <ResizablePanel defaultSize={isMobile ? 40 : 30} minSize={15} className="bg-[#030303] flex flex-col min-h-[100px] relative">
              
              {/* Terminal Header */}
              <div className="flex items-center justify-between px-6 h-12 border-b border-white/[0.06] bg-black/40 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest group-hover/frame:text-zinc-300 transition-colors">
                    <TerminalIcon className="w-4 h-4 text-zinc-600 group-hover/frame:text-white transition-colors" /> 
                    Output Stream
                  </div>
                  {isPython && !hasSharedArrayBuffer && (
                    <span className="text-[9px] font-mono text-zinc-700 px-2 py-1 rounded bg-white/[0.02] border border-white/[0.05]">
                      LIMITED MODE
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {isExecuting && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/30 border border-cyan-500/20">
                      <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                      <span className="text-[9px] font-bold text-cyan-400 tracking-wider uppercase">Active</span>
                    </div>
                  )}
                  
                  <button 
                    onClick={handleClearTerminal}
                    disabled={isExecuting}
                    className="p-2 rounded-full hover:bg-white/10 text-zinc-600 hover:text-white transition-all disabled:opacity-30 hover:rotate-180"
                    title="Purge Logs"
                  >
                    <RefreshCw className="w-3.5 h-3.5 stroke-[1.5]" />
                  </button>
                </div>
              </div>
              
              {/* Terminal Body */}
              <div className="flex-1 relative bg-[#020202] overflow-hidden">
                <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] z-0" />
                
                {isPython && !pythonReady ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 gap-6 z-10">
                    <div className="relative">
                       <div className="absolute inset-0 bg-cyan-500 blur-[40px] opacity-10 animate-pulse" />
                       <Loader2 className="w-8 h-8 animate-spin text-cyan-800" />
                    </div>
                    <p className="text-[10px] font-mono tracking-[0.2em] uppercase text-zinc-700">Initializing Kernel...</p>
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

      {/* --- TELEMETRY FOOTER --- */}
      <footer className="h-9 bg-[#020202] border-t border-white/[0.06] flex items-center justify-between px-8 shrink-0 text-[10px] font-mono text-zinc-600 select-none relative z-50">
         <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 group cursor-help">
               <div className="w-1 h-1 rounded-full bg-emerald-500 group-hover:shadow-[0_0_5px_rgba(16,185,129,0.8)] transition-all" />
               <span className="group-hover:text-zinc-400 transition-colors">MAINNET: CONNECTED</span>
            </div>
            <div className="flex items-center gap-2 group cursor-help">
               <Activity className="w-3 h-3 group-hover:text-cyan-500 transition-colors stroke-[1.5]" />
               <span className="group-hover:text-zinc-400 transition-colors">PING: 24ms</span>
            </div>
            <div className="flex items-center gap-2 group cursor-help hidden sm:flex">
               <Cpu className="w-3 h-3 group-hover:text-purple-500 transition-colors stroke-[1.5]" />
               <span className="group-hover:text-zinc-400 transition-colors">CORE: {isPython ? 'WASM-PY' : isJavaScript ? 'V8-ISO' : 'PISTON-LX'}</span>
            </div>
         </div>
         <div className="flex items-center gap-6">
            <span className="hidden sm:inline hover:text-white transition-colors cursor-pointer">Ln 1, Col 1</span>
            <div className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors cursor-pointer">
               <div className="w-3 h-3 opacity-50 grayscale hover:grayscale-0 transition-all">
                  <img src={activeLangConfig?.logo} alt="" className="w-full h-full object-contain" />
               </div>
               {activeLangConfig?.name} v.Latest
            </div>
         </div>
      </footer>

    </div>
  );
};

export default Compiler;
