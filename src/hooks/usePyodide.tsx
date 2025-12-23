import { useState, useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    loadPyodide: any;
    pyodide: any;
  }
}

// --- GLOBAL SINGLETON (Keeps Python alive across reloads) ---
let pyodideInstance: any = null;
let isPyodideLoading = false;
let pyodideReadyPromise: Promise<any> | null = null;

// For interactive input with SharedArrayBuffer (if available)
let sharedInputBuffer: SharedArrayBuffer | null = null;
let inputArray: Int32Array | null = null;
let inputTextArray: Uint8Array | null = null;

export const usePyodide = () => {
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const inputResolverRef = useRef<((value: string) => void) | null>(null);
  const inputBufferRef = useRef<string>("");
  const isWaitingForInputRef = useRef(false);

  // Check if SharedArrayBuffer is available
  const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';

  // 1. Load Pyodide Once (Singleton Pattern)
  useEffect(() => {
    const initPyodide = async () => {
      // If already loaded, just set ready and exit
      if (pyodideInstance) {
        setIsReady(true);
        return;
      }

      // If currently loading, wait for it
      if (isPyodideLoading) {
        if (pyodideReadyPromise) await pyodideReadyPromise;
        setIsReady(true);
        return;
      }

      isPyodideLoading = true;
      try {
        // A. Inject the script tag if missing
        if (!document.getElementById('pyodide-script')) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
          script.id = 'pyodide-script';
          document.body.appendChild(script);
          await new Promise((resolve) => { script.onload = resolve; });
        }

        // B. Initialize Pyodide
        pyodideReadyPromise = window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
        });
        
        const pyodide = await pyodideReadyPromise;

        // C. Setup stdin based on SharedArrayBuffer availability
        if (hasSharedArrayBuffer) {
          // Create shared buffers for input
          sharedInputBuffer = new SharedArrayBuffer(4); // Signal buffer
          const textBuffer = new SharedArrayBuffer(1024); // Text buffer
          inputArray = new Int32Array(sharedInputBuffer);
          inputTextArray = new Uint8Array(textBuffer);
          
          pyodide.setStdin({
            stdin: () => {
              // Signal that we're waiting for input
              Atomics.store(inputArray!, 0, 0);
              isWaitingForInputRef.current = true;
              
              // Wait for input (with timeout)
              const result = Atomics.wait(inputArray!, 0, 0, 30000); // 30 second timeout
              
              isWaitingForInputRef.current = false;
              
              if (result === 'timed-out') {
                return ""; // Timeout
              }
              
              // Read the input text
              const length = inputArray![0];
              if (length > 0) {
                const text = new TextDecoder().decode(inputTextArray!.slice(0, length));
                return text;
              }
              return "";
            }
          });
        } else {
          // Fallback: Use prompt for browsers without SharedArrayBuffer
          pyodide.setStdin({
            stdin: () => {
              const result = window.prompt("Python Input Required:");
              return result !== null ? result : "";
            }
          });
        }

        // D. Setup Initial Output Redirection
        pyodide.setStdout({ batched: (text: string) => { console.log(text); } });
        pyodide.setStderr({ batched: (text: string) => { console.log(text); } });

        pyodideInstance = pyodide;
        setIsReady(true);
      } catch (err) {
        console.error("Pyodide Load Failed:", err);
        setOutput("Error loading Python environment. Please refresh the page.");
      } finally {
        isPyodideLoading = false;
      }
    };

    initPyodide();
  }, [hasSharedArrayBuffer]);

  // 2. Run Code Function
  const runCode = useCallback(async (code: string) => {
    if (!pyodideInstance) return;
    
    setIsRunning(true);
    setOutput(""); // Clear the output state to trigger Terminal reset
    inputBufferRef.current = "";

    // Redirect output to THIS specific component's state
    pyodideInstance.setStdout({ batched: (text: string) => setOutput((prev) => prev + text + "\n") });
    pyodideInstance.setStderr({ batched: (text: string) => setOutput((prev) => prev + text + "\n") });

    try {
      // CLEANUP: Wipe variables from previous run so it feels fresh
      await pyodideInstance.runPythonAsync("globals().clear()"); 
      
      // NOW RUN USER CODE
      await pyodideInstance.runPythonAsync(code);
    } catch (err: any) {
      // Format Python errors nicely
      let errorMessage = err.message;
      
      // Make common errors more friendly
      if (errorMessage.includes('EOFError')) {
        errorMessage = "EOF Error: No more input available.\n\n💡 If using SharedArrayBuffer input, make sure to press Enter after typing.";
      } else if (errorMessage.includes('KeyboardInterrupt')) {
        errorMessage = "Program interrupted.";
      } else if (errorMessage.includes('ModuleNotFoundError') || errorMessage.includes('No module named')) {
        const moduleName = errorMessage.match(/No module named '([^']+)'/)?.[1] || 'unknown';
        errorMessage = `Module Not Found: '${moduleName}'\n\n💡 This module is not available in the browser environment. Try using standard library modules.`;
      }
      
      setOutput((prev) => prev + `\nError:\n${errorMessage}`);
    } finally {
      setIsRunning(false);
    }
  }, []);

  // 3. Write input to the Python process
  const writeInputToWorker = useCallback((text: string) => {
    if (!hasSharedArrayBuffer || !inputArray || !inputTextArray) {
      // Fallback mode - just accumulate input (won't work interactively)
      inputBufferRef.current += text;
      return;
    }
    
    // Handle Enter key
    if (text === '\r' || text === '\n') {
      const inputText = inputBufferRef.current + '\n';
      inputBufferRef.current = "";
      
      // Write input to shared buffer
      const encoded = new TextEncoder().encode(inputText);
      inputTextArray.set(encoded.slice(0, 1023)); // Max 1KB input
      
      // Signal that input is ready
      Atomics.store(inputArray, 0, encoded.length);
      Atomics.notify(inputArray, 0, 1);
    } else if (text === '\x7f' || text === '\b') {
      // Backspace
      inputBufferRef.current = inputBufferRef.current.slice(0, -1);
    } else {
      // Regular character
      inputBufferRef.current += text;
    }
  }, [hasSharedArrayBuffer]);

  return { runCode, output, isRunning, isReady, writeInputToWorker };
};
