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
      
      // Load packages if needed (naive approach)
      await pyodideRef.current.loadPackagesFromImports(code);
      
      // Run the code
      await pyodideRef.current.runPythonAsync(code);
      
      // Get stdout
      const stdout = pyodideRef.current.runPython("sys.stdout.getvalue()");
      return { success: true, output: stdout };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const runTestFunction = async (userCode: string, functionName: string, inputArgs: string) => {
    if (!pyodideRef.current) throw new Error('Pyodide not loaded');

    try {
      // 1. Load the user's code into the global scope so the function exists
      await pyodideRef.current.runPythonAsync(userCode);

      // 2. Create a script to run the specific test case
      // We use ast.literal_eval to safely parse inputs like "[1,2]" into lists
      const testRunnerScript = `
import ast
import sys
from io import StringIO

# Capture any prints inside the function
sys.stdout = StringIO()

try:
    # Input is injected as a string, e.g., "[1, 2, 3]"
    input_str = """${inputArgs}"""
    
    # Parse input string to Python object
    args = ast.literal_eval(input_str)
    
    # Call the function
    # Handle tuple inputs for multiple arguments
    if isinstance(args, tuple):
        result = ${functionName}(*args)
    else:
        result = ${functionName}(args)
    
    # Return the string representation of the result for comparison
    # strict comparison relies on repr()
    repr(result)

except Exception as e:
    # If function crashes, return the error
    f"ERROR: {str(e)}"
`;

      // 3. Run the test script
      const result = await pyodideRef.current.runPythonAsync(testRunnerScript);
      const logs = pyodideRef.current.runPython("sys.stdout.getvalue()");

      // Check if the python script caught an internal error
      if (typeof result === 'string' && result.startsWith('ERROR:')) {
         return { success: false, error: result, logs };
      }

      return { success: true, result: result, logs: logs };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return { pyodide, loading, runCode, runTestFunction };
};
