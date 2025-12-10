import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, AlertOctagon, Monitor, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProctoredInstructionsProps {
  onStart: () => void;
}

export const ProctoredInstructions = ({ onStart }: ProctoredInstructionsProps) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="flex flex-col h-full bg-[#050505] text-white font-sans selection:bg-red-500/20">
      
      {/* Header */}
      <div className="h-14 border-b border-white/10 flex items-center px-6 bg-[#0a0a0a] shrink-0 justify-between">
        <h1 className="text-sm font-bold text-gray-200 uppercase tracking-[0.15em] flex items-center gap-2">
          <Shield className="w-4 h-4 text-red-500" />
          Proctored Environment v2.4
        </h1>
        <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Monitoring Active
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 w-full">
        <div className="w-full px-6 md:px-12 py-8 max-w-[1400px] mx-auto">
          
          <div className="mb-8">
            <h2 className="text-2xl font-medium text-white mb-2 tracking-tight">Compliance Protocol</h2>
            <p className="text-sm text-gray-400 max-w-3xl leading-relaxed">
              This session is monitored by autonomous proctoring algorithms. Strict adherence to the following protocols is mandatory. Deviations will be logged as violations; accumulation of <span className="text-white font-bold">three (3) violations</span> results in automatic termination.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* System Requirements */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-5">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Monitor className="w-3.5 h-3.5" /> System Integrity
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-start border-b border-white/5 pb-2">
                  <span className="text-gray-300">Fullscreen Mode</span>
                  <span className="text-xs text-red-400 font-mono text-right">MANDATORY<br/><span className="text-gray-600">No exits allowed</span></span>
                </div>
                <div className="flex justify-between items-start border-b border-white/5 pb-2">
                  <span className="text-gray-300">Display Configuration</span>
                  <span className="text-xs text-gray-400 font-mono text-right">SINGLE MONITOR<br/><span className="text-gray-600">Disconnect externals</span></span>
                </div>
                <div className="flex justify-between items-start border-b border-white/5 pb-2">
                  <span className="text-gray-300">Input Devices</span>
                  <span className="text-xs text-gray-400 font-mono text-right">MOUSE & KEYBOARD<br/><span className="text-gray-600">Clipboard Locked</span></span>
                </div>
                <div className="flex justify-between items-start pt-1">
                  <span className="text-gray-300">Browser Environment</span>
                  <span className="text-xs text-gray-400 font-mono text-right">NO TABS/EXTENSIONS<br/><span className="text-gray-600">Focus tracked</span></span>
                </div>
              </div>
            </div>

            {/* Candidate Conduct */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-5">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> Candidate Conduct
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-start border-b border-white/5 pb-2">
                  <span className="text-gray-300">Face Visibility</span>
                  <span className="text-xs text-gray-400 font-mono text-right">ALWAYS VISIBLE<br/><span className="text-gray-600">Unobstructed view</span></span>
                </div>
                <div className="flex justify-between items-start border-b border-white/5 pb-2">
                  <span className="text-gray-300">Room Environment</span>
                  <span className="text-xs text-gray-400 font-mono text-right">PRIVATE & SILENT<br/><span className="text-gray-600">No other persons</span></span>
                </div>
                <div className="flex justify-between items-start border-b border-white/5 pb-2">
                  <span className="text-gray-300">Audio Feed</span>
                  <span className="text-xs text-gray-400 font-mono text-right">UNMUTED<br/><span className="text-gray-600">Ambient noise analyzed</span></span>
                </div>
                <div className="flex justify-between items-start pt-1">
                  <span className="text-gray-300">Prohibited Items</span>
                  <span className="text-xs text-red-400 font-mono text-right">ZERO TOLERANCE<br/><span className="text-gray-600">Phones, Notes, Books</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Violation Policy */}
          <div className="border border-red-900/20 bg-red-950/5 p-4 rounded-lg flex gap-4 items-center">
            <div className="p-2 bg-red-900/10 rounded shrink-0">
              <AlertOctagon className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-400 uppercase tracking-wide">Termination Criteria</h4>
              <p className="text-xs text-red-300/70 mt-1">
                The session will auto-terminate upon detecting: Tab Switching, Multiple Faces, Face Absence, or Unauthorized Peripheral inputs.
              </p>
            </div>
          </div>

        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="h-20 border-t border-white/10 bg-[#0a0a0a] px-6 md:px-12 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Checkbox 
            id="acknowledge" 
            checked={agreed} 
            onCheckedChange={(c) => setAgreed(!!c)}
            className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:text-black w-4 h-4 rounded-[2px]"
          />
          <label htmlFor="acknowledge" className="text-xs md:text-sm text-gray-400 select-none cursor-pointer">
            I acknowledge the protocols and accept liability for violations.
          </label>
        </div>
        <Button 
          onClick={onStart}
          disabled={!agreed}
          className={cn(
            "h-10 px-6 text-xs font-bold uppercase tracking-widest transition-all rounded-sm",
            agreed 
              ? "bg-white text-black hover:bg-gray-200" 
              : "bg-white/5 text-gray-600"
          )}
        >
          Initialize Exam
        </Button>
      </div>
    </div>
  );
};
