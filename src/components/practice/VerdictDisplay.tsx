import { motion } from 'framer-motion';
import { XCircle, Clock, HardDrive, AlertTriangle, Code2, Lightbulb, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Verdict, TestResult } from '@/hooks/useEnhancedCodeRunner';
import { useState } from 'react';

interface VerdictDisplayProps {
  verdict: Verdict;
  feedbackMessage: string;
  feedbackSuggestion: string;
  failedTestIndex?: number;
  testResults: TestResult[];
  errorDetails?: {
    type: string;
    rawError: string;
  };
  runtime_ms?: number;
  memory_kb?: number;
}

const verdictConfig: Record<Exclude<Verdict, 'AC' | 'PENDING'>, {
  label: string;
  icon: typeof XCircle;
  bgColor: string;
  textColor: string;
  borderColor: string;
  iconColor: string;
}> = {
  WA: {
    label: 'Wrong Answer',
    icon: XCircle,
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/30',
    iconColor: 'text-red-500'
  },
  TLE: {
    label: 'Time Limit Exceeded',
    icon: Clock,
    bgColor: 'bg-orange-500/10',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/30',
    iconColor: 'text-orange-500'
  },
  MLE: {
    label: 'Memory Limit Exceeded',
    icon: HardDrive,
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    iconColor: 'text-purple-500'
  },
  RE: {
    label: 'Runtime Error',
    icon: AlertTriangle,
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-500/30',
    iconColor: 'text-yellow-500'
  },
  CE: {
    label: 'Compilation Error',
    icon: Code2,
    bgColor: 'bg-gray-500/10',
    textColor: 'text-gray-400',
    borderColor: 'border-gray-500/30',
    iconColor: 'text-gray-500'
  }
};

export const VerdictDisplay = ({
  verdict,
  feedbackMessage,
  feedbackSuggestion,
  failedTestIndex,
  testResults,
  errorDetails,
  runtime_ms,
  memory_kb
}: VerdictDisplayProps) => {
  const [showDetails, setShowDetails] = useState(false);
  
  if (verdict === 'AC' || verdict === 'PENDING') return null;

  const config = verdictConfig[verdict];
  const Icon = config.icon;
  const failedTest = failedTestIndex !== undefined ? testResults[failedTestIndex] : null;
  const passedCount = testResults.filter(t => t.passed).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className={cn(
        "flex items-center gap-3 p-4 rounded-lg border",
        config.bgColor,
        config.borderColor
      )}>
        <div className={cn("p-2 rounded-full", config.bgColor)}>
          <Icon className={cn("w-5 h-5", config.iconColor)} />
        </div>
        <div className="flex-1">
          <h3 className={cn("font-bold", config.textColor)}>{config.label}</h3>
          <p className="text-xs text-muted-foreground">
            {passedCount}/{testResults.length} test cases passed
          </p>
        </div>
        {runtime_ms && (
          <div className="text-right text-xs text-muted-foreground">
            <div>{runtime_ms}ms</div>
            {memory_kb && <div>{(memory_kb / 1024).toFixed(1)}MB</div>}
          </div>
        )}
      </div>

      {/* Feedback message */}
      <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
        <p className="text-sm text-gray-300">{feedbackMessage}</p>
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Lightbulb className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
          <p>{feedbackSuggestion}</p>
        </div>
      </div>

      {/* Failed test case (if public) */}
      {failedTest && (
        <div className="space-y-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-white transition-colors"
          >
            <ChevronDown className={cn("w-4 h-4 transition-transform", showDetails && "rotate-180")} />
            Show failed test case details
          </button>
          
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3 pl-4 border-l-2 border-white/10"
            >
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Input</p>
                <div className="p-3 rounded-lg bg-[#1a1a1a] border border-white/5 font-mono text-xs text-gray-300">
                  {failedTest.input}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Your Output</p>
                <div className={cn(
                  "p-3 rounded-lg border font-mono text-xs break-all",
                  "bg-red-900/10 border-red-500/20 text-red-200"
                )}>
                  {failedTest.actual || <span className="italic opacity-50">Empty</span>}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Expected</p>
                <div className="p-3 rounded-lg bg-green-900/10 border border-green-500/20 font-mono text-xs text-green-200 break-all">
                  {failedTest.expected}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Error details for RE/CE */}
      {errorDetails && (verdict === 'RE' || verdict === 'CE') && (
        <div className="p-4 rounded-lg bg-red-950/20 border border-red-500/20">
          <p className="text-[10px] text-red-400 uppercase tracking-wider mb-2">Error Details</p>
          <pre className="text-xs text-red-300 font-mono whitespace-pre-wrap overflow-x-auto">
            {errorDetails.rawError}
          </pre>
        </div>
      )}
    </motion.div>
  );
};
