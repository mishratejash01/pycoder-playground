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
  "System analyzing approach...",
  "Verifying logic protocols...",
  "Calculating performance metrics...",
  "Executing operational sequences...",
  "Standby for verification...",
  "Optimizing parameters..."
];

export const JudgingLoader = ({ phase, elapsedMs }: JudgingLoaderProps) => {
  const [encouragement, setEncouragement] = useState(encouragingMessages[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setEncouragement(encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (phase.status === 'idle' || phase.status === 'complete') return null;

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000).toString().padStart(2, '0');
    const millis = Math.floor((ms % 1000) / 100);
    return `${seconds}.${millis}s`;
  };

  const getPhaseIcon = () => {
    switch (phase.status) {
      case 'compiling':
        return <Code2 className="w-5 h-5" />;
      case 'running':
        return <Zap className="w-5 h-5 fill-current" />;
      case 'comparing':
        return <CheckCircle2 className="w-5 h-5" />;
      default:
        return <Loader2 className="w-5 h-5 animate-spin" />;
    }
  };

  const getPhaseTitle = () => {
    switch (phase.status) {
      case 'compiling': return 'Compiling Source';
      case 'running': return 'Execution in Progress';
      case 'comparing': return 'Verifying Outputs';
      default: return 'Initializing';
    }
  };

  const getPhaseDetail = () => {
    if (phase.status === 'running') {
      return `Procedure ${phase.currentTest} of ${phase.totalTests}`;
    }
    return phase.message || 'Processing...';
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4 font-sans bg-[#0c0c0c]">
      {/* Responsive Card Container: Fits parent space but caps at max-md (approx 450px) */}
      <div className="w-full max-w-md bg-[#141414] border border-white/[0.08] rounded-lg p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
        
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/10 blur-[20px]" />

        {/* Visual Loader Ring */}
        <div className="relative w-16 h-16 mb-8 shrink-0">
          {/* Spinner Ring */}
          <motion.div 
            className="absolute inset-0 border border-white/[0.08] border-t-white rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1], repeat: Infinity }}
          />
          
          {/* Center Icon */}
          <div className="absolute inset-0 flex items-center justify-center text-[#94a3b8]">
            <motion.div 
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              {getPhaseIcon()}
            </motion.div>
          </div>
        </div>

        {/* Current Status */}
        <div className="mb-6 space-y-2">
          <h2 className="font-serif italic text-lg text-[#f8fafc]">
            {getPhaseTitle()}
          </h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#94a3b8] font-medium">
            {getPhaseDetail()}
          </p>
        </div>

        {/* Minimal Progress Line */}
        <div className="w-full max-w-[200px] mb-6">
          <div className="w-full h-[1px] bg-white/[0.08] relative overflow-hidden">
            {phase.status === 'running' ? (
              <motion.div 
                className="absolute inset-y-0 left-0 bg-white"
                initial={{ width: 0 }}
                animate={{ width: `${(phase.currentTest / phase.totalTests) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            ) : (
              <motion.div 
                className="absolute inset-y-0 left-0 bg-white w-1/2"
                animate={{ x: [-200, 200] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            )}
          </div>
          <p className="mt-2 text-[9px] uppercase tracking-[0.1em] text-[#475569]">
            Active Testing
          </p>
        </div>

        {/* Chronometer */}
        <div className="mb-6">
          <span className="block text-[8px] uppercase text-[#475569] mb-1 tracking-widest">Elapsed</span>
          <div className="inline-block px-3 py-1 border border-white/[0.08] rounded-[2px] bg-white/[0.02] font-mono text-xs text-[#94a3b8]">
            {formatTime(elapsedMs)}
          </div>
        </div>

        {/* Formal Encouragement */}
        <AnimatePresence mode="wait">
          <motion.p
            key={encouragement}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="font-serif italic text-xs text-[#475569] max-w-[260px] leading-relaxed min-h-[1.5em]"
          >
            {encouragement}
          </motion.p>
        </AnimatePresence>

      </div>
    </div>
  );
};
