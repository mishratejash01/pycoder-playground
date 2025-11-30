import { Link, useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, GraduationCap, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  session: Session | null;
  onLogout: () => void;
}

export function Header({ session, onLogout }: HeaderProps) {
  const navigate = useNavigate();
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email;

  return (
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

          {/* CENTER: Navigation Links */}
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
          </div>
        </nav>
      </div>
    </header>
  );
}
