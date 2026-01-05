import { ScrollArea } from '@/components/ui/scroll-area';
import { Lightbulb, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TestResult } from '@/hooks/useEnhancedCodeRunner';

interface VerdictDisplayProps {
  verdict: string;
  feedbackMessage?: string;
  feedbackSuggestion?: string;
  failedTestIndex?: number;
  testResults?: TestResult[];
  errorDetails?: string | { type: string; rawError: string };
  runtime_ms?: number;
  memory_kb?: number;
}

export function VerdictDisplay({
  verdict,
  feedbackMessage,
  feedbackSuggestion,
  failedTestIndex = -1,
  testResults = [],
  errorDetails,
  runtime_ms,
  memory_kb
}: VerdictDisplayProps) {
  
  const getVerdictTitle = (v: string) => {
    const map: Record<string, string> = {
      'Wrong Answer': 'Logical Discrepancy',
      'Time Limit Exceeded': 'Performance Bottleneck',
      'Runtime Error': 'Execution Failure',
      'Compilation Error': 'Syntax Violation',
      'Memory Limit Exceeded': 'Resource Overflow'
    };
    return map[v] || v;
  };

  const getVerdictColor = (v: string) => {
    switch (v) {
      case 'Accepted': return 'text-[#86efac]'; 
      case 'Time Limit Exceeded':
      case 'Memory Limit Exceeded': return 'text-[#fcd34d]'; 
      default: return 'text-[#fca5a5]';
    }
  };

  const getDotColor = (v: string) => {
    switch (v) {
      case 'Accepted': return 'bg-[#86efac] shadow-[0_0_10px_rgba(134,239,172,0.2)]';
      case 'Time Limit Exceeded':
      case 'Memory Limit Exceeded': return 'bg-[#fcd34d] shadow-[0_0_10px_rgba(252,211,77,0.2)]';
      default: return 'bg-[#fca5a5] shadow-[0_0_10px_rgba(252,165,165,0.2)]';
    }
  };

  const failedTest = failedTestIndex !== -1 ? testResults[failedTestIndex] : null;
  const passedCount = testResults.filter(t => t.passed).length;
  const totalCount = testResults.length;

  return (
    // Changed: Removed max-w constraint to allow full width adaptation
    <div className="w-full flex flex-col gap-4 font-sans text-[#f8fafc] pb-6">
      
      {/* 1. Verdict Header */}
      <header className="bg-[#0c0c0c] border border-white/[0.08] rounded-[4px] p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={cn("font-serif italic text-xl mb-1.5", getVerdictColor(verdict))}>
            {getVerdictTitle(verdict)}
          </h2>
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.15em] text-[#475569]">
            <div className={cn("w-1.5 h-1.5 rounded-full", getDotColor(verdict))} />
            <span>{passedCount} of {totalCount} test cases passed</span>
          </div>
        </div>
        
        <div className="text-left sm:text-right font-mono text-[11px] text-[#475569] leading-relaxed bg-white/[0.02] sm:bg-transparent p-2 sm:p-0 rounded border border-white/[0.05] sm:border-none w-full sm:w-auto">
          <div className="flex sm:block justify-between gap-4">
            <span>Latency: <span className="text-[#94a3b8] ml-2">{runtime_ms ? `${runtime_ms}ms` : '--'}</span></span>
            <span>Memory: <span className="text-[#94a3b8] ml-2">{memory_kb ? `${(memory_kb / 1024).toFixed(1)}MB` : '--'}</span></span>
          </div>
        </div>
      </header>

      {/* 2. Feedback Advisory */}
      <div className="bg-[#141414] border border-white/[0.08] rounded-[4px] p-5">
        <p className="text-sm leading-relaxed text-[#94a3b8] mb-4">
          {feedbackMessage || (typeof errorDetails === 'object' ? `${errorDetails.type}: ${errorDetails.rawError}` : errorDetails) || "The solution did not meet the required specifications for all scenarios."}
        </p>
        
        {feedbackSuggestion && (
          <div className="flex gap-2.5 pt-4 border-t border-white/[0.08] font-serif italic text-[13px] text-[#475569]">
            <Lightbulb className="w-3.5 h-3.5 text-[#fcd34d] opacity-60 shrink-0 mt-0.5" />
            <span>{feedbackSuggestion}</span>
          </div>
        )}
      </div>

      {/* 3. Technical Comparison */}
      {(failedTest || errorDetails) && (
        <div className="flex flex-col gap-3">
          <span className="text-[10px] uppercase tracking-[2px] text-[#475569] pl-1 mt-2">
            Technical Details
          </span>

          {failedTest ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Input - Full Width on Mobile, Half on Desktop if space permits */}
              <div className="lg:col-span-2 bg-[#141414] border border-white/[0.08] rounded-[4px] overflow-hidden">
                <div className="bg-white/[0.02] px-4 py-2 border-b border-white/[0.08] text-[9px] uppercase tracking-[0.1em] text-[#475569]">
                  Input Parameters
                </div>
                <div className="px-4 py-3 font-mono text-[12px] text-[#94a3b8] bg-[#0a0a0a] whitespace-pre-wrap break-all">
                  {typeof failedTest.input === 'object' 
                    ? JSON.stringify(failedTest.input, null, 2) 
                    : String(failedTest.input)}
                </div>
              </div>

              {/* Your Output */}
              <div className="bg-[#141414] border border-white/[0.08] rounded-[4px] overflow-hidden">
                <div className="bg-white/[0.02] px-4 py-2 border-b border-white/[0.08] text-[9px] uppercase tracking-[0.1em] text-[#475569]">
                  Your Output
                </div>
                <div className="px-4 py-3 font-mono text-[12px] text-[#fca5a5]/90 bg-[#0a0a0a] whitespace-pre-wrap break-all">
                  {String(failedTest.actual)}
                </div>
              </div>

              {/* Expected Output */}
              <div className="bg-[#141414] border border-white/[0.08] rounded-[4px] overflow-hidden">
                <div className="bg-white/[0.02] px-4 py-2 border-b border-white/[0.08] text-[9px] uppercase tracking-[0.1em] text-[#475569]">
                  Expected Result
                </div>
                <div className="px-4 py-3 font-mono text-[12px] text-[#86efac]/80 bg-[#0a0a0a] whitespace-pre-wrap break-all">
                  {String(failedTest.expected)}
                </div>
              </div>
            </div>
          ) : (
            // Error Details View
            <div className="bg-[#141414] border border-white/[0.08] rounded-[4px] overflow-hidden">
              <div className="bg-white/[0.02] px-4 py-2 border-b border-white/[0.08] text-[9px] uppercase tracking-[0.1em] text-[#475569] flex items-center gap-2">
                <Terminal className="w-3 h-3" />
                System Log
              </div>
              <ScrollArea className="h-[200px] w-full bg-[#0a0a0a]">
                <div className="px-4 py-4 font-mono text-[12px] text-[#fca5a5] whitespace-pre-wrap">
                  {typeof errorDetails === 'object' ? `${errorDetails.type}: ${errorDetails.rawError}` : (errorDetails || "Unknown system error occurred.")}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
