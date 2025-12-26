import { cn } from "@/lib/utils";

interface FolderStickerProps {
  active: boolean;
  className?: string;
}

export const FolderSticker = ({ active, className }: FolderStickerProps) => {
  return (
    <div className={cn(
      "relative transition-all duration-300 shrink-0", 
      active ? "scale-110 opacity-100" : "opacity-50 hover:opacity-80",
      className
    )}>
      {/* Sticker Container with multi-layered drop shadows */}
      <div className="filter 
        drop-shadow-[2px_0_0_#e0e0e0] 
        drop-shadow-[-2px_0_0_#e0e0e0] 
        drop-shadow-[0_2px_0_#e0e0e0] 
        drop-shadow-[0_-2px_0_#e0e0e0]
        drop-shadow-[0_0_2px_rgba(255,255,255,0.2)]
        drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
      >
        {/* Increased size for visual hierarchy: 32px x 22px */}
        <div className="relative w-[32px] h-[22px]">
          
          {/* Folder Tab: Positioned exactly at top */}
          <div 
            className="absolute top-[-5px] left-0 w-[19px] h-[6px] bg-[#f39233] border-[1.5px] border-[#2d1d1a] border-b-0 rounded-tl-[3px] rounded-tr-[4px]"
            style={{ clipPath: 'polygon(0 0, 78% 0, 100% 100%, 0 100%)' }}
          />

          {/* Main Folder Body: Top-left is square to align with back tab */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#ffce8c] to-[#f7b65d] border-[1.5px] border-[#2d1d1a] rounded-tr-[4px] rounded-br-[4px] rounded-bl-[4px] overflow-hidden box-border">
            
            {/* Interior orange section */}
            <div className="absolute top-0 left-0 w-full h-[4.5px] bg-[#f39233] border-b-[1.5px] border-[#2d1d1a]" />
            
          </div>
        </div>
      </div>
    </div>
  );
};
