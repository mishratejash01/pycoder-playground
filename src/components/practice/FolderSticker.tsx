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
      {/* The Sticker Border Effect: 
        Using multiple drop-shadows to recreate the off-white sticker edge 
      */}
      <div className="filter 
        drop-shadow-[1.5px_0_0_#e0e0e0] 
        drop-shadow-[-1.5px_0_0_#e0e0e0] 
        drop-shadow-[0_1.5px_0_#e0e0e0] 
        drop-shadow-[0_-1.5px_0_#e0e0e0]
        drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
        
        <div className="relative h-[16px] w-[22px]">
          {/* Folder Tab:
            Matches: border-radius: 12px 18px 0 0 and clip-path polygon
          */}
          <div 
            className="absolute -top-[3.5px] left-0 h-[5px] w-[14px] 
                       bg-[#f39233] border-[1px] border-b-0 border-[#2d1d1a] 
                       rounded-t-[3px]
                       [clip-path:polygon(0_0,78%_0,100%_100%,0_100%)]"
          />

          {/* Folder Body:
            Matches: border-radius: 0 14px 14px 14px (No top-left radius)
          */}
          <div className="absolute inset-0 overflow-hidden 
                          rounded-tr-[3px] rounded-br-[3px] rounded-bl-[3px] 
                          border-[1px] border-[#2d1d1a] 
                          bg-[linear-gradient(160deg,#ffce8c_0%,#f7b65d_100%)]">
            
            {/* Interior orange section (height matching your 20px/100px ratio) */}
            <div className="absolute top-0 left-0 h-[3.5px] w-full border-b-[1px] border-[#2d1d1a] bg-[#f39233]" />
          </div>
        </div>
      </div>
    </div>
  );
};
