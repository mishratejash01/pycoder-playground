import { useState, useEffect, useRef } from 'react';

// We define a robust Python test runner script that we load ONCE.
const PYTHON_TEST_RUNNER_SCRIPT = `
import sys
import ast
import traceback
import io

def _run_test_case_internal(user_code, func_name, input_str):
    # Capture stdout (print statements)
    old_stdout = sys.stdout
    redirected_output = io.StringIO()
    sys.stdout = redirected_output
    
    result_package = {
        "status": "error",
        "result": None,
        "error": None,
        "logs": ""
    }

    try:
        # 1. Create a clean namespace for the user code
        user_globals = {}
        
        # 2. Execute User Code
        try:
            exec(user_code, user_globals)
        except SyntaxError as e:
            return {"status": "error", "error": f"Syntax Error: {e.msg} on line {e.lineno}", "logs": ""}
        except Exception as e:
            return {"status": "error", "error": f"Error executing code: {str(e)}", "logs": ""}

        # 3. Check if function exists
        if func_name not in user_globals:
            return {"status": "error", "error": f"Function '{func_name}' not found. Please check your function name.", "logs": ""}
        
        target_func = user_globals[func_name]
        
        # 4. Parse Input (e.g. "[1, 2]" -> [1, 2])
        try:
            # literal_eval is safer than eval
            args = ast.literal_eval(input_str)
        except Exception as e:
            return {"status": "error", "error": f"Invalid Test Input format: {input_str}", "logs": ""}
        
        # 5. Call Function
        try:
            # Handle tuple unpacking for multiple args: input "(1, 2)" -> func(1, 2)
            if isinstance(args, tuple):
                ret_val = target_func(*args)
            else:
                ret_val = target_func(args)
                
            # Success! Return the string representation of the result
            result_package["status"] = "success"
            result_package["result"] = repr(ret_val)
            
        except Exception as e:
            result_package["error"] = f"Runtime Error: {str(e)}"

    except Exception as e:
        result_package["error"] = f"System Error: {str(e)}"
    
    finally:
        # Restore stdout and capture logs
        sys.stdout = old_stdout
        result_package["logs"] = redirected_output.getvalue()
        
    return result_package
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
        
        // Load the test runner script immediately
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

  const runCode = async (code: string) => {
    if (!pyodideRef.current) throw new Error('Pyodide not loaded');
    try {
      pyodideRef.current.runPython("import sys; from io import StringIO; sys.stdout = StringIO()");
      await pyodideRef.current.loadPackagesFromImports(code);
      await pyodideRef.current.runPythonAsync(code);
      const stdout = pyodideRef.current.runPython("sys.stdout.getvalue()");
      return { success: true, output: stdout };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const runTestFunction = async (userCode: string, functionName: string, inputArgs: string) => {
    if (!pyodideRef.current) throw new Error('Pyodide not loaded');

    try {
      // We assume _run_test_case_internal is already defined in global scope from useEffect
      const runner = pyodideRef.current.globals.get("_run_test_case_internal");
      
      // Call the Python function directly from JS
      const resultProxy = runner(userCode, functionName, inputArgs);
      const result = resultProxy.toJs();
      resultProxy.destroy();

      if (result.get("status") === "error") {
        return { 
          success: false, 
          error: result.get("error"), 
          logs: result.get("logs") 
        };
      }

      return { 
        success: true, 
        result: result.get("result"), 
        logs: result.get("logs") 
      };

    } catch (err: any) {
      return { success: false, error: `Interface Error: ${err.message}` };
    }
  };

  return { pyodide, loading, runCode, runTestFunction };
};
