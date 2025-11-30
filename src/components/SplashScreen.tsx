import { cn } from "@/lib/utils";

export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center select-none">
      
      {/* Main Logo Container */}
      <div className="relative">
        <h1 className={cn(
          "font-neuropol text-5xl md:text-7xl lg:text-8xl font-bold tracking-wider text-white",
          "animate-cinematic-logo",
          "drop-shadow-[0_0_25px_rgba(255,255,255,0.1)]" // Subtle glow
        )}>
          COD
          <span className="text-[1.2em] lowercase relative top-[2px] mx-[2px] inline-block">é</span>
          VO
        </h1>
      </div>

      {/* Subtitle Container */}
      <div className="mt-6">
        <p className={cn(
          "text-[10px] md:text-xs uppercase tracking-[0.5em] font-medium",
          "animate-light-ray whitespace-nowrap"
        )}>
          A Product of Unknown IITians
        </p>
      </div>

    </div>
  );
}
