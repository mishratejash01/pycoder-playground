import { useState, useEffect, useRef } from 'react';

// INTELLIGENT PYTHON RUNNER SCRIPT
// Updated to support Streaming Stdout and Pre-fed Stdin
const PYTHON_TEST_RUNNER_SCRIPT = `
import sys
import ast
import traceback
import io
import js

# Class to redirect stdout to Javascript callback
class JSWriter:
    def write(self, string):
        try:
            js.handlePythonOutput(string)
        except:
            pass
    def flush(self):
        pass

def _run_code_with_streams(user_code, input_str):
    # 1. Setup Stdin
    sys.stdin = io.StringIO(input_str)
    
    # 2. Setup Stdout (Streaming)
    old_stdout = sys.stdout
    sys.stdout = JSWriter()
    
    try:
        # Execute User Code
        exec(user_code, {})
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        # Restore stdout
        sys.stdout = old_stdout

# Keep existing test runner for other parts of the app if needed...
def _run_test_case_internal(user_code, func_name, input_str):
    # ... (existing implementation if you need to keep it for assignments)
    pass
`;

export const usePyodide = () => {
  const [pyodide, setPyodide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pyodideRef = useRef<any>(null);

  useEffect(() => {
    const loadPyodide = async () => {
      try {
        // @ts-ignore
        const pyodideModule = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
        });
        
        await pyodideModule.runPythonAsync(PYTHON_TEST_RUNNER_SCRIPT);
        
        pyodideRef.current = pyodideModule;
        setPyodide(pyodideModule);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load Pyodide:", err);
        setLoading(false);
      }
    };

    loadPyodide();
  }, []);

  // Updated runCode to accept stdin and an output callback
  const runCode = async (code: string, stdin: string = "", onOutput?: (text: string) => void) => {
    if (!pyodideRef.current) throw new Error('Pyodide not loaded');
    
    // Mount the callback to the window object so Python can call it
    // @ts-ignore
    window.handlePythonOutput = (text: string) => {
      if (onOutput) onOutput(text);
    };

    try {
      const runner = pyodideRef.current.globals.get("_run_code_with_streams");
      const resultProxy = runner(code, stdin);
      const result = resultProxy.toJs();
      resultProxy.destroy();

      // Cleanup global
      // @ts-ignore
      delete window.handlePythonOutput;

      if (!result.success) {
        return { success: false, error: result.error };
      }
      return { success: true, output: "" }; // Output already handled via stream
    } catch (err: any) {
      // @ts-ignore
      delete window.handlePythonOutput;
      return { success: false, error: err.message };
    }
  };

  const runTestFunction = async (userCode: string, functionName: string, inputArgs: string) => {
     // ... (Keep existing implementation for Assignments)
     return { success: false, error: "Not implemented for Compiler view" };
  };

  return { pyodide, loading, runCode, runTestFunction };
};
