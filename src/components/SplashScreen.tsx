import { cn } from "@/lib/utils";
import LoadingSpinner from "./ui/snow-ball-loading-spinner";

export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center select-none overflow-hidden">
      
      {/* Snow Ball Spinner */}
      <div className="mb-12 scale-150 transform">
        <LoadingSpinner />
      </div>

      {/* Main Logo Container */}
      <div className="relative animate-pulse">
        <h1 className={cn(
          "font-neuropol text-4xl md:text-6xl font-bold tracking-wider text-white",
          "animate-curtain-reveal"
        )}>
          COD
          {/* The accented é styled exactly like the navbar */}
          <span className="text-[1.2em] lowercase relative top-[2px] mx-[2px] inline-block text-primary">é</span>
          VO
        </h1>
      </div>

      {/* Subtitle Container */}
      <div className="mt-6 opacity-0 animate-fade-in delay-500 fill-mode-forwards">
        <p className={cn(
          "text-[10px] md:text-xs uppercase tracking-[0.5em] font-medium text-muted-foreground",
        )}>
          Where Visionaries Build the Future
        </p>
      </div>

    </div>
  );
}
