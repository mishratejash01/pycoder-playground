import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Home, Code2, Trophy, LayoutDashboard, User } from 'lucide-react'; 
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from '@/lib/utils';

interface HeaderProps {
  session: Session | null;
  onLogout: () => void;
}

export function Header({ session, onLogout }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || "User";

  const isPracticeOrExam = location.pathname.includes('/practice') || location.pathname.includes('/exam') || location.pathname.includes('/compiler');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > window.innerHeight - 100);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isPracticeOrExam) return null;

  const NavItem = ({ to, icon: Icon, label, active, size = "normal" }: { to: string; icon: any; label: string; active?: boolean, size?: "normal" | "large" }) => (
    <Link 
      to={to} 
      className={cn(
        "flex flex-col items-center justify-center rounded-xl transition-all duration-300 group relative",
        size === "large" ? "p-3 -mt-6 bg-[#0c0c0e] border border-primary/30 shadow-[0_0_20px_rgba(59,130,246,0.2)] z-10" : "p-2",
        active 
          ? (size === "large" ? "text-primary ring-2 ring-primary/50" : "bg-primary/10 text-primary")
          : "text-muted-foreground hover:text-white"
      )}
    >
      <Icon className={cn("transition-transform group-hover:scale-110", size === "large" ? "w-6 h-6" : "w-5 h-5")} />
      {size === "large" && <span className="text-[10px] font-bold mt-1 text-primary animate-pulse">UPSKILL</span>}
      {size !== "large" && <span className="sr-only">{label}</span>}
    </Link>
  );

  return (
    <>
      <header 
        className="fixed z-50 left-0 right-0 mx-auto w-full max-w-6xl px-4 md:px-0 transition-all duration-300"
        style={{ top: 'calc(1.25rem + var(--banner-height, 0px))' }}
      >
        <div className={cn(
          "rounded-2xl border border-white/10 shadow-2xl bg-black/60 backdrop-blur-xl transition-all duration-300 hover:border-primary/20"
        )}>
          <nav className="flex items-center justify-between p-2 px-6">
            
            <Link to="/" className="flex items-center gap-3 group mr-8">
              <span className="font-neuropol text-xl md:text-2xl font-bold tracking-wider text-white transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                COD<span className="text-[1.2em] lowercase relative top-[1px] mx-[1px] inline-block">é</span>VO
              </span>
            </Link>

            <div className="hidden md:flex flex-1 justify-center gap-4">
              <Link to="/degree" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-white transition-colors hover:bg-white/5 px-3 py-2 rounded-md">
                <img src="https://upload.wikimedia.org/wikipedia/en/thumb/6/69/IIT_Madras_Logo.svg/1200px-IIT_Madras_Logo.svg.png" alt="IITM" className="w-4 h-4 object-contain opacity-80" /> 
                IITM BS
              </Link>
              <Link to="/practice-arena" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-white transition-colors hover:bg-white/5 px-3 py-2 rounded-md">Practice</Link>
              <Link to="/events" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-white transition-colors hover:bg-white/5 px-3 py-2 rounded-md">Events</Link>
              <Link to="/compiler" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-purple-400 transition-colors hover:bg-purple-500/10 px-3 py-2 rounded-md border border-transparent hover:border-purple-500/20">Compiler</Link>
              <Link to="/leaderboard" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-white transition-colors hover:bg-white/5 px-3 py-2 rounded-md">Leaderboard</Link>
            </div>

            <div className="flex items-center gap-2">
              {session ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md shadow-inner cursor-pointer hover:bg-white/10 transition-all">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-[10px] font-bold text-white border border-white/20">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-gray-200 max-w-[100px] truncate">{userName}</span>
                      <div className="relative flex h-2 w-2 ml-1" title="Online">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 shadow-[0_0_10px_#22c55e]"></span>
                      </div>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent 
                    align="end" 
                    sideOffset={10}
                    className="w-44 p-1.5 bg-[#0c0c0e] border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-xl outline-none"
                  >
                    <div className="flex flex-col gap-1">
                      {/* Mobile Only: Profile Button */}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="md:hidden w-full flex items-center justify-start gap-2.5 text-gray-300 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg text-xs font-medium transition-colors" 
                        onClick={() => navigate('/profile')}
                      >
                        <User className="w-4 h-4 text-primary" /> Profile
                      </Button>
                      
                      {/* Logout Button: Visible on all devices */}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full flex items-center justify-start gap-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-2 rounded-lg text-xs font-medium transition-colors" 
                        onClick={onLogout}
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <Button size="sm" className="bg-primary hover:
