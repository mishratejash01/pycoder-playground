import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Code2, CheckCircle2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { JudgingPhase } from '@/hooks/useEnhancedCodeRunner';

interface JudgingLoaderProps {
  phase: JudgingPhase;
  elapsedMs: number;
}

const encouragingMessages = [
  "Your code is in good hands...",
  "Analyzing your solution...",
  "The Judge is impressed so far...",
  "Running at full speed...",
  "Crunching those numbers...",
  "Almost there, hang tight!",
];

export const JudgingLoader = ({ phase, elapsedMs }: JudgingLoaderProps) => {
  const [encouragement, setEncouragement] = useState(encouragingMessages[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setEncouragement(encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (phase.status === 'idle' || phase.status === 'complete') return null;

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const millis = Math.floor((ms % 1000) / 100);
    return `${seconds}.${millis}s`;
  };

  const getPhaseIcon = () => {
    switch (phase.status) {
      case 'compiling':
        return <Code2 className="w-5 h-5" />;
      case 'running':
        return <Zap className="w-5 h-5" />;
      case 'comparing':
        return <CheckCircle2 className="w-5 h-5" />;
      default:
        return <Loader2 className="w-5 h-5 animate-spin" />;
    }
  };

  const getPhaseColor = () => {
    switch (phase.status) {
      case 'compiling':
        return 'text-blue-400';
      case 'running':
        return 'text-yellow-400';
      case 'comparing':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full py-8 space-y-6">
      {/* Main loader */}
      <div className="relative">
        {/* Outer ring animation */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/20"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Inner loader */}
        <div className={cn(
          "w-16 h-16 rounded-full border-2 border-t-transparent flex items-center justify-center animate-spin",
          phase.status === 'compiling' && "border-blue-500",
          phase.status === 'running' && "border-yellow-500",
          phase.status === 'comparing' && "border-green-500"
        )}>
          <div className={cn("animate-pulse", getPhaseColor())}>
            {getPhaseIcon()}
          </div>
        </div>
      </div>

      {/* Phase indicator */}
      <AnimatePresence mode="wait">
        <motion.div
          key={phase.status}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-center space-y-2"
        >
          <p className={cn("text-sm font-semibold", getPhaseColor())}>
            {phase.status === 'compiling' && 'Compiling'}
            {phase.status === 'running' && `Running Test ${phase.currentTest}/${phase.totalTests}`}
            {phase.status === 'comparing' && 'Comparing Outputs'}
          </p>
          <p className="text-xs text-muted-foreground max-w-xs">
            {phase.message}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Progress bar for running phase */}
      {phase.status === 'running' && (
        <div className="w-48">
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
              initial={{ width: 0 }}
              animate={{ width: `${(phase.currentTest / phase.totalTests) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            {phase.currentTest} of {phase.totalTests} test cases
          </p>
        </div>
      )}

      {/* Elapsed time */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
        <span className="opacity-50">Elapsed:</span>
        <span>{formatTime(elapsedMs)}</span>
      </div>

      {/* Encouraging message */}
      <motion.p
        key={encouragement}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-[11px] text-muted-foreground/50 italic"
      >
        {encouragement}
      </motion.p>
    </div>
  );
};
