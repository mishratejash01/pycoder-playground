importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

let pyodide = null;
let sharedBuffer = null;
let bufferParams = null;
const decoder = new TextDecoder();

async function loadPyodideAndPackages() {
  pyodide = await loadPyodide();
  
  // Use Raw Stdout to avoid buffering issues
  function rawStdout(code) {
      const char = String.fromCharCode(code);
      self.postMessage({ type: 'OUTPUT', text: char });
  }

  // Redirect Streams
  pyodide.setStdout({ raw: rawStdout });
  pyodide.setStderr({ raw: rawStdout });
}

self.onmessage = async (event) => {
  const { type, code, inputBuffer, params } = event.data;

  if (type === 'INIT') {
    try {
        await loadPyodideAndPackages();
        sharedBuffer = new Int32Array(inputBuffer);
        bufferParams = params;
        
        pyodide.setStdin({
          stdin: () => {
            // Notify we are waiting
            self.postMessage({ type: 'INPUT_REQUEST' });
            
            // Block and Wait for React to write to buffer
            let head = Atomics.load(sharedBuffer, bufferParams.headIndex);
            let tail = Atomics.load(sharedBuffer, bufferParams.tailIndex);
            
            if (head === tail) {
                Atomics.wait(sharedBuffer, bufferParams.tailIndex, tail);
                tail = Atomics.load(sharedBuffer, bufferParams.tailIndex);
            }

            const charCode = Atomics.load(sharedBuffer, bufferParams.dataOffset + head);
            const newHead = (head + 1) % bufferParams.size;
            Atomics.store(sharedBuffer, bufferParams.headIndex, newHead);
            
            return String.fromCharCode(charCode);
          }
        });
        self.postMessage({ type: 'READY' });
    } catch (e) {
        self.postMessage({ type: 'OUTPUT', text: "Init Error: " + e.message });
    }
  }

  if (type === 'RUN') {
    try {
      await pyodide.runPythonAsync(code);
    } catch (err) {
      self.postMessage({ type: 'OUTPUT', text: "\r\nTraceback: " + err.toString() });
    } finally {
      self.postMessage({ type: 'FINISHED' });
    }
  }
};
