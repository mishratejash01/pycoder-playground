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
      {/* Sticker Container with multi-layered drop shadows for the white border */}
      <div className="filter 
        drop-shadow-[1.5px_0_0_#e0e0e0] 
        drop-shadow-[-1.5px_0_0_#e0e0e0] 
        drop-shadow-[0_1.5px_0_#e0e0e0] 
        drop-shadow-[0_-1.5px_0_#e0e0e0]
        drop-shadow-[0_0_1px_rgba(255,255,255,0.2)]
        drop-shadow-[0_3px_5px_rgba(0,0,0,0.5)]"
      >
        {/* Scaled container based on your 140x100 original */}
        <div className="relative w-[26px] h-[18px]">
          
          {/* Folder Tab: Positioned exactly at top: [-22px original -> -4px scaled] */}
          <div 
            className="absolute top-[-4px] left-0 w-[16px] h-[5px] bg-[#f39233] border-[1px] border-[#2d1d1a] border-b-0 rounded-tl-[2px] rounded-tr-[3px]"
            style={{ clipPath: 'polygon(0 0, 78% 0, 100% 100%, 0 100%)' }}
          />

          {/* Main Folder Body: No top-left rounding to ensure proper alignment with the tab */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#ffce8c] to-[#f7b65d] border-[1px] border-[#2d1d1a] rounded-tr-[3px] rounded-br-[3px] rounded-bl-[3px] overflow-hidden box-border">
            
            {/* Interior orange section: Perfectly aligned at the top of the body */}
            <div className="absolute top-0 left-0 w-full h-[3.5px] bg-[#f39233] border-b-[1px] border-[#2d1d1a]" />
            
          </div>
        </div>
      </div>
    </div>
  );
};
