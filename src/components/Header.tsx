import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  LogOut, 
  ChevronDown, 
  Home, 
  Code2, 
  Trophy, 
  LayoutDashboard, 
  LogIn, 
  Copy, 
  ArrowRight,
  Loader2,
  Terminal,
  Gamepad2,
  UserCircle,
  ShieldCheck,
  FileText,
  Mail,
  Lock,
  Cookie,
  BookOpen
} from 'lucide-react'; 
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

interface HeaderProps {
  session: Session | null;
  onLogout: () => void;
}

interface ProfileData {
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  github_handle: string | null;
  linkedin_url: string | null;
}

export function Header({ session, onLogout }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [username, setUsername] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || "User";
  const isPracticeOrExam = location.pathname.includes('/practice') || location.pathname.includes('/exam') || location.pathname.includes('/compiler');

  useEffect(() => {
    if (session?.user?.id) fetchProfile();
  }, [session?.user?.id]);

  async function fetchProfile() {
    if (!session?.user?.id) return;
    const { data } = await supabase
      .from('profiles')
      .select('username, full_name, avatar_url, bio, github_handle, linkedin_url')
      .eq('id', session.user.id)
      .maybeSingle();
    
    if (data) {
      setProfile(data);
      if (data.username) setUsername(data.username);
    }
  }

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isPracticeOrExam) return null;

  const hasUsername = !!profile?.username;
  const isProfileIncomplete = !profile?.bio || !profile?.avatar_url || !profile?.github_handle || !profile?.username;

  return (
    <>
      <header 
        className={cn(
          "fixed z-50 left-0 right-0 mx-auto transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
          isScrolled 
            ? "top-6 max-w-7xl px-4 md:px-0" 
            : "top-0 w-full max-w-full px-10 py-6" 
        )}
      >
        <div 
          className={cn(
            "transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] w-full",
            isScrolled 
              ? "rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-2xl p-4 px-10" 
              : "rounded-none border-transparent bg-transparent p-0"
          )}
        >
          <nav className="flex items-center justify-between w-full">
            {/* Logo Section with Glow */}
            <Link to="/" className="flex items-center gap-3 group shrink-0">
              <span className="font-neuropol text-xl md:text-2xl font-bold tracking-wider text-white transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]">
                COD<span className="text-[1.2em] lowercase relative top-[1px] mx-[1px] inline-block">é</span>VO
              </span>
            </Link>

            {/* Professional Navigation Tabs */}
            <div className="hidden md:flex flex-1 justify-end items-center gap-7 mr-6">
              
              {/* Products Dropdown */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1.5 text-[14px] font-medium text-muted-foreground hover:text-white transition-colors group outline-none">
                    Products
                    <ChevronDown className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2 bg-[#0c0c0e] border-white/10 rounded-xl shadow-2xl backdrop-blur-xl">
                  <div className="grid gap-1">
                    <Link to="/compiler" className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group">
                      <Terminal className="w-4 h-4 text-purple-400" />
                      <div>
                        <p className="text-sm font-medium text-white">Compiler</p>
                        <p className="text-[11px] text-muted-foreground">High-performance IDE</p>
                      </div>
                    </Link>
                    <Link to="/practice-arena" className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group">
                      <Gamepad2 className="w-4 h-4 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium text-white">Practice Arena</p>
                        <p className="text-[11px] text-muted-foreground">Gamified coding challenges</p>
                      </div>
                    </Link>
                    <Link to="/profile" className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group">
                      <UserCircle className="w-4 h-4 text-green-400" />
                      <div>
                        <p className="text-sm font-medium text-white">Profile Card</p>
                        <p className="text-[11px] text-muted-foreground">Showcase your skills</p>
                      </div>
                    </Link>
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* Resources Dropdown */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1.5 text-[14px] font-medium text-muted-foreground hover:text-white transition-colors group outline-none">
                    Resources
                    <ChevronDown className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[480px] p-0 bg-[#0c0c0e] border-white/10 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden">
                  <div className="flex">
                    {/* Left: Links */}
                    <div className="flex-1 p-4 border-r border-white/5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-2">Legal & Support</p>
                      <div className="grid gap-1">
                        {[
                          { label: 'Contact Us', icon: Mail, to: '/contact' },
                          { label: 'Security', icon: ShieldCheck, to: '/security' },
                          { label: 'Terms & Conditions', icon: FileText, to: '/terms' },
                          { label: 'Privacy Policy', icon: Lock, to: '/privacy' },
                          { label: 'Cookies', icon: Cookie, to: '/cookies' },
                        ].map((item) => (
                          <Link key={item.label} to={item.to} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group">
                            <item.icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-white transition-colors" />
                            <span className="text-sm text-gray-300 group-hover:text-white">{item.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                    {/* Right: Featured Blog (Coming Soon) */}
                    <div className="w-[240px] bg-white/[0.02] p-4 flex flex-col">
                      <div className="flex items-center justify-between mb-3 px-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Featured Blog</p>
                        <Link to="/blog" className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors">View All</Link>
                      </div>
                      
                      <div className="relative group/blog flex-1 rounded-lg overflow-hidden border border-white/5">
                        {/* Image Layer - Blurred */}
                        <img 
                          src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop" 
                          alt="Blog" 
                          className="w-full h-24 object-cover blur-[4px] opacity-40 scale-105"
                        />
                        
                        {/* Overlay Content */}
                        <div className="p-3">
                          <p className="text-[13px] font-bold text-white/50 blur-[2px] leading-tight mb-2">
                            Mastering Neural AI with Codevo
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50 blur-[1px]">
                            <BookOpen className="w-3 h-3" />
                            <span>5 min read</span>
                          </div>
                        </div>

                        {/* Coming Soon Center Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                          <span className="px-3 py-1 bg-white text-black text-[10px] font-bold uppercase tracking-tighter rounded-sm rotate-[-5deg] shadow-xl">
                            Coming Soon
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Link to="/events" className="text-[14px] font-medium text-muted-foreground hover:text-white transition-colors">
                Events
              </Link>

              {/* Combined Try Codevo Play Button */}
              <Button 
                onClick={() => navigate('/practice-arena')}
                variant="outline" 
                className={cn(
                  "group border-white/20 bg-transparent hover:bg-white text-white hover:text-black rounded-full px-6 h-10 text-[13px] font-bold transition-all flex items-center gap-2",
                  "shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                )}
              >
                Try CODéVO Play
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>

            {/* Profile / Auth Section */}
            <div className="flex items-center gap-2 shrink-0">
              {session ? (
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all relative">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-[11px] font-bold text-white border border-white/20">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-200">{userName}</span>
                      <div className="relative flex h-2 w-2 ml-1">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 shadow-[0_0_10px_#22c55e]"></span>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  </PopoverTrigger>

                  <PopoverContent align="end" sideOffset={16} className="w-[320px] p-8 bg-[#0a0a0a] border border-[#222222] rounded-none shadow-[0_40px_80px_rgba(0,0,0,0.9)] outline-none">
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#888888] mb-8">Public Profile QR</p>
                      
                      <div className="bg-white p-4 inline-block mb-6 rounded-sm relative">
                        <div className={cn(!hasUsername && "blur-md opacity-30")}>
                          <QRCodeSVG value={hasUsername ? qrFullUrl : 'setup'} size={140} />
                        </div>
                        {!hasUsername && (
                          <div className="absolute inset-0 flex items-center justify-center p-4 text-[10px] text-black font-bold uppercase tracking-widest">
                            Set Username
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-center gap-2 mb-10 group cursor-pointer" onClick={() => {
                        if (hasUsername) {
                          navigator.clipboard.writeText(displayUrl);
                          toast.success('Profile link copied!');
                        }
                      }}>
                        <p className="text-[#444444] text-[13px] tracking-wide font-medium group-hover:text-[#888888] transition-colors">
                          {displayUrl}
                        </p>
                        {hasUsername && <Copy className="w-3 h-3 text-[#444444] group-hover:text-[#888888] transition-colors" />}
                      </div>

                      <div className="flex flex-col gap-3 text-left">
                        <Link 
                          to="/profile" 
                          onClick={() => setPopoverOpen(false)} 
                          className={cn(
                            "w-full py-4 text-[13px] font-bold uppercase tracking-widest text-center transition-all border", 
                            !profile?.username 
                              ? "bg-red-600 border-red-600 text-white hover:bg-transparent hover:text-red-600" 
                              : "bg-white border-white text-black hover:bg-transparent hover:text-white"
                          )}
                        >
                          {!profile?.username ? 'Complete Your Profile' : 'Edit Profile'}
                        </Link>

                        <div className="mt-4 pt-4 border-t border-[#222222]">
                          <button onClick={() => { setPopoverOpen(false); onLogout(); }} className="flex items-center w-full text-white text-[13px] font-medium hover:opacity-60 transition-opacity">
                            <LogOut className="mr-3 w-[18px] h-[18px] stroke-[2px]" /> Logout
                          </button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <Button 
                  size="lg" 
                  className="bg-white/10 hover:bg-white/20 text-white rounded-full px-7 font-semibold h-10 transition-all border border-white/10 backdrop-blur-md text-[14px]" 
                  onClick={() => navigate('/auth')}
                >
                  Sign in
                </Button>
              )}
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}
