import { useEffect, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { useIntellisense } from '@/hooks/useIntellisense'; // Import the hook
import { usePyodide } from '@/hooks/usePyodide'; // Import Pyodide hook

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
}

export const CodeEditor = ({ value, onChange, language }: CodeEditorProps) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  
  // 1. Activate IntelliSense Providers
  useIntellisense();
  
  // 2. Get Pyodide for Syntax Checking
  const { pyodide } = usePyodide();

  // Handle Editor Mount
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Configure Editor visual settings to look more like VS Code
    editor.updateOptions({
      minimap: { enabled: false },
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
      fontLigatures: true,
      lineHeight: 22,
      padding: { top: 16 },
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      cursorBlinking: "smooth",
      cursorSmoothCaretAnimation: "on",
      formatOnPaste: true,
      formatOnType: true,
    });
  };

  // 3. Real-time Validation Logic (Debounced)
  useEffect(() => {
    // Only run validation if editor is ready and language is Python
    // (JS is handled by Monaco internally)
    if (!editorRef.current || !monacoRef.current || !pyodide) return;

    // Debounce timer
    const timer = setTimeout(async () => {
      
      // Clear previous markers
      const model = editorRef.current.getModel();
      monacoRef.current.editor.setModelMarkers(model, "owner", []);

      if (language === 'python') {
        try {
            // "compile" checks syntax without executing
            await pyodide.runPythonAsync(`
import ast
code_str = ${JSON.stringify(value)}
try:
    ast.parse(code_str)
except SyntaxError as e:
    # Pass error details to JS
    raise e
            `);
        } catch (err: any) {
             // Parse the Python error message to get line number and message
             // Python error format usually: "SyntaxError: invalid syntax (line 5)"
             const errorMessage = err.message || "";
             
             // Regex to find line number in the error object (Pyodide structure varies slightly)
             // We look for the properties attached to the error if possible, or parse string
             // Ideally we pass structured data back, but parsing string is backup
             
             // Simplest approach: The error usually contains "line X"
             const lineMatch = errorMessage.match(/line (\d+)/);
             const lineNumber = lineMatch ? parseInt(lineMatch[1]) : 1;
             
             monacoRef.current.editor.setModelMarkers(model, "python-syntax", [{
                startLineNumber: lineNumber,
                startColumn: 1,
                endLineNumber: lineNumber,
                endColumn: 1000,
                message: errorMessage.split('\n')[0], // Take first line of error
                severity: monacoRef.current.MarkerSeverity.Error
             }]);
        }
      } 
      
      // Note: C++/Java validation requires a backend, so we skip them here.
      
    }, 800); // 800ms debounce to avoid lagging while typing

    return () => clearTimeout(timer);
  }, [value, language, pyodide]);

  return (
    <div className="h-full w-full bg-[#1e1e1e] overflow-hidden rounded-md border border-white/10 shadow-2xl">
      <Editor
        height="100%"
        defaultLanguage="python"
        language={language}
        theme="vs-dark"
        value={value}
        onChange={(val) => onChange(val || '')}
        onMount={handleEditorDidMount}
        options={{
            renderWhitespace: "selection",
            // Enable suggestions
            quickSuggestions: { other: true, comments: true, strings: true },
        }}
      />
    </div>
  );
};
