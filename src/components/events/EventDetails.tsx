import { Calendar, MapPin, Users, Eye, Mail, Phone, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface EventDetailsContentProps {
  event: {
    content: string | null;
    short_description: string;
    rules: string | null;
    venue: string | null;
    location: string | null;
    mode: string;
    organizer_name: string | null;
    organizer_logo: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    current_participants: number | null;
    max_participants: number | null;
    start_date: string;
  };
}

export function EventDetailsContent({ event }: EventDetailsContentProps) {
  return (
    <div className="w-full max-w-[850px] mx-auto font-sans selection:bg-orange-500/30">
      
      {/* --- About Section --- */}
      <div className="flex items-center gap-[15px] mb-[30px]">
        <div className="w-[2px] h-[20px] bg-[#ff8c00]" />
        <h3 className="font-serif text-[1.8rem] font-normal tracking-[-0.5px] text-white">
          About the Assembly
        </h3>
      </div>
      
      <div className="bg-[#050505] border border-[#1a1a1a] p-[40px] leading-[1.8] font-light text-[#e0e0e0] text-[1rem] whitespace-pre-wrap mb-[40px]">
        {event.content || event.short_description}
      </div>

      {/* --- Stats Dashboard Grid --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-[#1a1a1a] border border-[#1a1a1a] my-[40px] overflow-hidden">
        {/* Participants */}
        <div className="bg-black py-[30px] px-[20px] text-center">
          <span className="block text-[0.6rem] uppercase tracking-[2px] text-[#777777] mb-[15px]">Participants</span>
          <div className="text-[1.4rem] font-extralight text-white">
            {event.current_participants || 0}
          </div>
        </div>

        {/* Capacity */}
        <div className="bg-black py-[30px] px-[20px] text-center">
          <span className="block text-[0.6rem] uppercase tracking-[2px] text-[#777777] mb-[15px]">Capacity</span>
          <div className="text-[1.4rem] font-extralight text-white">
            {event.max_participants || 'Unlimited'}
          </div>
        </div>

        {/* Mode */}
        <div className="bg-black py-[30px] px-[20px] text-center">
          <span className="block text-[0.6rem] uppercase tracking-[2px] text-[#777777] mb-[15px]">Mode</span>
          <div className="text-[1rem] tracking-[1px] uppercase font-extralight text-white">
            {event.mode}
          </div>
        </div>

        {/* Start Date */}
        <div className="bg-black py-[30px] px-[20px] text-center">
          <span className="block text-[0.6rem] uppercase tracking-[2px] text-[#777777] mb-[15px]">Start Date</span>
          <div className="text-[1rem] tracking-[1px] uppercase font-extralight text-white">
            {format(new Date(event.start_date), 'MMM dd')}
          </div>
        </div>
      </div>

      {/* --- Rules Section --- */}
      {event.rules && (
        <>
          <div className="flex items-center gap-[15px] mb-[30px] mt-[60px]">
            <div className="w-[2px] h-[20px] bg-[#ff8c00]" />
            <h3 className="font-serif text-[1.8rem] font-normal tracking-[-0.5px] text-white">
              Protocol & Rules
            </h3>
          </div>
          <div className="bg-[#050505] border border-[#1a1a1a] border-l-2 p-[40px] leading-[1.8] font-light text-[#777777] text-[0.95rem] whitespace-pre-wrap mb-[40px]">
            {event.rules}
          </div>
        </>
      )}

      {/* --- Organizer & Venue Manifest --- */}
      {(event.organizer_name || event.venue) && (
        <div className="border border-[#1a1a1a] mt-[40px] divide-y divide-[#1a1a1a]">
          
          {/* Row: Authorized Organizer */}
          {event.organizer_name && (
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr]">
              <div className="bg-[#080808] p-[25px] text-[0.65rem] uppercase tracking-[2px] text-[#777777] border-b md:border-b-0 md:border-r border-[#1a1a1a] flex items-center">
                Authorized Organizer
              </div>
              <div className="p-[25px] flex items-center gap-[20px]">
                {event.organizer_logo && (
                  <img 
                    src={event.organizer_logo} 
                    alt={event.organizer_name}
                    className="w-[50px] h-[50px] grayscale contrast-[1.2] border border-[#1a1a1a] object-cover"
                  />
                )}
                <div>
                  <div className="font-medium text-[1rem] text-white">{event.organizer_name}</div>
                  {event.contact_email && (
                    <a href={`mailto:${event.contact_email}`} className="text-[#ff8c00] text-[0.85rem] mt-[4px] block hover:underline">
                      {event.contact_email}
                    </a>
                  )}
                  {event.contact_phone && (
                    <div className="text-[#777777] text-[0.8rem] mt-1">{event.contact_phone}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Row: Assembly Venue */}
          {event.venue && (
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr]">
              <div className="bg-[#080808] p-[25px] text-[0.65rem] uppercase tracking-[2px] text-[#777777] border-b md:border-b-0 md:border-r border-[#1a1a1a] flex items-center">
                Assembly Venue
              </div>
              <div className="p-[25px] flex items-center">
                <div>
                  <div className="font-medium text-[1rem] text-white">{event.venue}</div>
                  {(event.location || event.mode) && (
                    <div className="text-[#777777] text-[0.85rem] mt-[4px]">
                      {event.location || event.mode}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
