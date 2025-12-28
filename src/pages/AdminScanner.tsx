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
    // Initialize scanner once on mount
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
      },
      /* verbose= */ false
    );

    scanner.render(onScanSuccess, onScanFailure);
    scannerRef.current = scanner;

    async function onScanSuccess(decodedText: string) {
      // Prevent multiple simultaneous scans
      if (verifying || result) return;

      setVerifying(true);
      setResult(null);

      try {
        // 1. Fetch registration record
        const { data, error } = await supabase
          .from('event_registrations')
          .select('id, full_name, current_status')
          .eq('id', decodedText.toLowerCase())
          .single();

        if (error || !data) throw new Error("Invalid Pass: Not Found");
        if (data.current_status === 'attended') throw new Error("Already Checked In");

        // 2. Mark as attended
        const { error: updateError } = await supabase
          .from('event_registrations')
          .update({
            current_status: 'attended',
            updated_at: new Date().toISOString()
          })
          .eq('id', data.id);

        if (updateError) throw updateError;

        // 3. Success state
        setResult({ success: true, message: "Verified", name: data.full_name });
        toast.success(`${data.full_name} Verified`);
      } catch (err: any) {
        // 4. Failure state
        setResult({ success: false, message: err.message });
        toast.error(err.message);
      } finally {
        setVerifying(false);
        // Clear status after 3 seconds to allow next scan
        setTimeout(() => setResult(null), 3000);
      }
    }

    function onScanFailure() {
      // Quietly ignore errors while searching
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
          <h1 className="text-lg font-bold tracking-widest uppercase">Admin Entry Terminal</h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Scan QR Pass below</p>
        </header>

        {/* The Square Scanner Box */}
        <div className="relative border-2 border-zinc-800 bg-zinc-950 overflow-hidden rounded-xl aspect-square">
          <div id="reader" className="w-full h-full"></div>
          
          {/* Simple Guide Overlay (only visible when not processing) */}
          {!verifying && !result && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 border border-[#00ff88]/30 rounded-lg animate-pulse" />
            </div>
          )}
        </div>

        {/* Status Area Below QR */}
        <div className="min-h-[100px] flex flex-col items-center justify-center text-center p-4 border border-dashed border-zinc-800 rounded-lg">
          {verifying && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-[#00ff88] w-8 h-8" />
              <span className="text-xs font-medium uppercase tracking-widest text-[#00ff88]">Verifying...</span>
            </div>
          )}

          {!verifying && result && (
            <div className={cn(
              "flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-300",
              result.success ? "text-[#00ff88]" : "text-red-500"
            )}>
              {result.success ? (
                <>
                  <UserCheck className="w-10 h-10" />
                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest">Entry Verified</p>
                    <p className="text-xl font-serif text-white">{result.name}</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-10 h-10" />
                  <p className="text-sm font-bold uppercase tracking-widest">Rejected</p>
                  <p className="text-xs text-white/70">{result.message}</p>
                </>
              )}
            </div>
          )}

          {!verifying && !result && (
            <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em]">Ready for next scan</p>
          )}
        </div>

        <footer className="text-center pt-8">
          <p className="text-[9px] text-zinc-700 uppercase tracking-widest italic">All check-ins are logged to secure database</p>
        </footer>
      </div>
    </div>
  );
}
