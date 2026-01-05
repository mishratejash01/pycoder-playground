import { motion } from 'framer-motion';
import { CheckCircle2, Zap, Clock, HardDrive, Trophy, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEnhancedCodeRunner } from '@/hooks/useEnhancedCodeRunner';
import { useEffect, useState } from 'react';

interface PerformanceChartProps {
  runtimePercentile: number;
  memoryPercentile: number;
  runtime_ms: number;
  memory_kb: number;
  testsPassed: number;
  testsTotal: number;
}

export const PerformanceChart = ({
  runtimePercentile,
  memoryPercentile,
  runtime_ms,
  memory_kb,
  testsPassed,
  testsTotal
}: PerformanceChartProps) => {
  const { getTierBadge } = useEnhancedCodeRunner();
  const tier = getTierBadge(runtimePercentile);
  // Confetti logic removed as per new "Sprezzatura" design request which uses a subtle shine instead
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[600px] flex flex-col gap-5 font-sans"
    >
      {/* Verification Banner */}
      <div className="relative bg-[#141414] border border-white/[0.08] p-8 rounded-[4px] flex items-center justify-between overflow-hidden group">
        
        {/* Subtle Shine Effect */}
        <div className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/[0.03] to-transparent pointer-events-none animate-[shine_4s_infinite]" />
        
        <style>{`
          @keyframes shine {
            to { left: 150%; }
          }
        `}</style>

        <div className="flex items-center gap-6 z-10">
          <div className="w-[52px] h-[52px] border border-white rounded-full flex items-center justify-center text-white">
            <CheckCircle2 className="w-6 h-6" strokeWidth={2} />
          </div>
          <div>
            <h2 className="font-serif italic text-[22px] text-white mb-1">
              Submission Verified
            </h2>
            <p className="text-[11px] uppercase tracking-[0.15em] text-[#475569]">
              All {testsPassed} Test Cases Cleared
            </p>
          </div>
        </div>

        <div className="text-right z-10">
          <p className="text-[10px] uppercase tracking-[0.1em] text-[#94a3b8] mb-0.5">
            Efficiency Tier
          </p>
          <p className="font-serif font-semibold text-[18px] text-white">
            {tier.tier}
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Time Efficiency Card */}
        <div className="bg-[#1a1a1a] border border-white/[0.08] p-6 rounded-[4px] transition-colors duration-300 hover:border-[#94a3b8]">
          <div className="flex justify-between items-center mb-5">
            <span className="text-[11px] uppercase tracking-[0.1em] text-[#475569] font-medium">
              Time Efficiency
            </span>
            <span className="font-mono text-[13px] text-white">
              {runtime_ms} ms
            </span>
          </div>
          
          {/* Gauge Track */}
          <div className="h-[2px] bg-white/[0.08] w-full relative mb-3">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${runtimePercentile}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              className="absolute top-0 left-0 h-full bg-white"
            />
          </div>
          
          <div className="flex justify-between text-[10px] text-[#475569]">
            <span>Baseline</span>
            <span className="font-serif italic text-[#94a3b8]">
              Ranks in the top {100 - Math.floor(runtimePercentile)}%
            </span>
            <span>Peak</span>
          </div>
        </div>

        {/* Space Efficiency Card */}
        <div className="bg-[#1a1a1a] border border-white/[0.08] p-6 rounded-[4px] transition-colors duration-300 hover:border-[#94a3b8]">
          <div className="flex justify-between items-center mb-5">
            <span className="text-[11px] uppercase tracking-[0.1em] text-[#475569] font-medium">
              Space Efficiency
            </span>
            <span className="font-mono text-[13px] text-white">
              {(memory_kb / 1024).toFixed(1)} MB
            </span>
          </div>
          
          {/* Gauge Track */}
          <div className="h-[2px] bg-white/[0.08] w-full relative mb-3">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${memoryPercentile}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
              className="absolute top-0 left-0 h-full bg-white"
            />
          </div>
          
          <div className="flex justify-between text-[10px] text-[#475569]">
            <span>Baseline</span>
            <span className="font-serif italic text-[#94a3b8]">
              Ranks in the top {100 - Math.floor(memoryPercentile)}%
            </span>
            <span>Peak</span>
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="flex justify-center gap-8 pt-5 border-t border-white/[0.08]">
        <div className="flex items-center gap-2 text-[11px] text-[#475569] uppercase tracking-[0.05em] font-medium">
          <Clock className="w-3 h-3 stroke-[2.5px]" />
          <span>Total Time: <span className="text-[#94a3b8] ml-1">{runtime_ms}ms</span></span>
        </div>
        
        <div className="flex items-center gap-2 text-[11px] text-[#475569] uppercase tracking-[0.05em] font-medium">
          <HardDrive className="w-3 h-3 stroke-[2.5px]" />
          <span>Memory: <span className="text-[#94a3b8] ml-1">{(memory_kb / 1024).toFixed(1)}MB</span></span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-[#475569] uppercase tracking-[0.05em] font-medium">
          <CheckCircle2 className="w-3 h-3 stroke-[2.5px] text-emerald-400" />
          <span className="text-[#f8fafc]">Validation Complete</span>
        </div>
      </div>

    </motion.div>
  );
};
