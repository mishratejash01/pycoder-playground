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
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      {/* Success Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 border border-green-500/30 p-6">
        {/* Confetti effect */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'][Math.floor(Math.random() * 5)]
                }}
                initial={{ y: -10, opacity: 1 }}
                animate={{ y: 200, opacity: 0, rotate: 360 }}
                transition={{ duration: 2 + Math.random(), delay: Math.random() * 0.5 }}
              />
            ))}
          </div>
        )}

        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center"
          >
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </motion.div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-green-400">Accepted</h2>
            <p className="text-sm text-gray-400">{testsPassed}/{testsTotal} test cases passed</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{tier.emoji}</p>
            <p className="text-xs text-muted-foreground">{tier.tier}</p>
          </div>
        </div>

        {/* Tier message */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-sm text-gray-300"
        >
          {tier.message}
        </motion.p>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-2 gap-4">
        {/* Runtime Chart */}
        <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-xs font-medium text-gray-400">Runtime</span>
            </div>
            <span className="text-xs font-mono text-white">{runtime_ms} ms</span>
          </div>
          
          {/* Percentile bar */}
          <div className="space-y-1">
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${runtimePercentile}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0%</span>
              <span className="font-medium text-yellow-400">Beats {runtimePercentile}%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Distribution hint */}
          <p className="text-[10px] text-muted-foreground">
            Where you stand in the Arena
          </p>
        </div>

        {/* Memory Chart */}
        <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-gray-400">Memory</span>
            </div>
            <span className="text-xs font-mono text-white">{(memory_kb / 1024).toFixed(1)} MB</span>
          </div>
          
          {/* Percentile bar */}
          <div className="space-y-1">
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${memoryPercentile}%` }}
                transition={{ duration: 1, delay: 0.7 }}
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0%</span>
              <span className="font-medium text-blue-400">Beats {memoryPercentile}%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Distribution hint */}
          <p className="text-[10px] text-muted-foreground">
            Memory efficiency ranking
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>{runtime_ms}ms runtime</span>
        </div>
        <div className="flex items-center gap-1.5">
          <HardDrive className="w-3.5 h-3.5" />
          <span>{(memory_kb / 1024).toFixed(1)}MB memory</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-green-500" />
          <span className="text-green-400">All tests passed</span>
        </div>
      </div>
    </motion.div>
  );
};
