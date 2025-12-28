import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, MapPin, Calendar, Users, ShieldCheck, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function VerifyRegistration() {
  const { registrationId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (registrationId) fetchVerificationData();
  }, [registrationId]);

  async function fetchVerificationData() {
    try {
      // 1. Fetch Registration and Event Data
      const { data: reg, error: regError } = await supabase
        .from('event_registrations')
        .select(`
          *,
          events (*)
        `)
        .eq('id', registrationId)
        .single();

      if (regError || !reg) throw new Error("Registry record not found");

      // 2. Fetch Team Members if it's a Team registration
      let teamMembers = [];
      if (reg.participation_type === 'Team' && reg.team_name) {
        const { data: members } = await supabase.rpc('get_event_team_members', {
          p_event_id: reg.event_id,
          p_team_name: reg.team_name
        });
        teamMembers = members || [];
      }

      setData({ ...reg, teamMembers });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin h-10 w-10 text-[#00ff88]" />
      <span className="text-[10px] uppercase tracking-[4px] text-[#777777]">Validating Credential</span>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-serif mb-4">Invalid Credential</h1>
      <p className="text-[#777777] mb-8">This registration record could not be verified or does not exist.</p>
      <Button onClick={() => navigate('/')} variant="outline" className="border-[#1a1a1a]">Return Home</Button>
    </div>
  );

  const event = data.events;

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6 md:p-10 flex flex-col items-center">
      <div className="w-full max-w-[500px] space-y-8">
        
        {/* Verification Status Header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full border border-[#00ff88] flex items-center justify-center text-[#00ff88] bg-[#00ff88]/10">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-serif uppercase tracking-tight">Access Granted</h1>
            <p className="text-[10px] text-[#777777] uppercase tracking-[2px]">Registry Verified • Studio.Dei</p>
          </div>
        </div>

        {/* The Digital Pass Card */}
        <div className="relative border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden">
          {/* Top Design Element */}
          <div className="h-2 bg-[#00ff88]" />
          
          <div className="p-8 space-y-8">
            {/* Participant Info */}
            <div className="flex items-center gap-5">
              <Avatar className="h-16 w-16 border border-[#1a1a1a]">
                <AvatarImage src={data.avatar_url} />
                <AvatarFallback className="bg-[#1a1a1a] text-xl">{data.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h2 className="text-xl font-medium leading-none">{data.full_name}</h2>
                <p className="text-[11px] text-[#777777] uppercase tracking-wider">{data.email}</p>
                <Badge className="bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20 text-[9px] uppercase">
                  {data.current_status}
                </Badge>
              </div>
            </div>

            {/* Event Info */}
            <div className="space-y-4 border-t border-b border-[#1a1a1a] py-6">
              <div className="space-y-1">
                <span className="text-[9px] text-[#777777] uppercase tracking-[2px]">Event</span>
                <h3 className="text-lg font-serif text-[#ff8c00]">{event.title}</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[#777777]">
                    <Calendar className="w-3 h-3" />
                    <span className="text-[9px] uppercase tracking-wider">Date</span>
                  </div>
                  <p className="text-xs">{format(new Date(event.start_date), 'MMM dd, yyyy')}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[#777777]">
                    <MapPin className="w-3 h-3" />
                    <span className="text-[9px] uppercase tracking-wider">Venue</span>
                  </div>
                  <p className="text-xs truncate">{event.venue || 'Digital Hub'}</p>
                </div>
              </div>
            </div>

            {/* Team/Participation Info */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-[9px] text-[#777777] uppercase tracking-[2px]">Entry Type</span>
                  <p className="text-sm">{data.participation_type || 'Solo'}</p>
                </div>
                {data.team_name && (
                   <div className="text-right space-y-1">
                     <span className="text-[9px] text-[#777777] uppercase tracking-[2px]">Squad</span>
                     <p className="text-sm font-serif">{data.team_name}</p>
                   </div>
                )}
              </div>

              {data.teamMembers?.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="text-[9px] text-[#777777] uppercase tracking-[2px]">Squad Roster</span>
                  <div className="flex flex-wrap gap-2">
                    {data.teamMembers.map((m: any) => (
                      <Badge key={m.id} variant="outline" className="border-[#1a1a1a] text-[10px] font-normal bg-[#050505]">
                        {m.full_name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Footer Section */}
          <div className="bg-[#0d0d0d] p-6 border-t border-[#1a1a1a] flex justify-between items-center">
            <div className="space-y-1">
              <span className="text-[8px] text-[#555] uppercase tracking-widest">Registry ID</span>
              <p className="text-[10px] font-mono text-[#777]">{registrationId.toUpperCase()}</p>
            </div>
            <div className="text-right">
               <span className="text-[8px] text-[#555] uppercase tracking-widest">Payment</span>
               <p className={cn(
                 "text-[10px] font-bold uppercase tracking-wider",
                 data.payment_status === 'completed' ? "text-[#00ff88]" : "text-yellow-500"
               )}>
                 {data.payment_status || 'FREE'}
               </p>
            </div>
          </div>
        </div>

        <Button onClick={() => window.print()} className="w-full bg-white text-black font-bold uppercase tracking-[3px] rounded-none hover:bg-[#00ff88] transition-colors h-14">
          Save as PDF
        </Button>
      </div>
    </div>
  );
}
