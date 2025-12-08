// src/hooks/usePyodide.tsx
import { useState, useEffect, useRef } from 'react';

export const usePyodide = () => {
  const workerRef = useRef<Worker | null>(null);
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  
  // Shared Buffer: Index 0 = Status flag, Index 1 = Character code
  const sharedBufferRef = useRef(new SharedArrayBuffer(1024)); 
  const inputInt32 = useRef(new Int32Array(sharedBufferRef.current));

  useEffect(() => {
    workerRef.current = new Worker(new URL('/pyodide.worker.js', import.meta.url));
    
    workerRef.current.onmessage = (e) => {
      const { type, text } = e.data;
      
      if (type === 'OUTPUT') {
        setOutput((prev) => prev + text);
      } else if (type === 'INPUT_REQUEST') {
        // Provide input! 
        // In a real app, you would focus the xterm instance here.
        // For simplicity, we are just mocking a hardcoded input '10' for now:
        writeInputToWorker("10\n"); 
      } else if (type === 'FINISHED') {
        setIsRunning(false);
      }
    };

    // Initialize Worker with the Shared Buffer
    workerRef.current.postMessage({ 
        type: 'INIT', 
        inputBuffer: sharedBufferRef.current 
    });

    return () => workerRef.current?.terminate();
  }, []);

  const writeInputToWorker = (text: string) => {
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        // Write char to index 1
        Atomics.store(inputInt32.current, 1, charCode);
        // Set flag to 1 (Ready) at index 0
        Atomics.store(inputInt32.current, 0, 1);
        // Wake up the worker
        Atomics.notify(inputInt32.current, 0, 1);
        // Note: You need a tiny delay or loop mechanism in a real char-by-char stream
    }
  };

  const runCode = (code: string) => {
    setIsRunning(true);
    setOutput("");
    workerRef.current?.postMessage({ type: 'RUN', code });
  };

  return { runCode, output, isRunning, writeInputToWorker };
};
