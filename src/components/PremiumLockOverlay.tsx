import { LockKeyhole } from 'lucide-react';

export const PremiumLockOverlay = () => {
  return (
    <div className="absolute inset-0 z-50 rounded-xl overflow-hidden cursor-not-allowed group/lock select-none">
      
      {/* Background: Simple dark overlay (No Blur) */}
      <div className="absolute inset-0 bg-black/60 transition-colors duration-300 group-hover/lock:bg-black/70" />

      {/* Lock Icon: Positioned Top-Right, Red */}
      <div className="absolute top-4 right-4 z-10 transition-transform duration-300 group-hover/lock:scale-105">
        <div className="p-2 rounded-full bg-red-500/10 border border-red-500/20 shadow-sm">
          <LockKeyhole className="w-5 h-5 text-red-500" />
        </div>
      </div>

      {/* Subtle Red Border on Hover */}
      <div className="absolute inset-0 rounded-xl border border-transparent group-hover/lock:border-red-500/20 transition-colors duration-300 pointer-events-none" />
      
    </div>
  );
};
