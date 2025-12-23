import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface TerminalViewProps {
  output: string;
  onInput: (text: string) => void;
}

export const TerminalView = ({ output, onInput }: TerminalViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const writtenCharsRef = useRef<number>(0);
  const currentLineRef = useRef<string>("");

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Initialize Xterm with improved settings
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
      theme: {
        background: '#0c0c0e',
        foreground: '#f8f8f2',
        cursor: '#50fa7b',
        cursorAccent: '#0c0c0e',
        selectionBackground: 'rgba(80, 250, 123, 0.3)',
        black: '#21222c',
        red: '#ff5555',
        green: '#50fa7b',
        yellow: '#f1fa8c',
        blue: '#bd93f9',
        magenta: '#ff79c6',
        cyan: '#8be9fd',
        white: '#f8f8f2',
      },
      convertEol: true,
      scrollback: 1000,
      allowTransparency: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(containerRef.current);
    
    // Delay fit to ensure container is sized
    setTimeout(() => {
      fitAddon.fit();
    }, 10);

    // 2. Handle User Typing - Echo characters and send to Python
    term.onData((data) => {
      // Handle Enter key
      if (data === '\r') {
        term.write('\r\n'); // Move to new line
        onInput('\r'); // Send to Python
        currentLineRef.current = "";
      } 
      // Handle Backspace
      else if (data === '\x7f' || data === '\b') {
        if (currentLineRef.current.length > 0) {
          currentLineRef.current = currentLineRef.current.slice(0, -1);
          term.write('\b \b'); // Move back, write space, move back
          onInput('\b');
        }
      }
      // Handle Ctrl+C (interrupt)
      else if (data === '\x03') {
        term.write('^C\r\n');
        currentLineRef.current = "";
      }
      // Handle regular printable characters
      else if (data >= ' ' || data === '\t') {
        term.write(data); // Echo the character
        currentLineRef.current += data;
        onInput(data); // Send to Python
      }
    });

    terminalRef.current = term;
    fitAddonRef.current = fitAddon;

    // Handle window resize
    const handleResize = () => {
      setTimeout(() => fitAddon.fit(), 10);
    };
    window.addEventListener('resize', handleResize);
    
    // Also observe container resize
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(() => fitAddon.fit(), 10);
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      term.dispose();
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [onInput]);

  // 3. Handle Output from Python
  useEffect(() => {
    if (!terminalRef.current) return;
    
    // DETECT RESET: If the new output is shorter than what we wrote, it means "Run" was clicked again.
    if (output.length < writtenCharsRef.current) {
      terminalRef.current.reset();
      terminalRef.current.write('\x1b[32m$ python main.py\x1b[0m\r\n'); // Green prompt
      writtenCharsRef.current = 0;
      currentLineRef.current = "";
    }

    // Write only the NEW content
    const newText = output.slice(writtenCharsRef.current);
    if (newText.length > 0) {
      terminalRef.current.write(newText);
      writtenCharsRef.current = output.length;
    }
  }, [output]);

  return (
    <div 
      className="h-full w-full bg-[#0c0c0e] p-2 overflow-hidden" 
      ref={containerRef}
      style={{ minHeight: '100px' }}
    />
  );
};
