import { useMemo } from 'react';
import { cn } from "@/lib/utils";

interface VirtualKeyboardProps {
  activeChar: string | null;
}

const KEY_ROWS = [
  [
    { label: "esc", width: 1.2 }, { label: "F1" }, { label: "F2" }, { label: "F3" }, { label: "F4" }, { label: "F5" }, { label: "F6" }, { label: "F7" }, { label: "F8" }, { label: "F9" }, { label: "F10" }, { label: "F11" }, { label: "F12" }, { label: "del", width: 1.2 }
  ],
  [
    { label: "`", value: "`~" }, { label: "1", value: "1!" }, { label: "2", value: "2@" }, { label: "3", value: "3#" }, { label: "4", value: "4$" }, { label: "5", value: "5%" }, { label: "6", value: "6^" }, { label: "7", value: "7&" }, { label: "8", value: "8*" }, { label: "9", value: "9(" }, { label: "0", value: "0)" }, { label: "-", value: "-_" }, { label: "=", value: "=+" }, { label: "←", width: 1.5, value: "Backspace" }
  ],
  [
    { label: "tab", width: 1.5, value: "\t" }, { label: "Q" }, { label: "W" }, { label: "E" }, { label: "R" }, { label: "T" }, { label: "Y" }, { label: "U" }, { label: "I" }, { label: "O" }, { label: "P" }, { label: "[", value: "[{" }, { label: "]", value: "]}" }, { label: "\\", value: "\\|", width: 1 }
  ],
  [
    { label: "caps", width: 1.8, value: "CapsLock" }, { label: "A" }, { label: "S" }, { label: "D" }, { label: "F" }, { label: "G" }, { label: "H" }, { label: "J" }, { label: "K" }, { label: "L" }, { label: ";", value: ";:" }, { label: "'", value: "'\"" }, { label: "enter", width: 2.2, value: "\n" }
  ],
  [
    { label: "shift", width: 2.4, value: "Shift" }, { label: "Z" }, { label: "X" }, { label: "C" }, { label: "V" }, { label: "B" }, { label: "N" }, { label: "M" }, { label: ",", value: ",<" }, { label: ".", value: ".>" }, { label: "/", value: "/?" }, { label: "shift", width: 2.4, value: "Shift" }
  ],
  [
    { label: "fn" }, { label: "ctrl" }, { label: "opt" }, { label: "cmd", width: 1.2 }, { label: "", width: 6.5, value: " " }, { label: "cmd", width: 1.2 }, { label: "opt" }, { label: "◄" }, { label: "▲" }, { label: "▼" }, { label: "►" }
  ]
];

export function VirtualKeyboard({ activeChar }: VirtualKeyboardProps) {
  // Helper to determine if a key should be active based on the character being typed
  const isActive = (keyLabel: string, keyValue?: string) => {
    if (!activeChar) return false;
    
    const char = activeChar.toLowerCase();
    const label = keyLabel.toLowerCase();
    
    // Direct match (letters)
    if (char === label) return true;
    
    // Special keys
    if (activeChar === ' ' && !keyLabel) return true; // Spacebar
    if (activeChar === '\n' && label === 'enter') return true;
    
    // Symbol matching (checking if the char exists in the key's value string)
    if (keyValue && keyValue.includes(activeChar)) return true;
    
    // Shift key logic for uppercase letters or special symbols
    if (label === 'shift') {
       const isUpper = activeChar !== activeChar.toLowerCase();
       const isSymbolShift = '~!@#$%^&*()_+{}|:"<>?'.includes(activeChar);
       return isUpper || isSymbolShift;
    }

    return false;
  };

  return (
    <div className="p-4 bg-[#1a1a1a] rounded-2xl border border-white/10 shadow-2xl select-none w-full max-w-3xl mx-auto transform hover:scale-[1.01] transition-transform duration-500">
      <div className="flex flex-col gap-1.5">
        {KEY_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1.5 justify-center">
            {row.map((key, keyIndex) => {
              const active = isActive(key.label, key.value);
              return (
                <div
                  key={keyIndex}
                  className={cn(
                    "h-10 md:h-12 rounded-lg flex items-center justify-center text-[10px] md:text-xs font-medium transition-all duration-100 border-b-[3px]",
                    active 
                      ? "bg-[#1e293b] border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.6)] translate-y-[1px] border-b-[1px]" 
                      : "bg-[#27272a] border-[#000000] text-gray-400 hover:bg-[#323235]",
                  )}
                  style={{ 
                    flex: key.width || 1,
                    minWidth: key.width ? `${key.width * 2.5}rem` : 'auto' 
                  }}
                >
                  {key.label}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {/* Keyboard Glow Underlay */}
      <div className="absolute -inset-4 bg-blue-500/5 blur-3xl -z-10 rounded-full opacity-50" />
    </div>
  );
}
