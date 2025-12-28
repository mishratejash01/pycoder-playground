import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ShieldCheck, Loader2, UserCheck, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function AdminScanner() {
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; name?: string } | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Initialize scanner with CAMERA ONLY support
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        // This line removes the "Scan Image File" option
        supportedScanTypes: [0], // 0 corresponds to Html5QrcodeScanType.SCAN_TYPE_CAMERA
      },
      /* verbose= */ false
    );

    scanner.render(onScanSuccess, onScanFailure);
    scannerRef.current = scanner;

    async function onScanSuccess(decodedText: string) {
      if (verifying || result) return;

      setVerifying(true);
      setResult(null);

      try {
        const { data, error } = await supabase
          .from('event_registrations')
          .select('id, full_name, current_status')
          .eq('id', decodedText.toLowerCase())
          .single();

        if (error || !data) throw new Error("Invalid Pass: Not Found");
        if (data.current_status === 'attended') throw new Error("Already Checked In");

        const { error: updateError } = await supabase
          .from('event_registrations')
          .update({
            current_status: 'attended',
            updated_at: new Date().toISOString()
          })
          .eq('id', data.id);

        if (updateError) throw updateError;

        setResult({ success: true, message: "Verified", name: data.full_name });
        toast.success(`${data.full_name} Verified`);
      } catch (err: any) {
        setResult({ success: false, message: err.message });
        toast.error(err.message);
      } finally {
        setVerifying(false);
        // Automatically reset for the next person after 3 seconds
        setTimeout(() => setResult(null), 3000);
      }
    }

    function onScanFailure() {
      // Ignore failures during the continuous search process
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center pt-12">
      <div className="w-full max-w-sm space-y-8">
        <header className="text-center space-y-2">
          <ShieldCheck className="w-10 h-10 text-[#00ff88] mx-auto mb-4" />
          <h1 className="text-lg font-bold tracking-widest uppercase font-serif">Attendance Terminal</h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Authorized Personnel Only</p>
        </header>

        {/* QR Scanner Container */}
        <div className="relative border-2 border-zinc-800 bg-zinc-950 overflow-hidden rounded-xl aspect-square">
          <div id="reader" className="w-full h-full"></div>
          
          {/* Alignment Guide (Hidden when showing results) */}
          {!verifying && !result && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 border border-[#00ff88]/20 rounded-lg animate-pulse" />
            </div>
          )}
        </div>

        {/* Status Display Area (Strictly Below QR) */}
        <div className="min-h-[120px] flex flex-col items-center justify-center text-center p-6 border border-zinc-800 rounded-lg bg-zinc-950/50">
          {verifying && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-[#00ff88] w-8 h-8" />
              <span className="text-xs font-medium uppercase tracking-[0.3em] text-[#00ff88]">Searching...</span>
            </div>
          )}

          {!verifying && result && (
            <div className={cn(
              "flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300",
              result.success ? "text-[#00ff88]" : "text-red-500"
            )}>
              {result.success ? (
                <>
                  <UserCheck className="w-12 h-12 mb-1" />
                  <Badge className="bg-[#00ff88] text-black hover:bg-[#00ff88] rounded-none px-3">VERIFIED</Badge>
                  <p className="text-xl font-serif text-white mt-1">{result.name}</p>
                </>
              ) : (
                <>
                  <XCircle className="w-12 h-12 mb-1" />
                  <Badge variant="destructive" className="rounded-none px-3">REJECTED</Badge>
                  <p className="text-xs text-white/70 mt-2 uppercase tracking-widest">{result.message}</p>
                </>
              )}
            </div>
          )}

          {!verifying && !result && (
            <div className="flex flex-col items-center gap-2 opacity-40">
              <p className="text-[10px] uppercase tracking-[0.4em]">Waiting for Pass</p>
            </div>
          )}
        </div>

        <footer className="text-center pt-4">
          <p className="text-[9px] text-zinc-700 uppercase tracking-widest">
            Cloud Sync Active • Security Node v2.4
          </p>
        </footer>
      </div>
    </div>
  );
}
