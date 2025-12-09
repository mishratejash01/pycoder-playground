import { useState, useEffect, useRef } from 'react';

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

export const usePyodide = () => {
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Load Pyodide Once
  useEffect(() => {
    const initPyodide = async () => {
      if (pyodideInstance) {
        setIsReady(true);
        return;
      }

      if (isPyodideLoading) {
        // Wait for existing promise
        if (pyodideReadyPromise) await pyodideReadyPromise;
        setIsReady(true);
        return;
      }

      isPyodideLoading = true;
      try {
        // 1. Load the Script
        if (!document.getElementById('pyodide-script')) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
            script.id = 'pyodide-script';
            document.body.appendChild(script);
            await new Promise((resolve) => { script.onload = resolve; });
        }

        // 2. Initialize Pyodide
        pyodideReadyPromise = window.loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
        });
        
        const pyodide = await pyodideReadyPromise;
        
        // 3. Setup Streams
        // We use a simple window.prompt for input to guarantee it works everywhere
        pyodide.setStdin({
            stdin: () => {
                const result = window.prompt("Python Input Required:");
                return result ? result : "";
            }
        });

        // Redirect Output
        // We store the handler globally so we can swap it later if needed
        pyodide.setStdout({ batched: (text: string) => { console.log(text); } });
        pyodide.setStderr({ batched: (text: string) => { console.log(text); } });

        pyodideInstance = pyodide;
        setIsReady(true);
      } catch (err) {
        console.error("Pyodide Load Failed:", err);
        setOutput("Error loading Python environment. Refresh the page.");
      } finally {
        isPyodideLoading = false;
      }
    };

    initPyodide();
  }, []);

  const runCode = async (code: string) => {
    if (!pyodideInstance) return;
    
    setIsRunning(true);
    setOutput(""); // Clear terminal

    // Redirect output to THIS component's state
    pyodideInstance.setStdout({ batched: (text: string) => setOutput((prev) => prev + text + "\n") });
    pyodideInstance.setStderr({ batched: (text: string) => setOutput((prev) => prev + text + "\n") });

    try {
        await pyodideInstance.runPythonAsync(code);
    } catch (err: any) {
        setOutput((prev) => prev + `\r\nTraceback (most recent call last):\n${err.message}`);
    } finally {
        setIsRunning(false);
    }
  };

  // Safe Mode doesn't support writing input directly to terminal (uses Prompt)
  const writeInputToWorker = (text: string) => {
     // Optional: You could echo this to the terminal if you wanted
  };

  return { runCode, output, isRunning, isReady, writeInputToWorker };
};
