import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, ShieldCheck, ShieldAlert, 
  Calendar, MapPin, Clock, CheckCircle2, XCircle,
  QrCode
} from 'lucide-react';
import { format, isBefore, parseISO } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';

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
      const { data: reg, error: regError } = await supabase
        .from('event_registrations')
        .select(`
          *,
          events (*)
        `)
        .eq('id', registrationId)
        .single();

      if (regError || !reg) throw new Error("Registry record not found");

      setData(reg);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin h-10 w-10 text-[#00ff88]" />
      <span className="text-[10px] uppercase tracking-[4px] text-[#777777]">Validating Registry</span>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <ShieldAlert className="w-16 h-16 text-red-500 mb-6" />
      <h1 className="text-2xl font-serif mb-4">Registry Error</h1>
      <p className="text-[#777777] mb-8">This credential could not be found in the Studio.Dei manifest.</p>
      <Button onClick={() => navigate('/')} variant="outline" className="border-[#1a1a1a]">Return Home</Button>
    </div>
  );

  const event = data.events;
  const now = new Date();
  const eventEndTime = event.end_date ? parseISO(event.end_date) : null;
  
  // LOGIC: Verified if confirmed. Valid if current time is before event end time.
  const isVerified = data.current_status === 'confirmed' || data.current_status === 'completed';
  const isValid = eventEndTime ? isBefore(now, eventEndTime) : true;

  return (
    <div className="min-h-screen bg-black text-white font-sans p-4 md:p-10 flex flex-col items-center">
      <div className="w-full max-w-[450px] space-y-6">
        
        {/* Pass Validity Banner */}
        <div className={cn(
          "w-full p-5 border flex items-center gap-4 transition-colors duration-500",
          isValid && isVerified 
            ? "bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]" 
            : "bg-red-500/10 border-red-500/30 text-red-500"
        )}>
          {isValid && isVerified ? (
            <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
          ) : (
            <XCircle className="w-6 h-6 stroke-[2.5]" />
          )}
          <div className="flex-1">
            <h4 className="text-xs font-bold uppercase tracking-[2px]">
              {isValid && isVerified ? 'Manifest: Valid' : 'Manifest: Invalid/Expired'}
            </h4>
            <p className="text-[10px] opacity-70 uppercase tracking-wider">
              Verification Time: {format(now, 'HH:mm:ss')}
            </p>
          </div>
          <Badge className={cn(
            "text-[10px] font-bold rounded-none border-none px-3 py-1",
            isValid && isVerified ? "bg-[#00ff88] text-black" : "bg-red-500 text-white"
          )}>
            {isValid ? 'ACTIVE' : 'EXPIRED'}
          </Badge>
        </div>

        {/* Digital Pass Card */}
        <div className="relative border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className={cn("h-1.5 w-full", isValid ? "bg-[#00ff88]" : "bg-red-500")} />
          
          <div className="p-6 md:p-10 space-y-8">
            <header className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[9px] text-[#777777] uppercase tracking-[3px]">Digital Credentials</span>
                <h2 className="text-2xl font-serif text-white tracking-tight">{event.title}</h2>
              </div>
              <QrCode className="w-5 h-5 text-[#777777]" />
            </header>

            {/* Participant Section */}
            <div className="flex items-center gap-5 py-6 border-y border-[#1a1a1a]">
              <Avatar className="h-16 w-16 border border-[#1a1a1a]">
                <AvatarImage src={data.avatar_url} />
                <AvatarFallback className="bg-[#1a1a1a] text-xl font-serif text-[#777777]">
                  {data.full_name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-white">{data.full_name}</h3>
                <p className="text-[10px] text-[#777777] uppercase tracking-widest">{data.participation_type} Entry</p>
                {data.team_name && (
                  <p className="text-[10px] text-[#ff8c00] uppercase tracking-[2px] mt-1">Squad: {data.team_name}</p>
                )}
              </div>
            </div>

            {/* Event Logistics */}
            <div className="grid grid-cols-2 gap-y-8">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[#777777]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-[9px] uppercase tracking-widest">Event Date</span>
                </div>
                <p className="text-xs text-white font-medium">{format(parseISO(event.start_date), 'MMMM dd, yyyy')}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[#777777]">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-[9px] uppercase tracking-widest">Location</span>
                </div>
                <p className="text-xs text-white font-medium truncate">{event.location || 'Online Hub'}</p>
              </div>
            </div>

            {/* QR CODE REDUNDANCY CHECK */}
            <div className="pt-8 border-t border-[#1a1a1a] flex flex-col items-center">
              <div className="bg-white p-4 inline-block shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                <QRCodeSVG 
                  value={window.location.href} 
                  size={140}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <p className="mt-4 text-[9px] font-mono tracking-[4px] text-[#777777] uppercase text-center">
                Registry ID: {data.id.slice(0, 18)}...
              </p>
            </div>
          </div>
          
          <footer className="bg-[#0d0d0d] p-5 flex justify-between items-center border-t border-[#1a1a1a]">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className={cn("w-4 h-4", isVerified ? "text-[#00ff88]" : "text-[#777777]")} />
              <span className="text-[9px] uppercase tracking-[2px] text-[#777777]">Studio.Dei Verified</span>
            </div>
            <img 
              src="https://upload.wikimedia.org/wikipedia/en/thumb/6/69/IIT_Madras_Logo.svg/1200px-IIT_Madras_Logo.svg.png" 
              className="h-6 opacity-40 grayscale" 
              alt="Logo"
            />
          </footer>
        </div>

        <Button 
          onClick={() => window.print()} 
          className="w-full bg-white text-black font-bold uppercase tracking-[4px] rounded-none hover:bg-[#00ff88] transition-all h-14 text-[11px]"
        >
          Dispatch Digital Pass
        </Button>
      </div>
    </div>
  );
}
