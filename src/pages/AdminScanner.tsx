import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ShieldCheck, Loader2, UserCheck, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminScanner() {
  const [isLocked, setIsLocked] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  useEffect(() => {
    // Initialize the scanner with a specific scan area (qrbox)
    const scanner = new Html5QrcodeScanner(
      "reader", 
      { 
        fps: 20, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      }, 
      /* verbose= */ false
    );

    scanner.render(onScanSuccess, onScanFailure);

    async function onScanSuccess(decodedText: string) {
      if (isLocked || verifying) return;
      
      // Fixation logic: Lock scanning and freeze the marker UI
      setIsLocked(true); 
      setVerifying(true);
      
      try {
        // Validate against central database
        const { data, error } = await supabase
          .from('event_registrations')
          .select('id, full_name, current_status')
          .eq('id', decodedText.toLowerCase())
          .single();

        if (error || !data) throw new Error("Invalid Pass: Record not found");
        if (data.current_status === 'attended') throw new Error("Duplicate Entry: Already Attended");

        // Record attendance with timestamp
        const { error: updateError } = await supabase
          .from('event_registrations')
          .update({ 
            current_status: 'attended',
            updated_at: new Date().toISOString() 
          })
          .eq('id', data.id);

        if (updateError) throw updateError;

        setLastResult({ success: true, name: data.full_name });
        toast.success(`Verified: ${data.full_name} checked in`);
      } catch (err: any) {
        setLastResult({ success: false, message: err.message });
        toast.error(err.message);
      } finally {
        setVerifying(false);
        // Reset the fixation lock after 3 seconds to allow next scan
        setTimeout(() => {
          setIsLocked(false);
          setLastResult(null);
        }, 3000);
      }
    }

    function onScanFailure(error: any) {
      // Quietly ignore scan failures during continuous seeking
    }

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [isLocked, verifying]);

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <header className="text-center space-y-2">
          <ShieldCheck className="w-12 h-12 text-[#00ff88] mx-auto" />
          <h1 className="text-xl font-serif tracking-[4px] uppercase">Attendance Terminal</h1>
          <p className="text-[10px] text-[#777777] uppercase tracking-widest">Secure Verification Subdomain</p>
        </header>

        {/* Scan Container with Fixation UI */}
        <div className="relative border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden aspect-square flex items-center justify-center">
          <div id="reader" className="w-full h-full"></div>
          
          {/* Fixation Indicator Overlay (removed when locked) */}
          {!isLocked && (
            <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-[#00ff88]/50 animate-pulse flex items-center justify-center">
                {/* Cross Indicator */}
                <div className="w-1 h-10 bg-[#00ff88]" />
                <div className="absolute w-10 h-1 bg-[#00ff88]" />
              </div>
              <p className="absolute bottom-10 text-[9px] uppercase tracking-[4px] text-[#00ff88]">Align Pass in Frame</p>
            </div>
          )}

          {/* Locked State / Result Display */}
          {isLocked && (
            <div className={cn(
              "absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 transition-all duration-300",
              verifying ? "bg-black/80" : lastResult?.success ? "bg-[#00ff88]/20" : "bg-red-500/20"
            )}>
              {verifying ? (
                <>
                  <Loader2 className="animate-spin text-[#00ff88] w-10 h-10" />
                  <span className="text-[10px] uppercase tracking-[4px]">Syncing Record...</span>
                </>
              ) : lastResult?.success ? (
                <>
                  <UserCheck className="w-16 h-16 text-[#00ff88]" />
                  <h2 className="text-2xl font-serif">{lastResult.name}</h2>
                  <Badge className="bg-[#00ff88] text-black border-none px-4 py-1 rounded-none font-bold">VERIFIED</Badge>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-16 h-16 text-red-500" />
                  <p className="text-xs uppercase tracking-widest text-red-500">{lastResult?.message}</p>
                </>
              )}
            </div>
          )}
        </div>

        <footer className="text-center">
          <p className="text-[9px] text-[#333333] uppercase tracking-widest italic">All actions are logged with admin timestamp</p>
        </footer>
      </div>
    </div>
  );
}
