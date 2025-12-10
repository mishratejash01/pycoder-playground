import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ShieldAlert, 
  Video, 
  Mic, 
  MonitorX, 
  Maximize, 
  Smartphone, 
  Users, 
  Globe, 
  AlertTriangle, 
  CheckCircle2,
  ScanFace
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProctoredInstructionsProps {
  onStart: () => void;
}

export const ProctoredInstructions = ({ onStart }: ProctoredInstructionsProps) => {
  const [agreed, setAgreed] = useState(false);

  const steps = [
    {
      id: 1,
      title: "System Verification",
      icon: <ScanFace className="w-6 h-6 text-blue-400" />,
      items: [
        { icon: <Video className="w-4 h-4" />, text: "Webcam must be active and unobstructed." },
        { icon: <Mic className="w-4 h-4" />, text: "Microphone must be on. Audio is recorded." },
        { icon: <Maximize className="w-4 h-4" />, text: "Fullscreen mode is mandatory." },
        { icon: <MonitorX className="w-4 h-4" />, text: "Single monitor only. Disconnect secondary displays." },
      ]
    },
    {
      id: 2,
      title: "Environment Protocol",
      icon: <Globe className="w-6 h-6 text-purple-400" />,
      items: [
        { icon: <Users className="w-4 h-4" />, text: "You must be alone in the room." },
        { icon: <Smartphone className="w-4 h-4" />, text: "No phones, tablets, or smartwatches allowed." },
        { icon: <div className="w-4 h-4 rounded-full bg-yellow-500/20 flex items-center justify-center text-[10px] font-bold text-yellow-500">L</div>, text: "Ensure the room is well-lit. Face must be visible." },
      ]
    },
    {
      id: 3,
      title: "Zero-Tolerance Violations",
      icon: <ShieldAlert className="w-6 h-6 text-red-500" />,
      className: "border-red-500/20 bg-red-950/10",
      items: [
        { icon: <AlertTriangle className="w-4 h-4 text-red-400" />, text: "Tab switching or minimizing the browser." },
        { icon: <AlertTriangle className="w-4 h-4 text-red-400" />, text: "Copy-pasting content (Clipboard locked)." },
        { icon: <AlertTriangle className="w-4 h-4 text-red-400" />, text: "Use of developer tools or extensions." },
        { icon: <AlertTriangle className="w-4 h-4 text-red-400" />, text: "Exiting fullscreen mode." },
      ]
    }
  ];

  return (
    <div className="flex flex-col h-full bg-[#050505] text-white overflow-hidden font-sans">
      
      {/* Header */}
      <div className="h-20 border-b border-white/10 flex items-center justify-center shrink-0 bg-[#0a0a0a]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600/10 rounded-lg flex items-center justify-center border border-red-500/20">
            <ShieldAlert className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-neuropol tracking-wide text-white">Proctored Assessment</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Secure Environment Protocol v2.0</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto p-8 space-y-12">
          
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-white">Pre-Flight Instructions</h2>
            <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
              You are about to enter a secure examination environment. 
              Please review the following protocols carefully. Failure to adhere to these rules 
              may result in <span className="text-red-400 font-medium">immediate termination</span> of your session.
            </p>
          </div>

          <div className="grid gap-6">
            {steps.map((step) => (
              <div 
                key={step.id} 
                className={cn(
                  "bg-[#0c0c0e] border border-white/10 rounded-xl p-6 transition-all hover:border-white/20",
                  step.className
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                    {step.icon}
                  </div>
                  <div className="flex-1 space-y-4">
                    <h3 className="text-lg font-bold text-gray-200">{step.title}</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {step.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm text-gray-400 bg-black/20 p-2 rounded border border-white/5">
                          {item.icon}
                          <span>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-900/10 border border-blue-500/20 p-6 rounded-xl flex gap-4 items-start">
            <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
              <MonitorX className="w-5 h-5 text-blue-400" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-blue-400 text-sm uppercase tracking-wide">Automated Proctoring Active</h4>
              <p className="text-sm text-blue-200/70 leading-relaxed">
                Our AI system monitors for multiple faces, object detection (phones/books), and audio anomalies. 
                Human proctors may review flagged sessions. All violations are logged.
              </p>
            </div>
          </div>

        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="h-24 border-t border-white/10 bg-[#0a0a0a] flex items-center justify-center shrink-0 p-6">
        <div className="max-w-4xl w-full flex flex-col sm:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setAgreed(!agreed)}>
            <Checkbox 
              id="terms" 
              checked={agreed} 
              onCheckedChange={(c) => setAgreed(!!c)}
              className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary w-5 h-5"
            />
            <label 
              htmlFor="terms" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-400 group-hover:text-white transition-colors cursor-pointer select-none"
            >
              I have read the instructions and agree to the terms.
            </label>
          </div>

          <Button 
            size="lg" 
            onClick={onStart}
            disabled={!agreed}
            className={cn(
              "px-8 py-6 font-bold text-base transition-all duration-500 min-w-[200px]",
              agreed 
                ? "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-[0_0_30px_rgba(220,38,38,0.4)] text-white" 
                : "bg-white/5 text-gray-500 hover:bg-white/5 border border-white/5"
            )}
          >
            {agreed ? "Verify & Start Exam" : "Awaiting Agreement..."}
          </Button>

        </div>
      </div>
    </div>
  );
};
