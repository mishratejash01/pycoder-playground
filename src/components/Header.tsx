import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, GraduationCap, Info, Home, BookOpen, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  session: Session | null;
  onLogout: () => void;
}

export function Header({ session, onLogout }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email;

  // Track scroll position to toggle bottom menu visibility
  useEffect(() => {
    const handleScroll = () => {
      // Show menu after scrolling down 100px (past the initial hero area)
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const NavItem = ({ to, icon: Icon, label, active }: { to: string; icon: any; label: string; active?: boolean }) => (
    <Link 
      to={to} 
      className={cn(
        "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 group",
        active 
          ? "bg-primary/20 text-primary border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.3)]" 
          : "bg-white/5 text-muted-foreground border border-white/5 hover:bg-white/10 hover:text-white"
      )}
    >
      <Icon className={cn("w-5 h-5 mb-1 transition-transform group-hover:scale-110", active && "scale-110")} />
      <span className="text-[10px] font-medium tracking-wide uppercase">{label}</span>
    </Link>
  );

  return (
    <>
      {/* --- Desktop & Mobile Top Header --- */}
      <header className="fixed top-5 z-50 left-0 right-0 mx-auto w-full max-w-6xl px-4 md:px-0 transition-all duration-300">
        <div className={cn(
          "rounded-2xl border border-white/10 shadow-2xl",
          "bg-black/60 backdrop-blur-xl supports-[backdrop-filter]:bg-black/40",
          "transition-all duration-300 hover:border-primary/20"
        )}>
          <nav className="flex items-center justify-between p-2 px-6">
            
            {/* LEFT: Logo */}
            <Link to="/" className="flex items-center gap-2 group mr-8">
              <span className={cn(
                "font-neuropol text-xl md:text-2xl font-bold tracking-wider text-white",
                "transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
              )}>
                COD
                <span className="text-[1.2em] lowercase relative top-[1px] mx-[1px] inline-block">é</span>
                VO
              </span>
            </Link>

            {/* CENTER: Desktop Navigation (Hidden on Mobile) */}
            <div className="hidden md:flex flex-1 justify-center gap-6">
              <Link 
                to="/degree" 
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-white transition-colors hover:bg-white/5 px-3 py-2 rounded-md"
              >
                <GraduationCap className="w-4 h-4" />
                IITM BS Degree
              </Link>
              <Link 
                to="/about" 
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-white transition-colors hover:bg-white/5 px-3 py-2 rounded-md"
              >
                <Info className="w-4 h-4" />
                About
              </Link>
            </div>

            {/* RIGHT: Auth */}
            <div className="flex items-center gap-2">
              {session ? (
                <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md shadow-inner group hover:bg-white/10">
                  <span className="text-xs font-medium text-gray-200 max-w-[150px] truncate">{userName}</span>
                  <div className="h-4 w-px bg-white/10 mx-1" />
                  <button onClick={onLogout} className="text-muted-foreground hover:text-white transition-colors" title="Logout">
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <Button size="sm" className="hidden md:flex bg-primary hover:bg-primary/90 text-white rounded-xl px-6" onClick={() => navigate('/auth')}>
                  <LogIn className="h-3.5 w-3.5 mr-2" /> Login
                </Button>
              )}
              
              {/* Mobile Auth Indicator (Simple icon if logged in) */}
              {session && (
                <div className="md:hidden w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* --- Mobile Bottom Floating Menu --- */}
      <div className={cn(
        "fixed bottom-6 left-4 right-4 z-50 md:hidden transition-all duration-500 transform ease-in-out",
        isScrolled ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0 pointer-events-none"
      )}>
        <div className="bg-[#0c0c0e]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl ring-1 ring-white/5">
          <div className="grid grid-cols-4 gap-3">
            
            <NavItem 
              to="/" 
              icon={Home} 
              label="Home" 
              active={location.pathname === "/"} 
            />
            
            <NavItem 
              to="/degree" 
              icon={GraduationCap} 
              label="Degree" 
              active={location.pathname.startsWith("/degree")} 
            />
            
            <NavItem 
              to="/about" 
              icon={Info} 
              label="About" 
              active={location.pathname === "/about"} 
            />

            {/* Dynamic Auth Block for Mobile */}
            {session ? (
              <button 
                onClick={onLogout}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 active:scale-95 transition-all"
              >
                <LogOut className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-medium tracking-wide uppercase">Logout</span>
              </button>
            ) : (
              <NavItem 
                to="/auth" 
                icon={LogIn} 
                label="Login" 
                active={location.pathname === "/auth"} 
              />
            )}

          </div>
        </div>
      </div>
    </>
  );
}
