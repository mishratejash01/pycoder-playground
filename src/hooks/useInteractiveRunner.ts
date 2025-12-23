import { useState, useCallback, useRef } from 'react';
import { Language } from './useCodeRunner';

const PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute';

interface InteractiveRunnerResult {
  output: string;
  isRunning: boolean;
  isWaitingForInput: boolean;
  runCode: (code: string) => void;
  writeInput: (char: string) => void;
  stopExecution: () => void;
}

// Detect if output is waiting for input (ends with a prompt-like pattern)
const detectPrompt = (output: string): string | null => {
  // Common patterns for input prompts
  const lines = output.split('\n');
  const lastLine = lines[lines.length - 1].trim();
  
  // Check for common prompt patterns:
  // - Ends with ":" or ": " 
  // - Ends with "?" or "? "
  // - Ends with "> " or ">> "
  // - Contains "enter", "input", "name", "number" etc and ends with punctuation
  const promptPatterns = [
    /[:\?]\s*$/,                           // Ends with : or ?
    />\s*$/,                                // Ends with >
    /enter\s+.+[:\?]?\s*$/i,               // "Enter something:"
    /input\s+.+[:\?]?\s*$/i,               // "Input something:"
    /type\s+.+[:\?]?\s*$/i,                // "Type something:"
    /please\s+.+[:\?]?\s*$/i,              // "Please provide..."
  ];
  
  for (const pattern of promptPatterns) {
    if (pattern.test(lastLine) && lastLine.length > 0) {
      return lastLine;
    }
  }
  
  return null;
};

// Get friendly error messages
const getFriendlyError = (rawError: string, language: Language): string => {
  const lowerError = rawError.toLowerCase();
  
  if (language === 'java') {
    if (lowerError.includes('nosuchelementexception')) {
      return "Waiting for input...";
    }
  }
  
  if (language === 'cpp' || language === 'c') {
    if (lowerError.includes('segmentation fault') || lowerError.includes('sigsegv')) {
      return "Segmentation Fault: Memory access error!";
    }
  }
  
  if (lowerError.includes('time limit') || lowerError.includes('timeout')) {
    return "Time Limit Exceeded!";
  }
  
  return rawError;
};

const getLanguageConfig = (language: Language): { pistonLang: string; version: string } => {
  switch (language) {
    case 'java': return { pistonLang: 'java', version: '15.0.2' };
    case 'cpp': return { pistonLang: 'cpp', version: '10.2.0' };
    case 'c': return { pistonLang: 'c', version: '10.2.0' };
    case 'sql': return { pistonLang: 'sqlite3', version: '3.36.0' };
    case 'bash': return { pistonLang: 'bash', version: '5.0.0' };
    default: return { pistonLang: 'python', version: '3.10.0' };
  }
};

export const useInteractiveRunner = (language: Language): InteractiveRunnerResult => {
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  
  const codeRef = useRef<string>("");
  const collectedInputsRef = useRef<string[]>([]);
  const currentInputLineRef = useRef<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const executionCountRef = useRef<number>(0);

  const runPiston = async (code: string, stdin: string, signal: AbortSignal): Promise<{ success: boolean; output: string; needsInput: boolean }> => {
    const { pistonLang, version } = getLanguageConfig(language);
    
    try {
      const response = await fetch(PISTON_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: pistonLang,
          version,
          files: [{ content: code }],
          stdin,
        }),
        signal,
      });
      
      const data = await response.json();
      
      if (data.run) {
        const stdout = data.run.stdout || "";
        const stderr = data.run.stderr || "";
        const combinedOutput = stdout + stderr;
        const isError = data.run.code !== 0;
        
        // Check if the error indicates waiting for input
        const lowerError = stderr.toLowerCase();
        const needsInput = (
          lowerError.includes('nosuchelementexception') ||
          lowerError.includes('eof when reading') ||
          lowerError.includes('eoferror') ||
          (isError && collectedInputsRef.current.length === 0 && stdout.length > 0)
        );
        
        return {
          success: !isError,
          output: isError && !needsInput ? getFriendlyError(combinedOutput, language) : stdout,
          needsInput
        };
      }
      
      return { success: false, output: "Execution failed", needsInput: false };
    } catch (e: any) {
      if (e.name === 'AbortError') {
        return { success: false, output: "^C\nExecution stopped.", needsInput: false };
      }
      return { success: false, output: `Error: ${e.message}`, needsInput: false };
    }
  };

  const executeWithInputs = useCallback(async () => {
    const currentExecution = ++executionCountRef.current;
    const signal = abortControllerRef.current?.signal;
    
    if (!signal || signal.aborted) return;
    
    const stdin = collectedInputsRef.current.join('\n');
    const result = await runPiston(codeRef.current, stdin, signal);
    
    // Check if we're still on the same execution
    if (currentExecution !== executionCountRef.current) return;
    if (signal.aborted) return;
    
    setOutput(result.output);
    
    if (result.needsInput || detectPrompt(result.output)) {
      // Program needs more input
      setIsWaitingForInput(true);
    } else {
      // Program completed
      setIsRunning(false);
      setIsWaitingForInput(false);
    }
  }, [language]);

  const writeInput = useCallback((char: string) => {
    if (!isWaitingForInput) return;
    
    // Handle Enter key - submit the input
    if (char === '\r' || char === '\n') {
      const inputValue = currentInputLineRef.current;
      currentInputLineRef.current = "";
      
      // Add to collected inputs
      collectedInputsRef.current.push(inputValue);
      
      // Show the input in terminal and add newline
      setOutput(prev => prev + '\n');
      
      // Re-execute with all inputs
      executeWithInputs();
    }
    // Handle Backspace - update current line
    else if (char === '\x7f' || char === '\b') {
      currentInputLineRef.current = currentInputLineRef.current.slice(0, -1);
    }
    // Handle Ctrl+C (interrupt)
    else if (char === '\x03') {
      abortControllerRef.current?.abort();
      currentInputLineRef.current = "";
      setIsWaitingForInput(false);
      setIsRunning(false);
      setOutput(prev => prev + '^C\n');
    }
    // Regular character
    else {
      currentInputLineRef.current += char;
    }
  }, [isWaitingForInput, executeWithInputs]);

  const stopExecution = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsRunning(false);
    setIsWaitingForInput(false);
    setOutput(prev => prev + '\n^C\nExecution stopped.\n');
  }, []);

  const runCode = useCallback((code: string) => {
    // Reset state
    codeRef.current = code;
    collectedInputsRef.current = [];
    currentInputLineRef.current = "";
    
    setIsRunning(true);
    setOutput("");
    setIsWaitingForInput(false);
    
    abortControllerRef.current = new AbortController();
    
    // Execute the code
    executeWithInputs();
  }, [executeWithInputs]);

  return {
    output,
    isRunning,
    isWaitingForInput,
    runCode,
    writeInput,
    stopExecution,
  };
};
