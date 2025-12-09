importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

let pyodide = null;
let sharedBuffer = null;
let bufferParams = null;

async function loadPyodideAndPackages() {
  pyodide = await loadPyodide();
  
  // 1. Force Unbuffered Stdout (Fixes the "No Output" bug)
  await pyodide.runPythonAsync(`
import sys
import io
sys.stdout = io.TextIOWrapper(open(sys.stdout.fileno(), 'wb', 0), write_through=True)
sys.stderr = io.TextIOWrapper(open(sys.stderr.fileno(), 'wb', 0), write_through=True)
  `);

  // 2. Redirect Streams to React
  pyodide.setStdout({ batched: (msg) => self.postMessage({ type: 'OUTPUT', text: msg + "\n" }) });
  pyodide.setStderr({ batched: (msg) => self.postMessage({ type: 'OUTPUT', text: msg + "\n" }) });
}

self.onmessage = async (event) => {
  const { type, code, inputBuffer, params } = event.data;

  if (type === 'INIT') {
    try {
        await loadPyodideAndPackages();
        sharedBuffer = new Int32Array(inputBuffer);
        bufferParams = params;
        
        // Setup Input Reader (The Queue)
        pyodide.setStdin({
          stdin: () => {
            self.postMessage({ type: 'INPUT_REQUEST' });
            
            // Wait for input from React
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
        self.postMessage({ type: 'OUTPUT', text: "Error loading Pyodide: " + e.message });
    }
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
