/**
 * Pyodide Web Worker with SharedArrayBuffer for Interactive Input
 * * This worker runs Python code in isolation and handles interactive input().
 * * KEY FIX: Uses a 'while' loop to recursively install multiple missing libraries.
 */

importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

let pyodide = null;
let micropip = null;
let sharedSignalArray = null; // Int32Array for signaling
let sharedTextArray = null;   // Uint8Array for text data

// Buffer layout:
// sharedSignalArray[0] = status: 0 = waiting, 1 = input ready, -1 = interrupt
// sharedSignalArray[1] = input length

const STATUS_WAITING = 0;
const STATUS_INPUT_READY = 1;
const STATUS_INTERRUPT = -1;

const CLEAR_GLOBALS_CODE = `
import sys
# Clear user-defined variables
for name in list(globals().keys()):
    if not name.startswith('_') and name not in ['__builtins__', '__name__', '__doc__']:
        del globals()[name]
`;

function extractMissingModuleName(message) {
  const msg = String(message || "");

  const patterns = [
    // 1. Pyodide Standard Lib Error: "The module 'numpy' is included in the Pyodide distribution..."
    /The module\s+['"]([^'"]+)['"]\s+is included/,
    
    // 2. Standard Python Error: "No module named 'xyz'"
    /No module named\s+['"]([^'"]+)['"]/,
    
    // 3. Standard Python Error (no quotes): "No module named xyz"
    /No module named\s+([\w\.]+)/
  ];

  for (const pattern of patterns) {
    const match = msg.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

async function initPyodide() {
  try {
    pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
    });
    
    // --- Load Micropip immediately ---
    await pyodide.loadPackage("micropip");
    micropip = pyodide.pyimport("micropip");

    // CRITICAL: Use RAW mode for character-by-character output
    pyodide.setStdout({
      raw: (byte) => {
        const char = String.fromCharCode(byte);
        self.postMessage({ type: 'OUTPUT', text: char });
      }
    });
    
    pyodide.setStderr({
      raw: (byte) => {
        const char = String.fromCharCode(byte);
        self.postMessage({ type: 'OUTPUT', text: char });
      }
    });
    
    return true;
  } catch (err) {
    self.postMessage({ type: 'ERROR', message: 'Failed to load Pyodide: ' + err.message });
    return false;
  }
}

function setupInteractiveStdin() {
  if (!sharedSignalArray || !sharedTextArray) {
    // Fallback: No SharedArrayBuffer available
    pyodide.setStdin({
      stdin: () => {
        self.postMessage({ type: 'INPUT_REQUEST' });
        return "";
      }
    });
    return;
  }
  
  pyodide.setStdin({
    stdin: () => {
      self.postMessage({ type: 'INPUT_REQUEST' });
      Atomics.store(sharedSignalArray, 0, STATUS_WAITING);
      const result = Atomics.wait(sharedSignalArray, 0, STATUS_WAITING, 300000);
      
      const status = Atomics.load(sharedSignalArray, 0);
      if (status === STATUS_INTERRUPT) {
        throw new Error('KeyboardInterrupt');
      }
      if (result === 'timed-out') {
        throw new Error('EOFError: Input timeout - no input received within 5 minutes');
      }
      
      const length = Atomics.load(sharedSignalArray, 1);
      if (length <= 0) return "";
      
      const textBytes = sharedTextArray.slice(0, length);
      return new TextDecoder().decode(textBytes);
    }
  });
}

self.onmessage = async (event) => {
  const { type, code, sharedBuffer, textBuffer } = event.data;
  
  if (type === 'INIT') {
    if (sharedBuffer && textBuffer) {
      sharedSignalArray = new Int32Array(sharedBuffer);
      sharedTextArray = new Uint8Array(textBuffer);
    }
    const success = await initPyodide();
    if (success) {
      setupInteractiveStdin();
      self.postMessage({ type: 'READY' });
    }
  }
  
  if (type === 'RUN') {
    if (!pyodide) {
      self.postMessage({ type: 'ERROR', message: 'Pyodide not initialized' });
      self.postMessage({ type: 'FINISHED' });
      return;
    }
    
    const MAX_AUTO_INSTALLS = 5; // Prevent infinite loops
    let installAttempts = 0;
    
    // LOOP: Keep trying to run the code until it works or we run out of retries
    while (true) {
      try {
        // 1. Clear globals and run user code
        await pyodide.runPythonAsync(CLEAR_GLOBALS_CODE);
        await pyodide.runPythonAsync(code);
        
        // If we get here, code ran successfully
        break; 

      } catch (err) {
        const rawError = err?.message ?? String(err);
        const missingModule = extractMissingModuleName(rawError);
        
        // 2. Handle Missing Modules via Micropip
        if (missingModule && installAttempts < MAX_AUTO_INSTALLS) {
          const pkg = missingModule.split('.')[0];
          installAttempts++;

          try {
            self.postMessage({ type: 'OUTPUT', text: `\n📦 Installing '${pkg}' via micropip...\n` });
            
            // Micropip handles both PyPI and Pyodide standard libs
            await micropip.install(pkg);
            
            self.postMessage({ type: 'OUTPUT', text: `✅ Installed '${pkg}'. Retrying code...\n\n` });
            
            // CONTINUE the loop to try running the code again
            continue; 

          } catch (installErr) {
            // Install failed (likely C-extension not supported)
             const installErrorMsg = `ModuleNotFoundError: '${pkg}'\n` +
              `💡 '${pkg}' failed to install.\n` +
              `Reason: It might require C-extensions or network sockets not supported in the browser.`;
             self.postMessage({ type: 'OUTPUT', text: '\n' + installErrorMsg + '\n' });
             break; // Stop trying
          }
        }

        // 3. Handle Other Errors (Syntax, Runtime, etc)
        let errorMessage = rawError;
        if (errorMessage.includes('EOFError')) {
          errorMessage = 'EOFError: Input required.\n💡 Type your input in the terminal and press Enter.';
        } else if (errorMessage.includes('KeyboardInterrupt')) {
          errorMessage = 'Program interrupted (Ctrl+C)';
        }

        self.postMessage({ type: 'OUTPUT', text: '\n' + errorMessage + '\n' });
        break; // Stop trying
      }
    }
    
    self.postMessage({ type: 'FINISHED' });
  }
  
  if (type === 'INTERRUPT') {
    if (sharedSignalArray) {
      Atomics.store(sharedSignalArray, 0, STATUS_INTERRUPT);
      Atomics.notify(sharedSignalArray, 0, 1);
    }
  }
};
