import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Code2, Zap, Shield, TrendingUp, ArrowRight, Lock, ChevronsDown, Terminal, Play, LayoutGrid } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import DarkVeil from '@/components/DarkVeil';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';

// --- Typewriter Hook ---
const useTypewriter = (text: string, speed: number = 50, startDelay: number = 1000) => {
  const [displayText, setDisplayText] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const delayTimer = setTimeout(() => {
      setStarted(true);
    }, startDelay);

    return () => clearTimeout(delayTimer);
  }, [startDelay]);

  useEffect(() => {
    if (!started) return;

    const interval = setInterval(() => {
      setDisplayText((currentText) => {
        if (currentText.length < text.length) {
          return currentText + text.charAt(currentText.length);
        }
        clearInterval(interval);
        return currentText;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [started, text, speed]);

  return displayText;
};

// Filtered Tech Stack (Python, Java, SQL, Web, Linux)
const TECH_STACK = [
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg",
];

const Landing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [scrollY, setScrollY] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Typewriter states
  const taglineText = useTypewriter("Forget theory… let’s break stuff and build better.", 40, 500);
  const helloWorldText = useTypewriter("Hello World", 150, 1500);

  // Monitor Auth & Scroll
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session && window.location.hash && window.location.hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setSession(session));
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [toast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    toast({ description: "Logged out successfully" });
  };

  const scrollToContent = () => {
    const element = document.getElementById('practice-preview-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePracticeClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Capture button position for the animation origin
    const rect = e.currentTarget.getBoundingClientRect();
    setButtonPosition({
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    });
    
    setIsNavigating(true);

    // Wait for animation to cover screen before pushing route
    setTimeout(() => {
      if (session) {
        navigate('/practice');
      } else {
        navigate('/auth');
      }
    }, 800);
  };

  const scale = Math.max(0.9, 1 - scrollY / 1500);
  const borderRadius = Math.min(60, scrollY / 8);

  return (
    <div className="min-h-screen bg-white selection:bg-primary/20 flex flex-col relative overflow-hidden">
      <style>{`
        @keyframes scroll-arrow-move {
          0% { transform: translateY(0); opacity: 0.5; }
          25% { transform: translateY(-4px); opacity: 0.8; }
          75% { transform: translateY(4px); opacity: 0.8; }
          100% { transform: translateY(0); opacity: 0.5; }
        }
        .animate-scroll-arrow {
          animation: scroll-arrow-move 2s ease-in-out infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        /* Code typing animation simulation */
        @keyframes code-blink { 50% { opacity: 0; } }
      `}</style>

      {/* Page Transition Overlay */}
      <AnimatePresence>
        {isNavigating && (
          <motion.div
            initial={{ 
              position: 'fixed',
              top: buttonPosition.y,
              left: buttonPosition.x,
              width: buttonPosition.width,
              height: buttonPosition.height,
              borderRadius: '0.75rem',
              backgroundColor: '#7c3aed', // Primary purple
              zIndex: 9999,
            }}
            animate={{ 
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              borderRadius: 0,
              transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
            }}
            className="flex items-center justify-center"
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.3 } }}
              className="text-white font-neuropol text-4xl"
            >
              Loading Arena...
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <Header session={session} onLogout={handleLogout} />

      <main className="flex-1 w-full">
        
        {/* --- HERO SECTION --- */}
        <div className="relative w-full h-[120vh] bg-white"> 
          <div className="sticky top-0 h-screen w-full flex items-start justify-center overflow-hidden">
            <div 
              className="relative w-full h-full bg-black overflow-hidden flex flex-col justify-center items-center shadow-2xl will-change-transform"
              style={{
                transform: `scale(${scale})`, 
                transformOrigin: 'top center', 
                borderBottomLeftRadius: `${borderRadius}px`,
                borderBottomRightRadius: `${borderRadius}px`,
              }}
            >
              <div className="absolute inset-0 z-0 w-full h-full"><DarkVeil /><div className="absolute inset-0 bg-black/60" /></div>

              <div className="container mx-auto px-6 relative z-10 flex flex-col items-center justify-center h-full pb-20">
                <div className="max-w-7xl mx-auto space-y-10 text-center">
                  <div className="flex justify-center mb-6">
                    <div className="relative group cursor-default">
                      <div className="absolute -inset-1 bg-green-500/20 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000" />
                      <div className="relative bg-black/50 backdrop-blur-md border border-white/10 rounded-lg px-6 py-3 shadow-2xl flex items-center gap-3">
                        <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500/50" /><div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" /><div className="w-2.5 h-2.5 rounded-full bg-green-500/50" /></div>
                        <div className="h-4 w-px bg-white/10 mx-1" />
                        <p className="font-mono text-base md:text-lg text-green-400 font-medium tracking-wide"><span className="text-gray-500 mr-3 select-none">$</span>{taglineText}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl md:text-5xl text-white font-bold tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-1000">Évolve from</span>
                    <div className="flex flex-wrap items-baseline justify-center gap-3 md:gap-5 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
                      <span className="font-mono text-primary text-5xl md:text-8xl font-bold drop-shadow-[0_0_25px_rgba(168,85,247,0.4)]">{helloWorldText}</span>
                      <span className="text-2xl md:text-4xl text-muted-foreground/60 font-light">to</span>
                      <span className="text-5xl md:text-8xl font-extrabold text-[#1a1a1a] transition-colors duration-700 hover:text-white cursor-default" title="Keep coding to reveal">Hired</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-4 mt-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                    <div className="flex items-center -space-x-4">
                      {[{ src: "https://images.unsplash.com/photo-1628157588553-5eeea00af15c?w=150&h=150&fit=crop", rotate: "-rotate-6", zIndex: "z-0" }, { src: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop", rotate: "rotate-3", zIndex: "z-10" }, { src: "https://images.unsplash.com/photo-1619895862022-09114b41f16f?w=150&h=150&fit=crop", rotate: "-rotate-3", zIndex: "z-20" }, { src: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=150&h=150&fit=crop", rotate: "rotate-6", zIndex: "z-30" }].map((item, i) => (
                        <div key={i} className={cn("relative w-10 h-12 md:w-12 md:h-14 rounded-xl border-[2px] border-[#0c0c0e] overflow-hidden shadow-lg transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-110 hover:!z-50 hover:border-white/40 hover:shadow-2xl bg-gray-800", item.rotate, item.zIndex)}>
                          <img src={item.src} alt="User" className="w-full h-full object-cover opacity-90 hover:opacity-100" />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs md:text-sm font-medium text-muted-foreground/80 tracking-wide border-l border-white/10 pl-4 h-full flex items-center">Trusted by <span className="text-white font-semibold mx-1">100K+</span> community users</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 cursor-pointer animate-in fade-in duration-1000 delay-1000" onClick={scrollToContent}>
                <div className="w-[36px] h-[64px] border border-white/30 rounded-full flex justify-center items-center bg-black/20 backdrop-blur-sm hover:border-white/60 transition-colors shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                  <div className="animate-scroll-arrow"><ChevronsDown className="w-5 h-5 text-white/90" /></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- PRACTICE PREVIEW SECTION --- */}
        <section id="practice-preview-section" className="w-full bg-[#09090b] py-24 relative overflow-hidden">
          
          {/* Ambient Background Glow */}
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1/2 h-full bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              
              {/* LEFT: Content & CTA */}
              <div className="flex-1 space-y-8 text-center lg:text-left z-10">
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-[1.1]">
                    CODE LIKE <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-primary to-purple-500 animate-pulse">
                      YOU MEAN IT
                    </span>
                  </h2>
                  <p className="text-muted-foreground text-lg md:text-xl max-w-lg mx-auto lg:mx-0 leading-relaxed">
                    Immerse yourself in a distraction-free environment built for pure focus. 
                    Test against real-world scenarios, debug instantly, and climb the ranks.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <Button 
                    size="lg"
                    onClick={handlePracticeClick}
                    className="group relative overflow-hidden bg-white text-black hover:bg-white/90 h-14 px-8 rounded-full text-lg font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Start Practicing
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </span>
                    {/* Button Fill Animation */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Button>
                </div>

                {/* Tech Stack Marquee (Small) */}
                <div className="pt-8">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4 opacity-50 font-medium">Supported Technologies</p>
                  <div className="w-full max-w-md mx-auto lg:mx-0 overflow-hidden relative mask-gradient-x">
                    <div className="flex gap-8 animate-marquee whitespace-nowrap">
                      {[...TECH_STACK, ...TECH_STACK, ...TECH_STACK].map((src, i) => (
                        <div key={i} className="flex-shrink-0 w-10 h-10 opacity-40 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
                          <img src={src} alt="Tech" className="w-full h-full object-contain" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: 3D Laptop Mockup */}
              <div className="flex-1 w-full max-w-2xl lg:max-w-none perspective-1000">
                <div className="relative transform transition-transform duration-700 hover:rotate-y-[-2deg] hover:rotate-x-[2deg]">
                  
                  {/* Laptop Lid */}
                  <div className="relative bg-[#1a1a1a] rounded-t-2xl p-2 pb-0 border-t border-x border-white/10 shadow-2xl ring-1 ring-black">
                    {/* Camera */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gray-800 rounded-full z-20 border border-gray-700" />
                    
                    {/* Screen Bezel & Display */}
                    <div className="bg-black rounded-t-lg border border-white/5 overflow-hidden aspect-[16/10] relative group">
                      
                      {/* --- MOCK INTERFACE (The Website's IDE) --- */}
                      <div className="absolute inset-0 flex flex-col font-mono text-[10px] md:text-xs text-gray-400 bg-[#0c0c0e]">
                        
                        {/* Header Mock */}
                        <div className="h-8 border-b border-white/10 flex items-center px-3 justify-between bg-[#0c0c0e]">
                          <div className="flex gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500/50" />
                            <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                            <div className="w-2 h-2 rounded-full bg-green-500/50" />
                          </div>
                          <div className="px-2 py-0.5 bg-white/5 rounded text-white/50">Assignment 1: Algorithms</div>
                          <div className="w-16 h-4 bg-primary/20 rounded animate-pulse" />
                        </div>

                        <div className="flex-1 flex overflow-hidden">
                          {/* Sidebar Mock */}
                          <div className="w-12 border-r border-white/10 flex flex-col items-center py-2 gap-3 bg-[#0c0c0e]">
                            <LayoutGrid className="w-4 h-4 text-primary" />
                            <div className="w-6 h-6 rounded bg-white/5" />
                            <div className="w-6 h-6 rounded bg-white/5" />
                          </div>

                          {/* Editor Area Mock */}
                          <div className="flex-1 p-4 relative">
                            <div className="absolute top-4 left-4 text-blue-400">def solve_problem(input):</div>
                            <div className="absolute top-8 left-8 text-gray-500"># Write your efficient code here</div>
                            <div className="absolute top-12 left-8 text-purple-400">result = []</div>
                            <div className="absolute top-16 left-8 text-white">
                              for i in range(len(input)):
                              <span className="inline-block w-1.5 h-3 bg-primary ml-1 animate-[code-blink_1s_infinite]" />
                            </div>
                            
                            {/* Run Button Overlay */}
                            <div className="absolute bottom-4 right-4 bg-green-600/20 text-green-400 border border-green-500/30 px-3 py-1 rounded flex items-center gap-1 shadow-lg shadow-green-900/20 group-hover:scale-105 transition-transform">
                              <Play className="w-3 h-3 fill-current" /> Run
                            </div>
                          </div>

                          {/* Terminal Mock (Split) */}
                          <div className="w-1/3 border-l border-white/10 bg-black/40 p-2 flex flex-col">
                            <div className="flex gap-2 border-b border-white/5 pb-2 mb-2">
                              <span className="text-white/60">Output</span>
                              <span className="text-white/20">Test Cases</span>
                            </div>
                            <div className="space-y-1 opacity-70">
                              <div className="flex items-center gap-1 text-green-500"><div className="w-1 h-1 rounded-full bg-green-500"/> Passed 3/5</div>
                              <div className="flex items-center gap-1 text-red-500"><div className="w-1 h-1 rounded-full bg-red-500"/> Failed Case 4</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Screen Glare */}
                      <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
                    </div>
                  </div>

                  {/* Laptop Base */}
                  <div className="h-3 md:h-4 bg-[#252525] rounded-b-xl border-t border-black/50 shadow-xl relative z-10">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1.5 bg-gray-700 rounded-b-md" /> {/* Hinge */}
                  </div>
                  
                  {/* Reflection/Shadow under laptop */}
                  <div className="absolute -bottom-10 left-4 right-4 h-8 bg-black/40 blur-xl rounded-full transform scale-y-50" />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Modes Section */}
        <section id="modes-section" className="relative w-full min-h-screen flex items-center justify-center bg-[#09090b] z-10 py-24 border-t border-white/5">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-white">Select Mode</h2>
              <p className="text-muted-foreground text-lg">Choose how you want to code today.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="group relative bg-[#0c0c0e] border border-white/10 rounded-3xl p-8 hover:border-primary/50 transition-all duration-500 text-left hover:shadow-[0_0_40px_rgba(147,51,234,0.15)] flex flex-col overflow-hidden h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 flex-1">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-primary/20">
                    <Code2 className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-3 text-white group-hover:text-primary transition-colors">Learning Environment</h2>
                  <div className="text-muted-foreground leading-relaxed mb-6">
                    Standard practice console offering:
                    <ul className="mt-4 space-y-3 text-sm">
                      <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_currentColor]"/> Instant Feedback & Scoring</li>
                      <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_currentColor]"/> Unlimited Attempts</li>
                      <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_currentColor]"/> Access to Public Test Cases</li>
                    </ul>
                  </div>
                </div>
                <div className="relative z-10 pt-8 mt-auto border-t border-white/5">
                  <Button 
                    size="lg"
                    onClick={() => session ? navigate('/practice') : navigate('/auth')}
                    className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 h-12 text-base font-medium transition-all hover:scale-[1.02]"
                  >
                    {session ? "Enter Learning Mode" : "Login to Practice"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>

              <div className="group relative bg-[#0c0c0e] border border-white/10 rounded-3xl p-8 hover:border-red-500/50 transition-all duration-500 text-left hover:shadow-[0_0_40px_rgba(239,68,68,0.15)] flex flex-col overflow-hidden h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 flex-1">
                  <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-red-500/20">
                    <Lock className="w-8 h-8 text-red-500" />
                  </div>
                  <h2 className="text-2xl font-bold mb-3 text-white group-hover:text-red-500 transition-colors">Exam Portal</h2>
                  <div className="text-muted-foreground leading-relaxed mb-6">
                    Secure proctored environment featuring:
                    <ul className="mt-4 space-y-3 text-sm">
                      <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_10px_currentColor]"/> Strict Time Limits</li>
                      <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_10px_currentColor]"/> Full-screen Enforcement</li>
                      <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_10px_currentColor]"/> Activity Monitoring</li>
                    </ul>
                  </div>
                </div>
                <div className="relative z-10 pt-8 mt-auto border-t border-white/5">
                  <Button 
                    size="lg"
                    variant="outline"
                    className="w-full border-red-500/20 hover:bg-red-500/10 text-red-500 hover:text-red-400 h-12 text-base font-medium transition-all hover:scale-[1.02]"
                    onClick={() => session ? navigate('/exam') : navigate('/auth')}
                  >
                    {session ? "Enter Exam Hall" : "Login to Exam"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-6 py-24 border-t border-white/10 bg-[#09090b] relative z-10">
          <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">Platform Features</h2>
              <p className="text-muted-foreground">Everything you need to master your coding skills</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
             <div className="bg-[#0c0c0e] border border-white/10 rounded-2xl p-8 hover:bg-white/5 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Instant Evaluation</h3>
              <p className="text-muted-foreground leading-relaxed">
                Code is evaluated client-side using Pyodide WebAssembly for immediate feedback without server latency.
              </p>
            </div>

            <div className="bg-[#0c0c0e] border border-white/10 rounded-2xl p-8 hover:bg-white/5 transition-colors">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Secure & Scalable</h3>
              <p className="text-muted-foreground leading-relaxed">
                Built on a robust infrastructure ensuring a secure, reliable, and consistent coding experience for all users.
              </p>
            </div>

            <div className="bg-[#0c0c0e] border border-white/10 rounded-2xl p-8 hover:bg-white/5 transition-colors">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Performance Analytics</h3>
              <p className="text-muted-foreground leading-relaxed">
                Detailed breakdown of passed test cases, error logs, and execution outputs to help you debug faster.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-12 bg-[#0c0c0e] relative z-10">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2024 IIT Madras. All rights reserved.</p>
            <div className="flex gap-6">
              <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
              <span className="hover:text-white transition-colors cursor-pointer">Terms</span>
              <span className="hover:text-white transition-colors cursor-pointer">Support</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
