import { useState, useEffect, useRef } from 'react';

// --- GLOBAL SINGLETON STATE ---
let globalWorker: Worker | null = null;
let globalBuffer: SharedArrayBuffer | null = null;
let globalInt32: Int32Array | null = null;
let globalIsReady = false;

// Subscribers to receive output in React components
let messageSubscribers: ((data: any) => void)[] = [];

// Buffer Constants
const BUFFER_SIZE = 256;
const HEAD_INDEX = 0;
const TAIL_INDEX = 1;
const DATA_OFFSET = 2;

const initGlobalWorker = () => {
    if (globalWorker) return; // Already initialized!

    // 1. Start Worker
    globalWorker = new Worker(new URL('/pyodide.worker.js', import.meta.url));
    
    // 2. Setup Shared Memory
    globalBuffer = new SharedArrayBuffer(1024);
    globalInt32 = new Int32Array(globalBuffer);

    // 3. Configure Worker
    globalWorker.postMessage({ 
        type: 'INIT', 
        inputBuffer: globalBuffer,
        params: { headIndex: HEAD_INDEX, tailIndex: TAIL_INDEX, dataOffset: DATA_OFFSET, size: BUFFER_SIZE }
    });

    // 4. Global Message Handler
    globalWorker.onmessage = (e) => {
        const { type } = e.data;
        if (type === 'READY') globalIsReady = true;
        
        // Broadcast to all active hooks
        messageSubscribers.forEach(callback => callback(e.data));
    };
};

export const usePyodide = () => {
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [isReady, setIsReady] = useState(globalIsReady);

  useEffect(() => {
    initGlobalWorker();

    const handleMessage = (data: any) => {
      if (data.type === 'OUTPUT') {
        setOutput((prev) => prev + data.text);
      } else if (data.type === 'FINISHED') {
        setIsRunning(false);
      } else if (data.type === 'READY') {
        setIsReady(true);
        setOutput("Python Environment Ready.\n");
      }
    };

    messageSubscribers.push(handleMessage);
    return () => {
        messageSubscribers = messageSubscribers.filter(cb => cb !== handleMessage);
    };
  }, []);

  const writeInputToWorker = (text: string) => {
    if (!globalInt32 || !globalWorker) return;

    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        let tail = Atomics.load(globalInt32, TAIL_INDEX);
        const head = Atomics.load(globalInt32, HEAD_INDEX);
        const nextTail = (tail + 1) % BUFFER_SIZE;
        
        if (nextTail === head) continue; // Buffer full

        Atomics.store(globalInt32, DATA_OFFSET + tail, charCode);
        Atomics.store(globalInt32, TAIL_INDEX, nextTail);
        Atomics.notify(globalInt32, TAIL_INDEX);
    }
  };

  const runCode = (code: string) => {
    if (!globalWorker || !globalInt32) return;
    
    setIsRunning(true);
    setOutput(""); 
    
    Atomics.store(globalInt32, HEAD_INDEX, 0);
    Atomics.store(globalInt32, TAIL_INDEX, 0);
    
    globalWorker.postMessage({ type: 'RUN', code });
  };

  return { runCode, output, isRunning, isReady, writeInputToWorker };
};
