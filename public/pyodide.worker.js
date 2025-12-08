importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

let pyodide = null;
let pythonInputBuffer = null;

async function loadPyodideAndPackages() {
  pyodide = await loadPyodide();
  // Redirect stdout/stderr to postMessage
  pyodide.setStdout({ batched: (msg) => self.postMessage({ type: 'OUTPUT', text: msg + "\n" }) });
  pyodide.setStderr({ batched: (msg) => self.postMessage({ type: 'OUTPUT', text: msg + "\n" }) });
}

self.onmessage = async (event) => {
  const { type, code, inputBuffer } = event.data;

  if (type === 'INIT') {
    await loadPyodideAndPackages();
    pythonInputBuffer = new Int32Array(inputBuffer);
    
    pyodide.setStdin({
      stdin: () => {
        // 1. Notify Main thread we are waiting for input
        self.postMessage({ type: 'INPUT_REQUEST' });
        
        // 2. BLOCK here until Main thread gives us a character
        Atomics.wait(pythonInputBuffer, 0, 0); 
        
        // 3. Read the character code
        const charCode = pythonInputBuffer[1];
        
        // 4. Reset wait flag
        Atomics.store(pythonInputBuffer, 0, 0); 
        
        return String.fromCharCode(charCode);
      }
    });
    self.postMessage({ type: 'READY' });
  }

  if (type === 'RUN') {
    try {
      await pyodide.runPythonAsync(code);
    } catch (err) {
      self.postMessage({ type: 'OUTPUT', text: err.toString() });
    } finally {
      self.postMessage({ type: 'FINISHED' });
    }
  }
};
