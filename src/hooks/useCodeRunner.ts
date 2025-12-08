import { useState } from "react";
import { toast } from "sonner"; 

// Mapping internal language names to Piston API versions
// You can add more languages here if needed
const LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
  javascript: { language: "javascript", version: "18.15.0" },
  typescript: { language: "typescript", version: "5.0.3" },
  python: { language: "python", version: "3.10.0" },
  java: { language: "java", version: "15.0.2" },
  c: { language: "c", version: "10.2.0" },
  cpp: { language: "c++", version: "10.2.0" },
  go: { language: "go", version: "1.16.2" },
  rust: { language: "rust", version: "1.68.2" },
};

export const useCodeRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const runCode = async (language: string, sourceCode: string, stdin: string = "") => {
    if (!sourceCode.trim()) {
      toast.error("Please write some code first.");
      return;
    }

    setIsRunning(true);
    setOutput("");
    setError(null);

    const config = LANGUAGE_MAP[language.toLowerCase()];

    if (!config) {
      setError(`Language "${language}" is not supported yet.`);
      setIsRunning(false);
      return;
    }

    try {
      const response = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: config.language,
          version: config.version,
          files: [{ content: sourceCode }],
          stdin: stdin, 
        }),
      });

      const data = await response.json();

      if (data.message) {
        throw new Error(data.message);
      }

      const { stdout, stderr, code } = data.run;

      // Handle output
      if (stderr) {
        setError(stderr);
        // If there is also stdout (e.g. partial run), append it
        if (stdout) setOutput(stdout);
      } else {
        setOutput(stdout);
      }

      // Handle non-zero exit codes that might not have stderr
      if (code !== 0 && !stderr) {
        setError(`Process exited with status code ${code}`);
      }

      if (code === 0 && !stdout && !stderr) {
        setOutput("Program finished with no output.");
      }

    } catch (err: any) {
      console.error("Execution error:", err);
      setError(err.message || "Failed to execute code.");
      toast.error("Execution failed");
    } finally {
      setIsRunning(false);
    }
  };

  return { runCode, isRunning, output, error };
};
