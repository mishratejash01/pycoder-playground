import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CodeEditor } from '@/components/CodeEditor';
import { useCodeRunner, Language } from '@/hooks/useCodeRunner';
import { usePyodide } from '@/hooks/usePyodide';
import { TerminalView, TerminalMode } from '@/components/TerminalView';
import { Loader2, Play, RefreshCw, Code2, Home, Terminal as TerminalIcon, Download, Lock, Square, Clock, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from '@/hooks/use-mobile';

const LANGUAGES_CONFIG = [
  { id: 'python', name: 'Python' },
  { id: 'java', name: 'Java' },
  { id: 'cpp', name: 'C++' },
  { id: 'c', name: 'C' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'sql', name: 'SQL' },
  { id: 'bash', name: 'Bash' },
] as const;

// Comprehensive starter templates showing how to handle input/output
const getStarterTemplate = (lang: Language) => {
  switch(lang) {
    case 'java': 
      return `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        
        // Example: Read a string and an integer
        System.out.print("Enter your name: ");
        String name = sc.nextLine();
        
        System.out.print("Enter your age: ");
        int age = sc.nextInt();
        
        // Output the result
        System.out.println("Hello, " + name + "! You are " + age + " years old.");
        
        sc.close();
    }
}`;
    case 'cpp': 
      return `#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
#include <cmath>
using namespace std;

int main() {
    // Example: Read a string and an integer
    string name;
    int age;
    
    cout << "Enter your name: ";
    getline(cin, name);
    
    cout << "Enter your age: ";
    cin >> age;
    
    // Output the result
    cout << "Hello, " << name << "! You are " << age << " years old." << endl;
    
    return 0;
}`;
    case 'c': 
      return `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

int main() {
    // Example: Read a string and an integer
    char name[100];
    int age;
    
    printf("Enter your name: ");
    fgets(name, sizeof(name), stdin);
    name[strcspn(name, "\\n")] = 0; // Remove newline
    
    printf("Enter your age: ");
    scanf("%d", &age);
    
    // Output the result
    printf("Hello, %s! You are %d years old.\\n", name, age);
    
    return 0;
}`;
    case 'javascript': 
      return `// Node.js - Reading from stdin
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

const lines = [];

rl.on('line', (line) => {
    lines.push(line);
});

rl.on('close', () => {
    // Your inputs are now in the lines[] array
    // Example: First line is name, second is age
    const name = lines[0] || 'World';
    const age = lines[1] || '0';
    
    console.log(\`Hello, \${name}! You are \${age} years old.\`);
});`;
    case 'sql': 
      return `-- SQLite Query Editor
-- Create a sample table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER,
    email TEXT
);

-- Insert some sample data
INSERT INTO users (name, age, email) VALUES 
    ('Alice', 25, 'alice@example.com'),
    ('Bob', 30, 'bob@example.com'),
    ('Charlie', 22, 'charlie@example.com');

-- Query the data
SELECT * FROM users WHERE age >= 25;

-- Aggregate functions
SELECT AVG(age) as average_age FROM users;`;
    case 'bash': 
      return `#!/bin/bash

# Example: Read input and process
echo "Enter your name:"
read name

echo "Enter your age:"
read age

# Output
echo "Hello, $name! You are $age years old."

# Example: Loop and conditions
for i in {1..3}; do
    echo "Count: $i"
done`;
    default: 
      return `# Python 3 - Interactive Terminal
# Type your input directly below when prompted!

name = input("Enter your name: ")
age = int(input("Enter your age: "))

print(f"Hello, {name}! You are {age} years old.")

# Example: Common operations
numbers = [1, 2, 3, 4, 5]
print(f"Sum: {sum(numbers)}")
print(f"Max: {max(numbers)}")`;
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

// Format execution time
const formatTime = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  const seconds = (ms / 1000).toFixed(1);
  return `${seconds}s`;
};

const Compiler = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [activeLanguage, setActiveLanguage] = useState<Language>(() => {
    return (localStorage.getItem('codevo-lang') as Language) || 'python';
  });
  
  const [code, setCode] = useState<string>(() => {
    return localStorage.getItem('codevo-code') || getStarterTemplate('python');
  });

  const [lockedLanguages, setLockedLanguages] = useState<Record<string, boolean>>({});
  const [collectedInputLines, setCollectedInputLines] = useState<string[]>([]);
  const [terminalOutput, setTerminalOutput] = useState<string>('');
  const [isError, setIsError] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [isPistonRunning, setIsPistonRunning] = useState(false);
  const executionStartRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { executeCode, loading: pistonLoading } = useCodeRunner();
  const { 
    runCode: runPython, 
    output: pythonOutput, 
    isRunning: pythonRunning, 
    isReady: pythonReady,
    isWaitingForInput,
    writeInputToWorker,
    stopExecution,
    hasSharedArrayBuffer
  } = usePyodide();

  const isPython = activeLanguage === 'python';
  const terminalMode: TerminalMode = isPython ? 'interactive' : 'collect';
  const isLoading = pistonLoading || pythonRunning || (isPython && !pythonReady);
  const isExecuting = pistonLoading || pythonRunning || isPistonRunning;

  // Execution timer
  useEffect(() => {
    if (isExecuting && executionStartRef.current === null) {
      executionStartRef.current = Date.now();
      timerIntervalRef.current = setInterval(() => {
        if (executionStartRef.current) {
          setExecutionTime(Date.now() - executionStartRef.current);
        }
      }, 100);
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

  useEffect(() => {
    localStorage.setItem('codevo-code', code);
    localStorage.setItem('codevo-lang', activeLanguage);
  }, [code, activeLanguage]);

  const handleLanguageChange = (val: string) => {
    const newLang = val as Language;
    
    if (lockedLanguages[newLang]) {
        toast({ title: "Locked", description: "This language is currently disabled.", variant: "destructive" });
        return;
    }

    setActiveLanguage(newLang);
    setCode(getStarterTemplate(newLang));
    setTerminalOutput('');
    setCollectedInputLines([]);
    setIsError(false);
    setExecutionTime(null);
  };

  const handleReset = () => {
    setCode(getStarterTemplate(activeLanguage));
    setTerminalOutput('');
    setCollectedInputLines([]);
    setIsError(false);
    setExecutionTime(null);
    toast({ title: "Reset", description: "Code reset to starter template.", duration: 2000 });
  };

  const handleRun = async () => {
    if (isLoading) return;
    
    if (lockedLanguages[activeLanguage]) {
        toast({ title: "Locked", description: "This language is currently disabled.", variant: "destructive" });
        return;
    }

    setExecutionTime(null);
    executionStartRef.current = Date.now();

    if (isPython) {
      // Python: Use interactive Pyodide terminal
      runPython(code);
    } else {
      // Non-Python: Use Piston API with collected inputs
      setIsPistonRunning(true);
      setTerminalOutput(''); // This will trigger terminal reset
      setIsError(false);
      
      // Join collected input lines for Piston
      const inputData = collectedInputLines.join('\n');
      
      const result = await executeCode(activeLanguage, code, inputData);
      
      if (!result.success) setIsError(true);
      
      // Format output for terminal display
      const output = result.output || result.error || "Unknown Error";
      setTerminalOutput(output);
      
      // Set final execution time
      if (executionStartRef.current) {
        setExecutionTime(Date.now() - executionStartRef.current);
      }
      
      setIsPistonRunning(false);
    }
  };

  const handleStop = () => {
    if (isPython) {
      stopExecution();
      toast({ title: "Stopped", description: "Program execution interrupted.", duration: 2000 });
    }
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
      toast({ title: "Download Started", description: `Downloading ${filename}`, duration: 2000 });
    } catch (err) {
      toast({ title: "Download Failed", description: "Could not generate file.", variant: "destructive" });
    }
  };

  const handleCollectedInput = useCallback((lines: string[]) => {
    setCollectedInputLines(lines);
  }, []);

  const handleClearTerminal = () => {
    if (!isExecuting) {
      if (isPython) {
        runPython(''); // Empty run to clear
      } else {
        setTerminalOutput('');
        setCollectedInputLines([]);
      }
    }
  };

  // Determine which output to show in terminal
  const currentOutput = isPython ? pythonOutput : terminalOutput;
  const currentIsRunning = isPython ? pythonRunning : isPistonRunning;

  return (
    <div className="h-screen flex flex-col bg-[#09090b] text-white overflow-hidden">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0c0c0e] px-3 md:px-4 py-2 md:py-3 flex items-center justify-between shrink-0 h-14 md:h-16">
        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-muted-foreground hover:text-white hover:bg-white/10 h-8 w-8 md:h-9 md:w-9">
            <Home className="w-4 md:w-5 h-4 md:h-5" />
          </Button>
          <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <TerminalIcon className="w-3 md:w-4 h-3 md:h-4 text-purple-400" />
            <h1 className="text-xs md:text-sm font-bold tracking-tight text-purple-400">
              CodeVo
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Execution Timer */}
          {(isExecuting || executionTime !== null) && (
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/10">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] md:text-xs font-mono text-muted-foreground">
                {isExecuting ? formatTime(executionTime || 0) : executionTime !== null ? formatTime(executionTime) : ''}
              </span>
            </div>
          )}

          <Select value={activeLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="h-8 md:h-9 w-[100px] md:w-[140px] bg-white/5 border-white/10 text-[10px] md:text-xs font-medium">
              <div className="flex items-center gap-1.5 md:gap-2">
                <Code2 className="w-3 md:w-3.5 h-3 md:h-3.5 text-blue-400" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1c] border-white/10 text-white">
              {LANGUAGES_CONFIG.map((lang) => (
                <SelectItem 
                  key={lang.id} 
                  value={lang.id} 
                  disabled={lockedLanguages[lang.id]}
                  className="flex items-center justify-between text-xs md:text-sm"
                >
                  <div className="flex items-center gap-2 w-full">
                    {lang.name}
                    {lockedLanguages[lang.id] && <Lock className="w-3 h-3 ml-2 text-red-400" />}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Reset Button */}
          <Button 
            onClick={handleReset} 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 md:h-9 md:w-9 text-muted-foreground hover:text-white hover:bg-white/10"
            title="Reset to template"
          >
            <RotateCcw className="w-3.5 md:w-4 h-3.5 md:h-4" />
          </Button>
          
          <Button onClick={handleDownload} variant="outline" size="sm" className="h-8 md:h-9 border-white/10 bg-white/5 hover:bg-white/10 text-white px-2 md:px-3">
            <Download className="w-3.5 md:w-4 h-3.5 md:h-4" />
            <span className="hidden md:inline ml-2">Save</span>
          </Button>

          {/* Stop Button - Only show when running Python */}
          {pythonRunning && isPython && (
            <Button 
              onClick={handleStop}
              size="sm" 
              className="h-8 md:h-9 px-3 md:px-4 font-bold text-white bg-red-600 hover:bg-red-500 text-xs md:text-sm"
            >
              <Square className="w-3 md:w-3.5 h-3 md:h-3.5 mr-1.5 fill-current" />
              Stop
            </Button>
          )}

          {/* Run Button */}
          <Button 
            onClick={handleRun} 
            disabled={isLoading || lockedLanguages[activeLanguage]} 
            size="sm" 
            className={cn(
              "h-8 md:h-9 px-3 md:px-6 font-bold text-white transition-all text-xs md:text-sm",
              isLoading || lockedLanguages[activeLanguage] 
                ? "bg-amber-600 hover:bg-amber-500" 
                : "bg-green-600 hover:bg-green-500 shadow-[0_0_15px_rgba(22,163,74,0.4)]"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 md:w-4 h-3.5 md:h-4 mr-1.5 md:mr-2 animate-spin"/> 
                <span className="hidden sm:inline">{!pythonReady && isPython ? "Loading..." : "Running..."}</span>
                <span className="sm:hidden">...</span>
              </>
            ) : lockedLanguages[activeLanguage] ? (
              <><Lock className="w-3.5 md:w-4 h-3.5 md:h-4 mr-1.5 md:mr-2"/> <span className="hidden sm:inline">Locked</span></>
            ) : (
              <><Play className="w-3.5 md:w-4 h-3.5 md:h-4 mr-1.5 md:mr-2 fill-current"/> Run</>
            )}
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative">
        <ResizablePanelGroup direction="vertical" className="h-full">
          <ResizablePanel defaultSize={isMobile ? 60 : 70} minSize={30} className="bg-[#09090b]">
            <CodeEditor 
              value={code} 
              onChange={setCode} 
              language={activeLanguage}
            />
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-black border-t border-b border-white/10 h-2 hover:bg-purple-500/20 transition-colors" />

          <ResizablePanel defaultSize={isMobile ? 40 : 30} minSize={15} className="bg-[#0c0c0e] flex flex-col min-h-[100px] relative">
            
            {/* Unified Terminal for ALL languages */}
            <div className="flex-1 flex flex-col min-h-0 relative">
              <div className="flex items-center justify-between px-3 md:px-4 border-b border-white/10 bg-black/20 h-9 md:h-10 shrink-0">
                <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <TerminalIcon className="w-3 h-3" /> 
                  {isPython ? 'Interactive Terminal' : 'Terminal'}
                </div>
                <div className="flex items-center gap-3">
                  {/* SharedArrayBuffer status for Python */}
                  {isPython && !hasSharedArrayBuffer && (
                    <span className="text-[8px] md:text-[10px] text-amber-400 font-mono" title="Interactive input requires SharedArrayBuffer">
                      Limited Mode
                    </span>
                  )}
                  
                  {/* Non-Python: Show input hint when not running */}
                  {!isPython && !currentIsRunning && (
                    <span className="text-[8px] md:text-[10px] text-muted-foreground font-mono">
                      Type inputs, then Run
                    </span>
                  )}
                  
                  {/* Running indicator */}
                  {currentIsRunning && (
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <span className="text-[8px] md:text-[10px] text-green-400 font-mono">
                        {isPython && isWaitingForInput ? 'WAITING FOR INPUT' : 'RUNNING'}
                      </span>
                    </div>
                  )}
                  
                  {/* Clear terminal button */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-muted-foreground hover:text-white" 
                    onClick={handleClearTerminal}
                    disabled={isExecuting}
                    title="Clear terminal"
                  >
                    <RefreshCw className="w-3 h-3"/>
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 relative">
                {isPython && !pythonReady ? (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs md:text-sm font-mono">
                    <div className="flex flex-col items-center gap-3 p-4 text-center">
                      <Loader2 className="w-6 md:w-8 h-6 md:h-8 animate-spin text-purple-500" />
                      <span className="text-[10px] md:text-xs">Loading Python Environment...</span>
                      <span className="text-[8px] md:text-[10px] text-muted-foreground">First load may take 5-10 seconds</span>
                    </div>
                  </div>
                ) : (
                  <TerminalView 
                    output={currentOutput} 
                    onInput={writeInputToWorker}
                    isWaitingForInput={isWaitingForInput}
                    mode={terminalMode}
                    language={activeLanguage}
                    onCollectedInput={handleCollectedInput}
                    isRunning={currentIsRunning}
                  />
                )}
              </div>
            </div>

            <div className="absolute bottom-2 right-3 pointer-events-none select-none z-50 flex items-center justify-end opacity-40">
              <span className="font-neuropol text-[8px] md:text-[10px] font-bold tracking-widest text-white">
                COD<span className="text-[1.2em] lowercase relative top-[0.5px] mx-[0.5px] inline-block">é</span>VO
              </span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default Compiler;
