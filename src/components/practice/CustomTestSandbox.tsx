import { useState } from 'react';
import { Play, RotateCcw, History, Activity } from 'lucide-react';
import { EnhancedExecutionResult } from '@/hooks/useEnhancedCodeRunner';
import { cn } from '@/lib/utils';

interface CustomTestSandboxProps {
  defaultInput: string;
  onRunCustomTest: (input: string) => Promise<EnhancedExecutionResult>;
  isRunning: boolean;
}

export function CustomTestSandbox({ defaultInput, onRunCustomTest, isRunning }: CustomTestSandboxProps) {
  const [input, setInput] = useState(defaultInput);
  const [result, setResult] = useState<EnhancedExecutionResult | null>(null);

  const handleRun = async () => {
    if (!input.trim()) return;
    const executionResult = await onRunCustomTest(input);
    setResult(executionResult);
  };

  const handleReset = () => {
    setInput('');
    setResult(null);
  };

  const handleTemplate = (type: 'Empty' | 'Null' | 'Large') => {
    switch (type) {
      case 'Empty': setInput('""'); break;
      case 'Null': setInput('null'); break;
      case 'Large': setInput('A'.repeat(1000)); break;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-[#050505] p-6 font-sans">
      
      <div className="w-full max-w-[500px] bg-[#0A0A0C] border border-[#1A1A1C] flex flex-col p-8">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
            <Activity className="w-3.5 h-3.5" />
            Manual Execution
          </div>
          <div className="flex gap-4">
            <button 
              className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#666666] cursor-pointer flex items-center gap-1.5 transition-colors hover:text-white bg-transparent border-none"
              onClick={() => {}} // Placeholder for Recent functionality
            >
              <History className="w-3.5 h-3.5" />
              Recent
            </button>
            <button 
              className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#666666] cursor-pointer flex items-center gap-1.5 transition-colors hover:text-white bg-transparent border-none"
              onClick={handleReset}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* INPUT SECTION */}
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#666666]">Input Stream</span>
          <div className="flex gap-1.5">
            {['Empty', 'Null', 'Large'].map((type) => (
              <button 
                key={type}
                onClick={() => handleTemplate(type as any)}
                className="bg-transparent border border-[#1A1A1C] text-[#666666] text-[9px] font-bold uppercase px-2 py-[3px] cursor-pointer transition-all hover:text-white hover:border-[#333]"
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <textarea 
          className="w-full min-h-[120px] bg-[#050505] border border-[#1A1A1C] text-[#d4d4d4] p-4 font-mono text-[13px] resize-none outline-none mb-3 focus:border-[#333] placeholder:text-[#333]"
          spellCheck={false}
          placeholder="Enter custom parameters..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        
        <p className="text-[10px] text-[#333] leading-relaxed mb-6">
          Verify implementation logic with custom datasets. Results do not affect session metrics.
        </p>

        <button 
          onClick={handleRun}
          disabled={isRunning}
          className="w-full h-10 bg-white text-[#050505] border-none text-[10px] font-bold uppercase tracking-[0.2em] cursor-pointer flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isRunning ? (
            <span>Running...</span>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              Execute Manual Run
            </>
          )}
        </button>

        {/* OUTPUT SECTION */}
        {result && (
          <div className="mt-8 border-t border-[#1A1A1C] pt-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#666666]">Execution Output</span>
              <span className="font-mono text-[10px] font-semibold text-[#3B82F6]">{result.runtime_ms}ms</span>
            </div>
            
            <div className={cn(
              "border p-4 font-mono text-[12px] whitespace-pre-wrap",
              result.errorDetails 
                ? "bg-[#100505] border-[#2D1A1A] text-[#EF4444]" 
                : "bg-[#0D0D0F] border-[#1A1A1C] text-[#e2e2e2]"
            )}>
              {result.errorDetails || (
                <>
                  <div className="text-[#666] mb-1">{`>> Input: ${input}`}</div>
                  <div>{`>> Result: ${result.output}`}</div>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
