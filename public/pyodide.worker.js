importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

let pyodide = null;
let sharedBuffer = null;
let bufferParams = null; // { headIndex: 0, tailIndex: 1, dataOffset: 2, size: ... }

async function loadPyodideAndPackages() {
  pyodide = await loadPyodide();
  // Redirect stdout/stderr to postMessage
  pyodide.setStdout({ batched: (msg) => self.postMessage({ type: 'OUTPUT', text: msg + "\n" }) });
  pyodide.setStderr({ batched: (msg) => self.postMessage({ type: 'OUTPUT', text: msg + "\n" }) });
}

self.onmessage = async (event) => {
  const { type, code, inputBuffer, params } = event.data;

  if (type === 'INIT') {
    await loadPyodideAndPackages();
    sharedBuffer = new Int32Array(inputBuffer);
    bufferParams = params || { headIndex: 0, tailIndex: 1, dataOffset: 2, size: 256 };
    
    // Set up the Ring Buffer Reader
    pyodide.setStdin({
      stdin: () => {
        // 1. Notify Main thread we want input (optional, mostly for UI focus)
        self.postMessage({ type: 'INPUT_REQUEST' });
        
        // 2. Check if Buffer is Empty (Head == Tail)
        let head = Atomics.load(sharedBuffer, bufferParams.headIndex);
        let tail = Atomics.load(sharedBuffer, bufferParams.tailIndex);
        
        // 3. Wait if empty
        if (head === tail) {
            // Wait on the TAIL index to change from its current value
            Atomics.wait(sharedBuffer, bufferParams.tailIndex, tail);
            // Reload fresh tail after wake up
            tail = Atomics.load(sharedBuffer, bufferParams.tailIndex);
        }

        // 4. Read Character
        const charCode = Atomics.load(sharedBuffer, bufferParams.dataOffset + head);
        
        // 5. Advance Head
        const newHead = (head + 1) % bufferParams.size;
        Atomics.store(sharedBuffer, bufferParams.headIndex, newHead);
        
        // 6. Return character
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
