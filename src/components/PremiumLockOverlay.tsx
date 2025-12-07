import { Lock } from 'lucide-react';

export const PremiumLockOverlay = () => {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1a1a1c] border border-white/10 select-none shadow-sm">
      <Lock className="w-3 h-3 text-gray-400" />
      <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">
        Locked
      </span>
    </div>
  );
};
