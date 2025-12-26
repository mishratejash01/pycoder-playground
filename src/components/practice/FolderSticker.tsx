import { cn } from "@/lib/utils";

interface FolderStickerProps {
  active: boolean;
  className?: string;
}

export const FolderSticker = ({ active, className }: FolderStickerProps) => {
  return (
    <div className={cn(
      "relative transition-all duration-300 shrink-0", 
      active ? "scale-110 opacity-100" : "opacity-40 hover:opacity-70",
      className
    )}>
      {/* Sticker Border: Multi-layered shadows for the off-white edge */}
      <div className="filter 
        drop-shadow-[2px_0_0_#e0e0e0] 
        drop-shadow-[-2px_0_0_#e0e0e0] 
        drop-shadow-[0_2px_0_#e0e0e0] 
        drop-shadow-[0_-2px_0_#e0e0e0]
        drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
        
        <div className="relative h-[18px] w-[26px]">
          {/* Folder Tab (The Back Section)
              Using the precise polygon(0 0, 78% 0, 100% 100%, 0 100%) 
          */}
          <div 
            className="absolute -top-[4px] left-0 h-[6px] w-[16px] 
                       bg-[#f39233] border-[1.5px] border-b-0 border-[#2d1d1a] 
                       rounded-t-[3px]
                       [clip-path:polygon(0_0,78%_0,100%_100%,0_100%)]"
          />

          {/* Folder Body (The Front Section)
              Body Top-Left must be 0 radius to align with the tab 
          */}
          <div className="absolute inset-0 overflow-hidden 
                          rounded-tr-[4px] rounded-br-[4px] rounded-bl-[4px] rounded-tl-0
                          border-[1.5px] border-[#2d1d1a] 
                          bg-[linear-gradient(160deg,#ffce8c_0%,#f7b65d_100%)]">
            
            {/* Interior Section: Perfectly centered horizontal bar */}
            <div className="absolute top-0 left-0 h-[4.5px] w-full border-b-[1.5px] border-[#2d1d1a] bg-[#f39233]" />
          </div>
        </div>
      </div>
    </div>
  );
};
