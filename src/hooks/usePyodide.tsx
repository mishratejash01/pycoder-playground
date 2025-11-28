import { useState, useEffect, useRef } from 'react';

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

  const runCode = async (code: string) => {
    if (!pyodideRef.current) throw new Error('Pyodide not loaded');
    try {
      // Reset stdout to capture print statements
      pyodideRef.current.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
      `);
      
      await pyodideRef.current.loadPackagesFromImports(code);
      await pyodideRef.current.runPythonAsync(code);
      
      const stdout = pyodideRef.current.runPython("sys.stdout.getvalue()");
      return { success: true, output: stdout };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // --- THE FIXED TEST RUNNER ---
  const runTestFunction = async (userCode: string, functionName: string, inputArgs: string) => {
    if (!pyodideRef.current) throw new Error('Pyodide not loaded');

    try {
      // 1. Reset Output Buffer
      pyodideRef.current.runPython("import sys; from io import StringIO; sys.stdout = StringIO()");

      // 2. Inject Variables Safely (Avoids string interpolation bugs)
      pyodideRef.current.globals.set("_user_code_str", userCode);
      pyodideRef.current.globals.set("_test_input_str", inputArgs);
      pyodideRef.current.globals.set("_target_func_name", functionName);

      // 3. The Python Test Harness
      const testScript = `
import ast
import sys
import traceback

def _run_safe_test():
    try:
        # A. Execute User Code to define functions
        exec(_user_code_str, globals())
        
        # B. Check if function exists
        if _target_func_name not in globals():
            return {"status": "error", "message": f"Function '{_target_func_name}' not found. Did you name it correctly?"}
        
        target_func = globals()[_target_func_name]
        
        # C. Parse Input (e.g., "[1, 2]" -> [1, 2])
        try:
            args = ast.literal_eval(_test_input_str)
        except Exception as e:
             return {"status": "error", "message": f"Test Input Parse Error: {e}"}

        # D. Call Function
        try:
            # Handle tuple inputs for multiple args (e.g. (1, 2) -> func(1, 2))
            if isinstance(args, tuple):
                result = target_func(*args)
            else:
                result = target_func(args)
        except Exception as e:
            return {"status": "error", "message": f"Runtime Error: {e}", "traceback": traceback.format_exc()}

        # E. Return Result as String for Comparison
        return {"status": "success", "result": repr(result)}

    except Exception as e:
        return {"status": "error", "message": f"System Error: {e}"}

_test_outcome = _run_safe_test()
`;
      
      await pyodideRef.current.runPythonAsync(testScript);
      
      // 4. Retrieve Result from Python
      const outcomeProxy = pyodideRef.current.globals.get("_test_outcome");
      const outcome = outcomeProxy.toJs(); // Convert to JS Map
      outcomeProxy.destroy();

      const logs = pyodideRef.current.runPython("sys.stdout.getvalue()");

      if (outcome.get("status") === "error") {
          return { success: false, error: outcome.get("message"), logs };
      }
      
      return { success: true, result: outcome.get("result"), logs };

    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return { pyodide, loading, runCode, runTestFunction };
};
