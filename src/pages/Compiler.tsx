import { useState } from "react";
import { useCodeRunner } from "@/hooks/useCodeRunner";
import CodeEditor from "@/components/CodeEditor";
import { Button } from "@/components/ui/button";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Play } from "lucide-react";

const Compiler = () => {
  const [code, setCode] = useState("// Write your code here...");
  const [language, setLanguage] = useState("python");
  const [input, setInput] = useState(""); // Stdin state

  const { runCode, isRunning, output, error } = useCodeRunner();

  const handleRun = () => {
    runCode(language, code, input);
  };

  return (
    <div className="h-screen w-full bg-gray-950 text-white flex flex-col">
      {/* Header / Toolbar */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-950">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
          Codevo Compiler
        </h1>
        
        <div className="flex items-center gap-4">
          {/* Language Selector */}
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[180px] bg-gray-900 border-gray-700 text-gray-200">
              <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700 text-gray-200">
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="typescript">TypeScript</SelectItem>
              <SelectItem value="java">Java</SelectItem>
              <SelectItem value="cpp">C++</SelectItem>
              <SelectItem value="c">C</SelectItem>
              <SelectItem value="go">Go</SelectItem>
              <SelectItem value="rust">Rust</SelectItem>
            </SelectContent>
          </Select>

          {/* Run Button */}
          <Button
            onClick={handleRun}
            disabled={isRunning}
            className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]"
          >
            {isRunning ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Run Code
          </Button>
        </div>
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Editor Panel */}
        <ResizablePanel defaultSize={60} minSize={30} className="relative">
          <CodeEditor
            value={code}
            onChange={setCode}
            language={language}
          />
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-gray-800" />

        {/* IO Panel */}
        <ResizablePanel defaultSize={40} minSize={20}>
          <ResizablePanelGroup direction="vertical">
            
            {/* INPUT BOX (Stdin) */}
            <ResizablePanel defaultSize={30} minSize={10}>
              <div className="h-full flex flex-col bg-gray-900 p-4 border-b border-gray-800">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Input (Stdin)
                </h3>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-sm text-gray-200 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  placeholder="Enter input here (e.g. for cin or input())..."
                />
              </div>
            </ResizablePanel>

            <ResizableHandle className="bg-gray-800" />

            {/* OUTPUT BOX */}
            <ResizablePanel defaultSize={70} minSize={10}>
              <div className="h-full flex flex-col bg-gray-900 p-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Output
                </h3>
                <div className="flex-1 w-full bg-black border border-gray-800 rounded-md p-3 overflow-auto">
                  {error ? (
                    <pre className="font-mono text-sm text-red-400 whitespace-pre-wrap">
                      {error}
                    </pre>
                  ) : (
                    <pre className="font-mono text-sm text-green-400 whitespace-pre-wrap">
                      {output || "Run code to see output..."}
                    </pre>
                  )}
                </div>
              </div>
            </ResizablePanel>

          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Compiler;
