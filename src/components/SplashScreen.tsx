import { cn } from "@/lib/utils";

export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center select-none">
      
      {/* Main Logo Container */}
      <div className="relative">
        <h1 className={cn(
          "font-neuropol text-5xl md:text-7xl lg:text-8xl font-bold tracking-wider text-white",
          "animate-curtain-reveal" // New premium curtain animation
        )}>
          COD
          <span className="text-[1.2em] lowercase relative top-[2px] mx-[2px] inline-block">é</span>
          VO
        </h1>
      </div>

      {/* Subtitle Container */}
      <div className="mt-8"> {/* Increased margin for better spacing */}
        <p className={cn(
          "text-[10px] md:text-xs uppercase tracking-[0.5em] font-medium",
          "animate-light-ray whitespace-nowrap"
        )}>
          Where Visionaries Build the Future.
        </p>
      </div>

    </div>
  );
}
