import { useState, useEffect, useRef } from 'react';

// Shared Buffer Configuration
const BUFFER_SIZE = 256;
const HEAD_INDEX = 0;
const TAIL_INDEX = 1;
const DATA_OFFSET = 2;

export const usePyodide = () => {
  const workerRef = useRef<Worker | null>(null);
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  
  // Shared Buffer: Index 0=Head, 1=Tail, 2..258=Data
  const sharedBufferRef = useRef(new SharedArrayBuffer(1024)); 
  const inputInt32 = useRef(new Int32Array(sharedBufferRef.current));

  useEffect(() => {
    workerRef.current = new Worker(new URL('/pyodide.worker.js', import.meta.url));
    
    workerRef.current.onmessage = (e) => {
      const { type, text } = e.data;
      
      if (type === 'OUTPUT') {
        setOutput((prev) => prev + text);
      } else if (type === 'FINISHED') {
        setIsRunning(false);
      }
    };

    // Initialize Worker with the Shared Buffer and Params
    workerRef.current.postMessage({ 
        type: 'INIT', 
        inputBuffer: sharedBufferRef.current,
        params: { 
            headIndex: HEAD_INDEX, 
            tailIndex: TAIL_INDEX, 
            dataOffset: DATA_OFFSET, 
            size: BUFFER_SIZE 
        }
    });

    return () => workerRef.current?.terminate();
  }, []);

  const writeInputToWorker = (text: string) => {
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        
        let tail = Atomics.load(inputInt32.current, TAIL_INDEX);
        const head = Atomics.load(inputInt32.current, HEAD_INDEX);
        const nextTail = (tail + 1) % BUFFER_SIZE;
        
        if (nextTail === head) {
            // Buffer full - Drop char or busy wait (unlikely with keyboard input)
            console.warn("Input buffer full, dropping character");
            continue; 
        }

        // 1. Write Data
        Atomics.store(inputInt32.current, DATA_OFFSET + tail, charCode);
        
        // 2. Advance Tail
        Atomics.store(inputInt32.current, TAIL_INDEX, nextTail);
        
        // 3. Notify Worker (that Tail changed)
        Atomics.notify(inputInt32.current, TAIL_INDEX);
    }
  };

  const runCode = (code: string) => {
    // Reset buffer pointers on new run to avoid stale input
    Atomics.store(inputInt32.current, HEAD_INDEX, 0);
    Atomics.store(inputInt32.current, TAIL_INDEX, 0);
    
    setIsRunning(true);
    setOutput("");
    workerRef.current?.postMessage({ type: 'RUN', code });
  };

  return { runCode, output, isRunning, writeInputToWorker };
};
