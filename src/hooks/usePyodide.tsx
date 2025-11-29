import { useState, useEffect, useRef } from 'react';

// INTELLIGENT PYTHON RUNNER SCRIPT
// 1. Captures stdout (prints)
// 2. Executes user code safely
// 3. Smart-handles Input:
//    a. Tries to parse as pure data arguments (e.g., "[1,2]") -> calls function(args)
//    b. If data parse fails, treats input as an expression (e.g., "Time(35)") -> evaluates expression
const PYTHON_TEST_RUNNER_SCRIPT = `
import sys
import ast
import traceback
import io

def _run_test_case_internal(user_code, func_name, input_str):
    # Capture stdout
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
        # 1. Create a clean namespace
        user_globals = {}
        
        # 2. Execute User Code
        try:
            exec(user_code, user_globals)
        except SyntaxError as e:
            return {"status": "error", "error": f"Syntax Error: {e.msg} on line {e.lineno}", "logs": ""}
        except Exception as e:
            return {"status": "error", "error": f"Error executing code: {str(e)}", "logs": ""}

        # 3. Locate Target (Function or Class)
        # We don't fail immediately if func_name is missing, because input might be a standalone script
        target_callable = user_globals.get(func_name)
        
        # 4. Process Input Strategy
        execution_result = None
        
        # STRATEGY A: Input is pure data (List, Tuple, Int, String) intended for the target function
        try:
            # Try to parse input as data structure
            input_args = ast.literal_eval(input_str)
            
            if target_callable is None:
                raise ValueError(f"Function/Class '{func_name}' not defined in code.")

            # If input is a tuple, unpack it as arguments, otherwise pass as single arg
            if isinstance(input_args, tuple):
                execution_result = target_callable(*input_args)
            else:
                execution_result = target_callable(input_args)

        except (ValueError, SyntaxError):
            # STRATEGY B: Input is an executable expression (e.g., "Time(50)")
            # This handles Class instantiation or complex calls that aren't literals
            try:
                # Evaluate input_str within the user_globals context
                execution_result = eval(input_str, user_globals)
            except Exception as e:
                # If both strategies fail, return the error
                raise Exception(f"Input processing failed. Input is neither valid data nor valid expression. Error: {str(e)}")

        # 5. Success
        result_package["status"] = "success"
        
        # If the function returned something, use repr(). 
        # If it returned None (but printed something), we'll rely on logs check in JS.
        result_package["result"] = str(execution_result) if execution_result is not None else ""

    except Exception as e:
        result_package["error"] = f"{str(e)}"
    
    finally:
        # Restore stdout
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
      const runner = pyodideRef.current.globals.get("_run_test_case_internal");
      
      const resultProxy = runner(userCode, functionName, inputArgs);
      const result = resultProxy.toJs();
      resultProxy.destroy();

      if (result.get("status") === "error") {
        return { 
          success: false, 
          error: result.get("error"), 
          output: result.get("logs") 
        };
      }

      // We combine Return Value and Print Logs for flexibility
      // If there are logs, we often prioritize them or append them
      const retVal = result.get("result");
      const logs = result.get("logs");
      
      let finalOutput = "";
      if (logs && retVal) finalOutput = `${logs}\n${retVal}`;
      else if (logs) finalOutput = logs;
      else finalOutput = retVal;

      return { 
        success: true, 
        result: finalOutput.trim(), 
        logs: logs 
      };

    } catch (err: any) {
      return { success: false, error: `Interface Error: ${err.message}` };
    }
  };

  return { pyodide, loading, runCode, runTestFunction };
};
