import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Html5Qrcode, Html5QrcodeScanType } from 'html5-qrcode';
import { ShieldCheck, Loader2, XCircle, Scan, Camera, Building, Mail, Users, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AdminScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [guestData, setGuestData] = useState<any>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [alreadyScanned, setAlreadyScanned] = useState(false);
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    html5QrCodeRef.current = new Html5Qrcode("reader");
    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanner = async () => {
    if (!html5QrCodeRef.current) return;
    try {
      setIsScanning(true);
      resetState();
      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 280, height: 280 }, aspectRatio: 1.0 },
        onScanSuccess,
        () => {} 
      );
    } catch (err) {
      toast.error("Camera access denied");
      setIsScanning(false);
    }
  };

  const resetState = () => {
    setGuestData(null);
    setErrorStatus(null);
    setVerifying(false);
    setAlreadyScanned(false);
  };

  const onScanSuccess = async (decodedText: string) => {
    if (html5QrCodeRef.current?.isScanning) {
      html5QrCodeRef.current.pause(true); 
    }

    setVerifying(true);
    const cleanId = decodedText.trim().toLowerCase();

    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`id, full_name, email, college_org_name, current_status, status, participation_type, team_name, is_attended`)
        .eq('id', cleanId)
        .single();

      if (error || !data) throw new Error("Invalid Pass: Record not found");

      if (data.is_attended) {
        setGuestData(data);
        setAlreadyScanned(true);
        toast.warning("Security Alert: User Already Checked In");
      } else {
        const { error: updateError } = await supabase
          .from('event_registrations')
          .update({ 
            is_attended: true,
            attended_at: new Date().toISOString(),
            updated_at: new Date().toISOString() 
          })
          .eq('id', data.id);

        if (updateError) throw updateError;
        setGuestData(data);
        setAlreadyScanned(false);
        toast.success(`Access Granted: ${data.full_name}`);
      }
    } catch (err: any) {
      setErrorStatus(err.message);
      toast.error(err.message);
    } finally {
      setVerifying(false);
      setTimeout(() => {
        resetState();
        if (html5QrCodeRef.current) html5QrCodeRef.current.resume();
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col items-center p-6 text-[#FAFAFA]">
      <style>{`@keyframes scanline { 0%, 100% { top: 0%; } 50% { top: 100%; } } #reader video { object-fit: cover !important; border-radius: 20px; }`}</style>
      <div className="w-full max-w-[420px] flex flex-col gap-6">
        <header className="pl-1">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#3B82F6]" /> Entry Terminal
          </h1>
          <p className="text-[12px] text-[#A1A1AA] mt-1">Authorized personnel only • Secure Sync Active</p>
        </header>

        <div className="relative w-full aspect-square bg-black border border-[#27272A] rounded-[24px] overflow-hidden shadow-2xl">
          <div id="reader" className="w-full h-full"></div>
          {!isScanning && (
            <div className="absolute inset-0 bg-[#09090B] z-10 flex flex-col items-center justify-center text-center p-4">
              <Camera className="w-12 h-12 text-[#27272A] mb-4" />
              <button onClick={startScanner} className="bg-[#3B82F6] px-6 py-2 rounded-lg font-bold">Enable Terminal</button>
            </div>
          )}
        </div>

        <div className={cn(
          "bg-[#18181B] border rounded-[20px] p-6 min-h-[220px] flex flex-col justify-center transition-colors duration-500",
          alreadyScanned ? "border-yellow-500/50 bg-yellow-500/5" : "border-[#27272A]"
        )}>
          {verifying ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-10 h-10 animate-spin text-[#3B82F6]" />
              <p className="text-[11px] uppercase tracking-widest text-[#A1A1AA]">Validating UID...</p>
            </div>
          ) : guestData ? (
            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#A1A1AA] block mb-1">Guest Details</span>
                  <h2 className="text-xl font-semibold leading-tight">{guestData.full_name}</h2>
                </div>
                {alreadyScanned ? (
                  <div className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-3 py-1 rounded text-[10px] font-black tracking-tighter">ALREADY IN</div>
                ) : (
                  <div className="bg-green-500/10 text-[#22C55E] border border-green-500/20 px-3 py-1 rounded text-[10px] font-black tracking-tighter">GRANTED</div>
                )}
              </div>

              {alreadyScanned && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
                  <p className="text-[10px] text-yellow-200 uppercase leading-tight font-bold">
                    Warning: Pass already used. Verify details manually.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 pt-4 border-t border-[#27272A]">
                <div className="flex items-center gap-3 text-sm text-[#A1A1AA]"><Building className="w-4 h-4 text-[#3B82F6]" /> {guestData.college_org_name}</div>
                <div className="flex items-center gap-3 text-sm text-[#A1A1AA]"><Mail className="w-4 h-4 text-[#3B82F6]" /> {guestData.email}</div>
                <div className="flex items-center gap-3 text-sm text-[#A1A1AA]"><Users className="w-4 h-4 text-[#3B82F6]" /> {guestData.participation_type} • {guestData.team_name || 'Solo'}</div>
              </div>
            </div>
          ) : errorStatus ? (
            <div className="text-center py-6">
              <XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
              <p className="text-sm font-bold text-red-500 uppercase tracking-widest">Access Denied</p>
              <p className="text-xs text-[#A1A1AA] mt-2">{errorStatus}</p>
            </div>
          ) : (
            <div className="text-center text-[#27272A] opacity-50">
              <Scan className="w-10 h-10 mx-auto mb-3" />
              <p className="text-sm tracking-widest uppercase">Waiting for scan...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
