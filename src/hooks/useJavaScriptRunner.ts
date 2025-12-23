import { useState, useCallback, useRef } from 'react';

interface JSRunnerResult {
  output: string;
  isRunning: boolean;
  isWaitingForInput: boolean;
  runCode: (code: string) => void;
  writeInput: (char: string) => void;
  stopExecution: () => void;
}

export const useJavaScriptRunner = (): JSRunnerResult => {
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  
  const inputResolverRef = useRef<((value: string) => void) | null>(null);
  const inputLineRef = useRef<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const writeInput = useCallback((char: string) => {
    // Handle Enter key - submit the input
    if (char === '\r' || char === '\n') {
      const inputValue = inputLineRef.current;
      inputLineRef.current = "";
      
      if (inputResolverRef.current) {
        inputResolverRef.current(inputValue);
        inputResolverRef.current = null;
        setIsWaitingForInput(false);
      }
    }
    // Handle Backspace
    else if (char === '\x7f' || char === '\b') {
      inputLineRef.current = inputLineRef.current.slice(0, -1);
    }
    // Handle Ctrl+C (interrupt)
    else if (char === '\x03') {
      if (inputResolverRef.current) {
        inputResolverRef.current('');
        inputResolverRef.current = null;
      }
      abortControllerRef.current?.abort();
      inputLineRef.current = "";
      setIsWaitingForInput(false);
      setIsRunning(false);
    }
    // Regular character
    else {
      inputLineRef.current += char;
    }
  }, []);

  const stopExecution = useCallback(() => {
    abortControllerRef.current?.abort();
    if (inputResolverRef.current) {
      inputResolverRef.current('');
      inputResolverRef.current = null;
    }
    setIsRunning(false);
    setIsWaitingForInput(false);
  }, []);

  const runCode = useCallback((code: string) => {
    setIsRunning(true);
    setOutput("");
    inputLineRef.current = "";
    
    abortControllerRef.current = new AbortController();
    const abortSignal = abortControllerRef.current.signal;

    // Create custom console and prompt for the sandbox
    const customConsole = {
      log: (...args: any[]) => {
        const text = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        setOutput(prev => prev + text + '\n');
      },
      error: (...args: any[]) => {
        const text = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        setOutput(prev => prev + '\x1b[31m' + text + '\x1b[0m\n');
      },
      warn: (...args: any[]) => {
        const text = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        setOutput(prev => prev + '\x1b[33m' + text + '\x1b[0m\n');
      },
      info: (...args: any[]) => customConsole.log(...args),
      debug: (...args: any[]) => customConsole.log(...args),
      clear: () => setOutput(""),
    };

    // Async prompt function
    const asyncPrompt = (message?: string): Promise<string> => {
      return new Promise((resolve) => {
        if (abortSignal.aborted) {
          resolve('');
          return;
        }
        
        // Show the prompt message
        if (message !== undefined) {
          setOutput(prev => prev + message);
        }
        
        setIsWaitingForInput(true);
        inputResolverRef.current = resolve;
      });
    };

    // Execute the code asynchronously
    const executeAsync = async () => {
      try {
        // Wrap code to use our custom console and async prompt
        // We need to handle both sync code and potential async patterns
        const wrappedCode = `
          (async function() {
            const console = __customConsole__;
            const prompt = __asyncPrompt__;
            const alert = (msg) => console.log(msg);
            
            ${code}
          })();
        `;

        // Create a function with our custom globals
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        const fn = new AsyncFunction('__customConsole__', '__asyncPrompt__', `return ${wrappedCode}`);
        
        await fn(customConsole, asyncPrompt);
        
      } catch (error: any) {
        if (abortSignal.aborted) {
          setOutput(prev => prev + '\n^C\n');
        } else {
          const errorMessage = error.message || String(error);
          setOutput(prev => prev + '\x1b[31mError: ' + errorMessage + '\x1b[0m\n');
        }
      } finally {
        if (!abortSignal.aborted) {
          setIsRunning(false);
          setIsWaitingForInput(false);
        }
      }
    };

    executeAsync();
  }, []);

  return {
    output,
    isRunning,
    isWaitingForInput,
    runCode,
    writeInput,
    stopExecution,
  };
};
