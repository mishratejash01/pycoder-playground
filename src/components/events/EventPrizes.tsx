import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Medal, Award, Gift, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Prize {
  id: string;
  position: number;
  title: string;
  prize_value: string | null;
  description: string | null;
  icon_url: string | null;
}

interface EventPrizesProps {
  eventId: string;
  prizePool?: string | null;
}

const positionIcons = [
  { icon: Trophy, label: 'LAUREL 01' },
  { icon: Medal, label: 'LAUREL 02' },
  { icon: Award, label: 'LAUREL 03' },
];

export function EventPrizes({ eventId, prizePool }: EventPrizesProps) {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrizes();
  }, [eventId]);

  async function fetchPrizes() {
    const { data, error } = await supabase
      .from('event_prizes')
      .select('*')
      .eq('event_id', eventId)
      .order('position', { ascending: true });

    if (!error && data) {
      setPrizes(data);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-6 w-6 text-[#ff8c00]" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[850px] mx-auto font-sans selection:bg-orange-500/30">
      
      {/* --- Section Header --- */}
      <div className="flex items-center gap-[15px] mb-[50px]">
        <div className="w-[2px] h-[24px] bg-[#ff8c00]" />
        <h3 className="font-serif text-[2.2rem] font-normal tracking-[-0.5px] text-white">
          Rewards & Laurels
        </h3>
      </div>

      {/* --- Total Prize Pool (Stakes) --- */}
      {prizePool && (
        <div className="bg-[#050505] border border-[#1a1a1a] py-[60px] px-[40px] text-center mb-[30px] relative overflow-hidden group">
          <label className="block text-[0.7rem] uppercase tracking-[4px] text-[#666666] mb-[20px] font-bold">
            Total Combined Stakes
          </label>
          <div className="font-serif text-[2.5rem] md:text-[4rem] font-bold text-white leading-none transition-transform duration-500 group-hover:scale-105">
            {prizePool}
          </div>
          {/* Subtle accent light */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-[#ff8c00]/30 to-transparent" />
        </div>
      )}

      {/* --- Prize Breakdown Grid --- */}
      {prizes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[20px]">
          {prizes.map((prize, index) => {
            const styling = positionIcons[index] || { 
              icon: Gift, 
              label: `LAUREL ${String(prize.position).padStart(2, '0')}` 
            };
            const Icon = styling.icon;

            return (
              <div
                key={prize.id}
                className="bg-[#050505] border border-[#1a1a1a] p-[40px_30px] text-center transition-all duration-300 hover:border-[#666666] group"
              >
                <span className="block text-[0.7rem] text-[#ff8c00] tracking-[2px] mb-[25px] font-semibold">
                  {styling.label}
                </span>

                <div className="flex justify-center mb-[20px] text-[#e0e0e0] group-hover:text-white transition-colors">
                  <Icon size={32} strokeWidth={1.5} />
                </div>

                <h4 className="font-serif text-[1.4rem] font-normal text-white mb-[10px]">
                  {prize.title}
                </h4>

                {prize.prize_value && (
                  <div className="text-[1.2rem] font-light text-[#e0e0e0] mb-[15px]">
                    {prize.prize_value}
                  </div>
                )}

                {prize.description && (
                  <p className="text-[0.8rem] text-[#666666] leading-[1.5] font-light">
                    {prize.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        !prizePool && (
          <div className="py-[100px] text-center border border-dashed border-[#1a1a1a] bg-[#050505]/50">
             <Gift className="w-8 h-8 text-[#1a1a1a] mx-auto mb-4" />
             <p className="text-[0.8rem] text-[#666666] uppercase tracking-[2px] font-bold">
               Bounties Pending
             </p>
             <p className="text-[#333] text-sm mt-2">Prize protocols will be initiated soon.</p>
          </div>
        )
      )}

      {/* --- Footer Swag Info --- */}
      {(prizes.length > 0 || prizePool) && (
        <div className="mt-[30px] p-[25px] border border-dashed border-[#1a1a1a] text-center text-[0.85rem] text-[#666666] font-light tracking-[0.5px]">
          Special recognition, physical swag kits, and digital credentials provided to all verified participants.
        </div>
      )}
    </div>
  );
}
