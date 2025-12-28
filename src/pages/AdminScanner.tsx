import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { ShieldCheck, Loader2, UserCheck, XCircle, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function AdminScanner() {
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; name?: string } | null>(null);
  const [isScannerStarted, setIsScannerStarted] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const startScanner = () => {
    // Initialize scanner ONLY when the user clicks the start button to ensure permission prompt triggers
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA], // Force camera only
        rememberLastUsedCamera: true,
      },
      false
    );

    scanner.render(onScanSuccess, onScanFailure);
    scannerRef.current = scanner;
    setIsScannerStarted(true);
  };

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
        .update({ current_status: 'attended', updated_at: new Date().toISOString() })
        .eq('id', data.id);

      if (updateError) throw updateError;

      setResult({ success: true, message: "Verified", name: data.full_name });
      toast.success(`${data.full_name} Verified`);
    } catch (err: any) {
      setResult({ success: false, message: err.message });
      toast.error(err.message);
    } finally {
      setVerifying(false);
      setTimeout(() => setResult(null), 3000);
    }
  }

  function onScanFailure() { /* Quietly ignore */ }

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center pt-8">
      <div className="w-full max-w-sm space-y-6">
        <header className="text-center space-y-2 mb-4">
          <ShieldCheck className="w-10 h-10 text-[#00ff88] mx-auto" />
          <h1 className="text-lg font-bold tracking-widest uppercase font-serif">Entry Terminal</h1>
        </header>

        {/* Camera Scanner Box */}
        <div className="relative w-full aspect-square border-2 border-zinc-800 bg-zinc-950 rounded-xl overflow-hidden">
          <div id="reader" className="w-full h-full"></div>
          
          {/* Start Button for Mobile Permissions */}
          {!isScannerStarted && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/80 p-6 text-center">
              <Camera className="w-12 h-12 text-zinc-500 mb-4" />
              <button 
                onClick={startScanner}
                className="bg-[#00ff88] text-black px-6 py-2 rounded font-bold uppercase text-xs tracking-widest hover:bg-[#00cc6e] transition-colors"
              >
                Enable Camera
              </button>
              <p className="text-[10px] text-zinc-400 mt-4 uppercase">Camera access required for verification</p>
            </div>
          )}
        </div>

        {/* Verification Status Area (Below Camera) */}
        <div className="min-h-[140px] flex flex-col items-center justify-center text-center p-6 border border-zinc-800 rounded-lg bg-zinc-950/50">
          {verifying && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-[#00ff88] w-8 h-8" />
              <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#00ff88]">Searching Database...</span>
            </div>
          )}

          {!verifying && result && (
            <div className={cn(
              "flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300",
              result.success ? "text-[#00ff88]" : "text-red-500"
            )}>
              {result.success ? (
                <>
                  <UserCheck className="w-12 h-12" />
                  <Badge className="bg-[#00ff88] text-black rounded-none">VERIFIED</Badge>
                  <p className="text-xl font-serif text-white">{result.name}</p>
                </>
              ) : (
                <>
                  <XCircle className="w-12 h-12" />
                  <Badge variant="destructive" className="rounded-none">REJECTED</Badge>
                  <p className="text-xs text-white/70 mt-1">{result.message}</p>
                </>
              )}
            </div>
          )}

          {!verifying && !result && isScannerStarted && (
            <p className="text-[10px] uppercase tracking-[0.4em] opacity-40">Ready for Scan</p>
          )}
        </div>
      </div>
    </div>
  );
}
