import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Code2, 
  ArrowRight, 
  ChevronsDown, 
  Terminal, 
  LayoutGrid, 
  Play, 
  Server, 
  Activity,
  Rocket,
  Share2,
  Trophy,
  GraduationCap,
  Zap,
  Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import DarkVeil from '@/components/DarkVeil';
import { cn } from "@/lib/utils";
import { VirtualKeyboard } from '@/components/VirtualKeyboard';
import { AsteroidGameFrame } from '@/components/AsteroidGameFrame';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { HitMeUpWidget } from '@/pages/Profile'; 

// --- Typewriter Hook (Preserved) ---
const useTypewriter = (text: string, speed: number = 50, startDelay: number = 1000) => {
  const [displayText, setDisplayText] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const delayTimer = setTimeout(() => setStarted(true), startDelay);
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

// Filtered Tech Stack (Preserved)
const TECH_STACK = [
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg",
];

const Landing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  
  // Typewriter states
  const taglineText = useTypewriter("Forget theory… let’s break stuff and build better.", 40, 500);

  // --- CRITICAL: YOUR SCROLL ANIMATION LOGIC (PRESERVED) ---
  const { scrollY } = useScroll();
  const rawScale = useTransform(scrollY, [0, 500], [1, 0.90]);
  const smoothScale = useSpring(rawScale, { stiffness: 50, damping: 15, mass: 0.2 });
  const rawRadius = useTransform(scrollY, [0, 500], [0, 32]);
  const smoothRadius = useSpring(rawRadius, { stiffness: 50, damping: 15, mass: 0.2 });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
  }, []);

  const handleShareProfile = () => {
    navigator.clipboard.writeText(`${window.location.origin}/profile`);
    toast({ description: "Profile link copied!" });
  };

  return (
    <div className="min-h-screen bg-[#09090b] selection:bg-primary/20 flex flex-col relative overflow-hidden">
      
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 30s linear infinite; }
      `}</style>

      <HitMeUpWidget />

      {/* Header */}
      <Header session={session} onLogout={() => supabase.auth.signOut()} />

      <main className="flex-1 w-full bg-[#09090b]">
        
        {/* --- HERO SECTION WITH STICKY SCROLLING ANIMATION --- */}
        <div className="relative w-full h-[115vh] bg-white"> 
          <div className="sticky top-0 h-screen w-full flex items-start justify-center overflow-hidden">
            <motion.div 
              className="relative w-full h-full bg-[#09090b] overflow-hidden flex flex-col justify-center items-center shadow-2xl will-change-transform"
              style={{
                scale: smoothScale, // This makes the section shrink on scroll
                transformOrigin: 'top center', 
                borderBottomLeftRadius: smoothRadius, // This rounds the corners
                borderBottomRightRadius: smoothRadius,
              }}
            >
              <div className="absolute inset-0 z-0 w-full h-full">
                <DarkVeil />
                <div className="absolute inset-0 bg-black/60" />
              </div>

              {/* NEW GRID LAYOUT INSIDE THE ANIMATED CONTAINER */}
              <div className="container mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center h-full pt-20">
                
                {/* LEFT: Branding & 100k Community */}
                <section className="lg:col-span-5 flex flex-col justify-center space-y-8 text-left">
                  <div className="space-y-4">
                    <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight">
                      <span className="text-primary">Start with</span><br/>
                      <span className="text-white">CODEVO</span>
                    </h1>
                    <p className="font-mono text-green-400 text-sm md:text-lg">
                      <span className="text-gray-500 mr-2">$</span>{taglineText}
                    </p>
                  </div>

                  {/* Community Metric (Preserved) */}
                  <div className="flex items-center gap-4 py-2 px-4 w-fit rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                    <div className="flex -space-x-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-[#09090b] bg-gray-800" />
                      ))}
                    </div>
                    <p className="text-xs font-medium text-gray-400">
                      Trusted by <span className="text-white font-bold">100k+</span> community users
                    </p>
                  </div>

                  {/* Recommendations Card */}
                  <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400"></div>
                    <h2 className="text-xl font-bold text-white mb-2">Get personalized recommendations!</h2>
                    <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                      Complete your profile to see tailored career goals and upcoming events.
                    </p>
                    <Button 
                      onClick={() => navigate('/profile')}
                      className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 shadow-lg shadow-primary/20"
                    >
                      Complete my profile
                    </Button>
                    <Rocket className="absolute bottom-[-10px] right-[-10px] w-24 h-24 text-white opacity-5 transform rotate-12" />
                  </div>
                </section>

                {/* RIGHT: Feature Card Grid */}
                <section className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div onClick={() => navigate('/practice-arena')} className="group cursor-pointer bg-[#072825] border border-emerald-900/50 rounded-2xl p-5 h-44 flex justify-between items-center relative overflow-hidden shadow-lg hover:border-emerald-500/50 transition-all">
                    <div className="flex flex-col h-full justify-between z-10 text-left">
                      <h3 className="text-2xl font-bold text-white">Practice</h3>
                      <p className="text-emerald-300 text-sm mt-1 leading-tight">Refine Skills Daily</p>
                    </div>
                    <Zap className="w-16 h-16 text-emerald-500/10 absolute right-4 top-4" />
                  </div>

                  <div onClick={() => navigate('/compiler')} className="group cursor-pointer bg-[#321c15] border border-orange-900/50 rounded-2xl p-5 h-44 flex justify-between items-center relative overflow-hidden shadow-lg hover:border-orange-500/50 transition-all">
                    <div className="flex flex-col h-full justify-between z-10 text-left">
                      <h3 className="text-2xl font-bold text-white">Compiler</h3>
                      <p className="text-orange-200 text-sm mt-1 leading-tight">Run Code Instantly</p>
                      <div className="bg-emerald-900/30 w-fit px-2 py-0.5 rounded-full flex items-center gap-1.5 border border-emerald-800/50">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-[10px] font-medium text-emerald-200 uppercase">Online</span>
                      </div>
                    </div>
                    <Terminal className="w-16 h-16 text-orange-500/10 absolute right-4 top-4" />
                  </div>

                  <div onClick={() => navigate('/events')} className="group cursor-pointer bg-[#131633] border border-blue-900/50 rounded-2xl p-5 h-44 flex justify-between items-center relative overflow-hidden shadow-lg hover:border-blue-500/50 transition-all">
                    <div className="flex flex-col h-full justify-between z-10 text-left">
                      <h3 className="text-2xl font-bold text-white">Events</h3>
                      <p className="text-blue-200 text-sm mt-1 leading-tight">Battle For Excellence</p>
                    </div>
                    <Trophy className="w-16 h-16 text-blue-500/10 absolute right-4 top-4" />
                  </div>

                  <div onClick={() => navigate('/degree')} className="group cursor-pointer bg-[#200f45] border border-purple-900/50 rounded-2xl p-5 h-44 flex justify-between items-center relative overflow-hidden shadow-lg hover:border-purple-500/50 transition-all">
                    <div className="flex flex-col h-full justify-between z-10 text-left">
                      <h3 className="text-xl font-bold text-white leading-tight">IIT Madras Zone</h3>
                      <p className="text-purple-200 text-xs mt-1">Exclusive Access</p>
                    </div>
                    <GraduationCap className="w-16 h-16 text-purple-500/10 absolute right-4 top-4" />
                  </div>

                  <div onClick={() => navigate('/leaderboard')} className="group cursor-pointer bg-[#321f0e] border border-yellow-900/50 rounded-2xl p-5 h-44 flex justify-between items-center relative overflow-hidden shadow-lg hover:border-yellow-500/50 transition-all">
                    <div className="flex flex-col h-full justify-between z-10 text-left">
                      <h3 className="text-2xl font-bold text-white">Ranking</h3>
                      <p className="text-yellow-200 text-sm mt-1 leading-tight">See Where You Stand</p>
                    </div>
                    <div className="flex items-end gap-1 h-10 absolute right-6 bottom-6 opacity-30">
                      <div className="w-2 h-4 bg-yellow-600 rounded-t" /><div className="w-2 h-10 bg-yellow-500 rounded-t" /><div className="w-2 h-7 bg-yellow-400 rounded-t" />
                    </div>
                  </div>

                  <div className="group bg-[#3f1025] border border-pink-900/50 rounded-2xl p-5 h-44 flex justify-between items-center relative overflow-hidden shadow-lg">
                    <div className="flex flex-col h-full justify-between z-10 text-left">
                      <h3 className="text-xl font-bold text-white">Share Profile</h3>
                      <p className="text-pink-200 text-sm mt-1 leading-tight">Build Network</p>
                    </div>
                    <Button 
                      size="icon" 
                      onClick={handleShareProfile}
                      className="w-12 h-12 bg-pink-600 hover:bg-pink-500 rounded-2xl shadow-lg transform rotate-6 hover:rotate-0 transition-transform absolute right-5 bottom-5"
                    >
                      <Share2 className="text-white w-6 h-6" />
                    </Button>
                  </div>
                </section>
              </div>

              {/* Your Animated Scroll Arrow */}
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 cursor-pointer" onClick={() => document.getElementById('tech-marquee')?.scrollIntoView({ behavior: 'smooth' })}>
                <div className="w-[30px] h-[54px] md:w-[36px] md:h-[64px] border border-white/30 rounded-full flex justify-center items-center bg-black/20 backdrop-blur-sm hover:border-white/60 transition-colors">
                  <div className="animate-bounce"><ChevronsDown className="w-4 h-4 md:w-5 md:h-5 text-white/90" /></div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* --- TECH MARQUEE SECTION --- */}
        <section id="tech-marquee" className="w-full bg-[#09090b] py-12 border-t border-white/5 relative z-20">
          <div className="container mx-auto px-6">
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-8 text-center opacity-70 font-mono">
              // POWERED BY MODERN TECHNOLOGIES
            </p>
            <div className="w-full overflow-hidden relative">
              <div className="flex gap-12 animate-marquee whitespace-nowrap items-center">
                {[...TECH_STACK, ...TECH_STACK].map((src, i) => (
                  <div key={i} className="flex-shrink-0 w-10 h-10 opacity-50 hover:opacity-100 transition-all grayscale hover:grayscale-0 cursor-pointer">
                    <img src={src} alt="tech" className="w-full h-full object-contain" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* --- PLAY N CODE (Asteroid Game) --- */}
        <section className="w-full bg-[#000000] py-12 md:py-20 relative overflow-hidden border-t border-white/5">
          <div className="container mx-auto px-6 relative z-20 max-w-7xl">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-12 tracking-tight">Play n Codé</h2>
            <AsteroidGameFrame />
          </div>
        </section>

      </main>
    </div>
  );
};

export default Landing;
