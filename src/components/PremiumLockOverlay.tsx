import { LockKeyhole, ShieldAlert, Fingerprint, ScanEye } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PremiumLockOverlay = () => {
  return (
    <div className="absolute inset-0 z-50 overflow-hidden rounded-xl cursor-not-allowed group/lock select-none">
      {/* 1. Base Glassmorphism Layer (Blur & Darken) */}
      <div className="absolute inset-0 bg-[#050505]/60 backdrop-blur-[6px] transition-all duration-500 group-hover/lock:bg-[#050505]/80 group-hover/lock:backdrop-blur-[8px]" />

      {/* 2. Cinematic Noise Texture (Adds premium grit) */}
      <div className="absolute inset-0 opacity-[0.12] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none" />

      {/* 3. Security Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

      {/* 4. Animated Spotlight/Sheen */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-[150%] skew-x-12 transition-transform duration-1000 ease-in-out group-hover/lock:translate-x-[150%] pointer-events-none" />

      {/* 5. Center Lock Assembly */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-10">
        
        {/* The "Vault" Circle */}
        <div className="relative mb-6 group-hover/lock:scale-110 transition-transform duration-500 ease-out">
          
          {/* Rotating Rings (Purely CSS) */}
          <div className="absolute -inset-4 rounded-full border border-white/5 border-t-white/20 animate-[spin_4s_linear_infinite] opacity-50" />
          <div className="absolute -inset-2 rounded-full border border-white/5 border-b-red-500/20 animate-[spin_3s_linear_infinite_reverse]" />
          
          {/* Main Icon Container */}
          <div className="relative w-16 h-16 rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden group-hover/lock:border-red-500/40 transition-colors duration-300">
            {/* Inner Red Glow on Hover */}
            <div className="absolute inset-0 bg-red-500/0 group-hover/lock:bg-red-500/10 transition-colors duration-300" />
            
            <LockKeyhole className="w-7 h-7 text-gray-400 group-hover/lock:text-red-500 transition-colors duration-300 relative z-10" />
          </div>

          {/* Locked Indicator Dot */}
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#0a0a0a] rounded-full flex items-center justify-center border border-white/10">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Text Stack */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-xl font-bold font-neuropol text-white/90 tracking-widest drop-shadow-lg group-hover/lock:text-red-50 transition-colors">
              LOCKED
            </h3>
          </div>
          
          {/* Tech Spec Line */}
          <div className="flex items-center justify-center gap-3 text-[10px] font-mono text-muted-foreground/60 uppercase tracking-[0.2em]">
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> SECURE
            </span>
            <span className="w-px h-3 bg-white/10" />
            <span>0x84-ENC</span>
          </div>
        </div>

        {/* Hover Action Prompt */}
        <div className="absolute bottom-12 opacity-0 translate-y-4 group-hover/lock:opacity-100 group-hover/lock:translate-y-0 transition-all duration-500 ease-out">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-500/20 bg-red-500/10 backdrop-blur-md shadow-[0_0_20px_rgba(220,38,38,0.1)]">
            <ScanEye className="w-3 h-3 text-red-400" />
            <span className="text-[10px] font-medium text-red-300 tracking-wide uppercase">Prerequisites Required</span>
          </div>
        </div>
      </div>

      {/* 6. Decorative Corner Brackets (Tech UI) */}
      <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-white/10 rounded-tl-sm group-hover/lock:border-white/30 transition-colors" />
      <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-white/10 rounded-tr-sm group-hover/lock:border-white/30 transition-colors" />
      <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-white/10 rounded-bl-sm group-hover/lock:border-white/30 transition-colors" />
      <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-white/10 rounded-br-sm group-hover/lock:border-white/30 transition-colors" />
    </div>
  );
};
