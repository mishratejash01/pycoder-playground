import { useState } from 'react';
import { QrReader } from 'react-qr-reader';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ShieldCheck, Camera, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function AdminScanner() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleResult = async (result: any) => {
    if (!!result && scanning) {
      setScanning(false);
      setLoading(true);
      const regId = result?.text;

      const { data, error } = await supabase
        .from('event_registrations')
        .update({ is_attended: true, attended_at: new Date().toISOString() })
        .eq('id', regId)
        .select();

      if (error || !data?.length) {
        toast.error("Verification Failed: Invalid Registration ID");
      } else {
        toast.success(`Verified: ${data[0].full_name} is now marked as Attended!`);
      }

      setLoading(false);
      setTimeout(() => setScanning(true), 2500); // Cool-down before next scan
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center">
      <div className="w-full max-w-md space-y-8 pt-10">
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-[#777]">
            <ArrowLeft className="w-4 h-4 mr-2" /> Exit
          </Button>
          <div className="flex items-center gap-2 text-[#00ff88]">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Gate Access</span>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-serif mb-2">Check-in Terminal</h1>
          <p className="text-[10px] text-[#777] uppercase tracking-[4px]">Scan Participant QR</p>
        </div>

        <div className="relative aspect-square rounded-3xl overflow-hidden border-2 border-[#1a1a1a] bg-[#050505]">
          {scanning ? (
            <QrReader
              onResult={handleResult}
              constraints={{ facingMode: 'environment' }}
              className="w-full h-full"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
               {loading ? <Loader2 className="w-10 h-10 animate-spin text-[#00ff88]" /> : <ShieldCheck className="w-16 h-16 text-[#00ff88]" />}
            </div>
          )}
          <div className="absolute inset-0 border-[60px] border-black/40 pointer-events-none">
            <div className="w-full h-full border border-[#00ff88]/40" />
          </div>
        </div>

        <div className="bg-[#0a0a0a] p-4 border border-[#1a1a1a] flex gap-4">
          <Camera className="w-5 h-5 text-[#555]" />
          <p className="text-[10px] text-[#777] uppercase leading-relaxed tracking-wider">
            Point the camera at the QR code on the participant's digital pass to confirm their attendance.
          </p>
        </div>
      </div>
    </div>
  );
}
