import { useEffect, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { useIntellisense } from '@/hooks/useIntellisense';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  disableCopyPaste?: boolean;
  fontSize?: number; // Added prop for zoom
}

export const CodeEditor = ({ 
  value, 
  onChange, 
  language, 
  disableCopyPaste = false, 
  fontSize = 14 
}: CodeEditorProps) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  
  // Activate IntelliSense Providers
  useIntellisense();

  // Update font size dynamically when prop changes
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ fontSize });
    }
  }, [fontSize]);

  // Handle Editor Mount
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Configure Editor visual settings
    editor.updateOptions({
      minimap: { enabled: false },
      fontSize: fontSize,
      fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
      fontLigatures: true,
      lineHeight: 22,
      padding: { top: 16 },
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      cursorBlinking: "smooth",
      cursorSmoothCaretAnimation: "on",
      formatOnPaste: !disableCopyPaste,
      formatOnType: true,
      theme: 'vs-dark' // Ensure dark theme
    });

    if (disableCopyPaste) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {});
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {});
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX, () => {});
    }
  };

  const getMonacoLanguage = (lang: string) => {
    switch(lang) {
      case 'cpp': return 'cpp';
      case 'c': return 'c';
      case 'java': return 'java';
      case 'javascript': return 'javascript';
      case 'sql': return 'sql';
      case 'bash': return 'shell';
      default: return 'python';
    }
  };

  return (
    <Editor
      height="100%"
      language={getMonacoLanguage(language)}
      value={value}
      onChange={(val) => onChange(val || '')}
      onMount={handleEditorDidMount}
      theme="vs-dark"
      options={{
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: fontSize,
        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
        lineHeight: 22,
        padding: { top: 16 },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
      }}
    />
  );
};
