import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Code2, Zap, Shield, TrendingUp, ArrowRight, Lock, ChevronsDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import DarkVeil from '@/components/DarkVeil';

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

const Landing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  
  // Scroll State for Animation
  const [scrollY, setScrollY] = useState(0);

  // Typewriter states
  const taglineText = useTypewriter("Forget theory… let’s break stuff and build better.", 40, 500);
  const helloWorldText = useTypewriter("Hello World", 150, 2500); // Starts after tagline

  // Monitor Auth State & Clean URL Hash
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session && window.location.hash && window.location.hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname);
        toast({
          title: "Welcome back!",
          description: "Successfully logged in via Google.",
        });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && window.location.hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    });

    // Scroll Listener
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [toast]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        description: "Logged out successfully",
      });
      setSession(null);
    }
  };

  const scrollToContent = () => {
    const element = document.getElementById('modes-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // --- Scroll Animation Calculations ---
  // Scale down from 1 to 0.85 as user scrolls 500px
  const scaleValue = Math.max(0.85, 1 - scrollY / 1000);
  // Fade out slightly
  const opacityValue = Math.max(0, 1 - scrollY / 600);
  // Slight vertical movement to enhance the "moving back" feel
  const translateYValue = scrollY * 0.3;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/20 flex flex-col">
      {/* Header */}
      <Header session={session} onLogout={handleLogout} />

      <main className="flex-1 w-full">
        {/* Hero Section with Fixed Background & Scroll Animation */}
        <section className="relative w-full h-screen overflow-hidden flex flex-col justify-center items-center perspective-1000">
          
          {/* Absolute Fixed Background at Z-0 */}
          <div className="fixed inset-0 z-0 w-full h-full pointer-events-none">
             <DarkVeil />
             {/* Darker overlay for text contrast */}
             <div className="absolute inset-0 bg-black/60" />
          </div>

          {/* Animated Content Wrapper at Z-10 */}
          <div 
            className="container mx-auto px-6 relative z-10 flex flex-col items-center justify-center h-full pb-32"
            style={{
              transform: `translateY(${translateYValue}px) scale(${scaleValue})`,
              opacity: opacityValue,
              transition: 'transform 0.1s ease-out, opacity 0.1s ease-out',
              willChange: 'transform, opacity'
            }}
          >
            <div className="max-w-7xl mx-auto space-y-12 text-center">
              
              <div className="space-y-12 max-w-6xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm text-primary animate-in fade-in slide-in-from-bottom-4 duration-1000">
                  <Zap className="w-4 h-4" />
                  <span>Official IIT Madras Portal</span>
                </div>
                
                {/* --- CODED TAGLINE ANIMATION --- */}
                <div className="flex justify-center animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-75">
                  <div className="relative group cursor-default">
                    {/* Glow Effect */}
                    <div className="absolute -inset-1 bg-green-500/20 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000" />
                    
                    <div className="relative bg-black/50 backdrop-blur-md border border-white/10 rounded-lg px-6 py-3 shadow-2xl flex items-center gap-3 min-h-[3.5rem]">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                      </div>
                      <div className="h-4 w-px bg-white/10 mx-1" />
                      <p className="font-mono text-base md:text-lg text-green-400 font-medium tracking-wide flex items-center text-left">
                        <span className="text-gray-500 mr-3 select-none">$</span>
                        {taglineText}
                        {/* Cursor Removed as requested */}
                      </p>
                    </div>
                  </div>
                </div>
                {/* ------------------------------- */}

                {/* --- MAIN HEADLINE --- */}
                <h1 className="font-bold tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-100">
                  {/* Row 1: "Évolve from" (Smaller) */}
                  <span className="block text-3xl md:text-5xl text-white mb-2 md:mb-4">
                    Évolve from
                  </span>

                  {/* Row 2: "Hello World" (Big, Coded) */}
                  <span className="block font-mono text-primary text-5xl md:text-8xl my-2 md:my-4 drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                    {helloWorldText}
                  </span>
                  
                  {/* Row 3: "to" (Smaller) */}
                  <span className="block text-3xl md:text-5xl text-muted-foreground/60 my-2 md:my-4">
                    to
                  </span>
                  
                  {/* Row 4: "Hired" (Big, Faded) */}
                  <span 
                    className="block text-5xl md:text-8xl text-[#1a1a1a] transition-colors duration-700 hover:text-white cursor-default selection:bg-white selection:text-black font-extrabold" 
                    title="Keep coding to reveal"
                  >
                    Hired
                  </span>
                </h1>
                
              </div>
            </div>
          </div>

          {/* Scroll Down Indicator - Fixed positioning within the section to avoid "moving out of block" */}
          <div 
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 cursor-pointer animate-in fade-in duration-1000 delay-1000"
            onClick={scrollToContent}
          >
            <div className="flex flex-col items-center gap-2 group">
              <div className="w-[36px] h-[64px] border border-white/30 rounded-full flex justify-center p-2 bg-black/20 backdrop-blur-sm group-hover:border-white/60 transition-colors shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                {/* Animating Arrow inside pill */}
                <div className="animate-[bounce_2s_infinite] mt-1">
                  <ChevronsDown className="w-5 h-5 text-white/80" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Modes Section (Below Fold) */}
        <section id="modes-section" className="relative w-full min-h-screen flex items-center justify-center bg-[#09090b] z-10 py-24 border-t border-white/5">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Select Mode</h2>
              <p className="text-muted-foreground text-lg">Choose how you want to code today.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Learning Environment Card */}
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

              {/* Proctored Environment Card */}
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
              <h2 className="text-3xl font-bold mb-4">Platform Features</h2>
              <p className="text-muted-foreground">Everything you need to master your coding skills</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
             <div className="bg-[#0c0c0e] border border-white/10 rounded-2xl p-8 hover:bg-white/5 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Instant Evaluation</h3>
              <p className="text-muted-foreground leading-relaxed">
                Code is evaluated client-side using Pyodide WebAssembly for immediate feedback without server latency.
              </p>
            </div>

            <div className="bg-[#0c0c0e] border border-white/10 rounded-2xl p-8 hover:bg-white/5 transition-colors">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">Secure & Scalable</h3>
              <p className="text-muted-foreground leading-relaxed">
                Built on a robust infrastructure ensuring a secure, reliable, and consistent coding experience for all users.
              </p>
            </div>

            <div className="bg-[#0c0c0e] border border-white/10 rounded-2xl p-8 hover:bg-white/5 transition-colors">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-xl font-bold mb-3">Performance Analytics</h3>
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
