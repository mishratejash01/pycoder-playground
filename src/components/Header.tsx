import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { 
  LogOut, 
  ChevronDown, 
  ArrowRight,
  Terminal,
  Gamepad2,
  UserCircle,
  ShieldCheck,
  FileText,
  Mail,
  Lock,
  Cookie,
  BookOpen,
  Info,
  Briefcase,
  Search,
  Copy,
  Loader2
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

interface HeaderProps { session: Session | null; onLogout: () => void; }

export function Header({ session, onLogout }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || "User";
  const isPracticeOrExam = location.pathname.includes('/practice') || location.pathname.includes('/exam') || location.pathname.includes('/compiler');

  useEffect(() => {
    if (session?.user?.id) fetchProfile();
  }, [session?.user?.id]);

  async function fetchProfile() {
    const { data } = await supabase.from('profiles').select('*').eq('id', session?.user?.id).maybeSingle();
    if (data) setProfile(data);
  }

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isPracticeOrExam) return null;

  const displayUrl = `${window.location.host}/u/${profile?.username || 'username'}`;

  return (
    <header className={cn(
      "fixed z-50 left-0 right-0 mx-auto transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
      isScrolled ? "top-6 max-w-7xl px-4 md:px-0" : "top-0 w-full max-w-full px-10 py-6"
    )}>
      <div className={cn(
        "transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] w-full",
        isScrolled ? "rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-2xl p-4 px-10" : "rounded-none border-transparent bg-transparent p-0"
      )}>
        <nav className="flex items-center justify-between w-full">
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <span className="font-neuropol text-xl md:text-2xl font-bold tracking-wider text-white transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]">
              COD<span className="text-[1.2em] lowercase relative top-[1px] mx-[1px] inline-block">é</span>VO
            </span>
          </Link>

          {/* Professional Navigation Tabs */}
          <div className="hidden md:flex flex-1 justify-end items-center gap-8 mr-8">
            
            {/* Products Mega Dropdown */}
            <div className="relative" onMouseEnter={() => setActiveDropdown('products')} onMouseLeave={() => setActiveDropdown(null)}>
              <button className="flex items-center gap-1.5 text-[14px] font-medium text-muted-foreground hover:text-white transition-colors py-2 group">
                Products
                <ChevronDown className={cn("w-3.5 h-3.5 opacity-50 transition-transform duration-300", activeDropdown === 'products' && "rotate-180 opacity-100")} />
              </button>
              
              {activeDropdown === 'products' && (
                <div className="absolute top-full right-[-100px] w-[850px] bg-[#050505] border border-white/10 rounded-md p-10 grid grid-cols-[1fr_1fr_1.2fr] gap-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] backdrop-blur-3xl animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="col-span-2"><p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.2em] mb-8">Solutions</p></div>
                  <div className="col-span-1 border-left border-white/10 pl-10"><p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.2em] mb-8">Ecosystem</p></div>
                  
                  <div className="grid grid-cols-2 col-span-2 gap-x-10 gap-y-6">
                    <Link to="/compiler" className="flex items-center gap-4 text-gray-300 hover:text-white transition-all hover:translate-x-1">
                      <Terminal className="w-[18px] h-[18px] text-muted-foreground" /> <span className="text-[15px]">Compiler</span>
                    </Link>
                    <Link to="/practice-arena" className="flex items-center gap-4 text-gray-300 hover:text-white transition-all hover:translate-x-1">
                      <Gamepad2 className="w-[18px] h-[18px] text-muted-foreground" /> <span className="text-[15px]">Practice Arena</span>
                    </Link>
                    <Link to="/profile" className="flex items-center gap-4 text-gray-300 hover:text-white transition-all hover:translate-x-1">
                      <UserCircle className="w-[18px] h-[18px] text-muted-foreground" /> <span className="text-[15px]">Profile Card</span>
                    </Link>
                  </div>

                  <div className="featured-section border-l border-white/10 pl-10 flex flex-col gap-6">
                    <div className="group relative rounded-lg overflow-hidden border border-white/5 aspect-[16/9] bg-[#111]">
                       <img src="https://images.unsplash.com/photo-1614850523296-e8c041de4398?auto=format&fit=crop&q=80&w=300" className="w-full h-full object-cover blur-sm opacity-30" />
                       <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                         <span className="px-2 py-1 bg-white text-black text-[10px] font-black uppercase tracking-tighter rounded rotate-[-4deg]">Coming Soon</span>
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Resources Mega Dropdown */}
            <div className="relative" onMouseEnter={() => setActiveDropdown('resources')} onMouseLeave={() => setActiveDropdown(null)}>
              <button className="flex items-center gap-1.5 text-[14px] font-medium text-muted-foreground hover:text-white transition-colors py-2 group">
                Resources
                <ChevronDown className={cn("w-3.5 h-3.5 opacity-50 transition-transform duration-300", activeDropdown === 'resources' && "rotate-180 opacity-100")} />
              </button>

              {activeDropdown === 'resources' && (
                <div className="absolute top-full right-[-100px] w-[850px] bg-[#050505] border border-white/10 rounded-md p-10 grid grid-cols-[1fr_1fr_1.2fr] gap-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] backdrop-blur-3xl animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="col-span-2"><p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.2em] mb-8">In Scale</p></div>
                  <div className="col-span-1 pl-10"><p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.2em] mb-8">Featured Blog Posts</p></div>

                  <div className="grid grid-cols-2 col-span-2 gap-x-10 gap-y-6">
                    <Link to="/contact" className="flex items-center gap-4 text-gray-300 hover:text-white transition-all hover:translate-x-1"><Mail className="w-[18px] h-[18px] text-muted-foreground" /> <span className="text-[15px]">Contact Us</span></Link>
                    <Link to="/security" className="flex items-center gap-4 text-gray-300 hover:text-white transition-all hover:translate-x-1"><ShieldCheck className="w-[18px] h-[18px] text-muted-foreground" /> <span className="text-[15px]">Security</span></Link>
                    <Link to="/terms" className="flex items-center gap-4 text-gray-300 hover:text-white transition-all hover:translate-x-1"><FileText className="w-[18px] h-[18px] text-muted-foreground" /> <span className="text-[15px]">Terms & Conditions</span></Link>
                    <Link to="/cookies" className="flex items-center gap-4 text-gray-300 hover:text-white transition-all hover:translate-x-1"><Cookie className="w-[18px] h-[18px] text-muted-foreground" /> <span className="text-[15px]">Cookies</span></Link>
                    <Link to="/privacy" className="flex items-center gap-4 text-gray-300 hover:text-white transition-all hover:translate-x-1"><Lock className="w-[18px] h-[18px] text-muted-foreground" /> <span className="text-[15px]">Privacy Policy</span></Link>
                    <Link to="/blog" className="flex items-center gap-4 text-gray-300 hover:text-white transition-all hover:translate-x-1"><BookOpen className="w-[18px] h-[18px] text-muted-foreground" /> <span className="text-[15px]">Blog</span></Link>
                  </div>

                  <div className="featured-section border-l border-white/10 pl-10 flex flex-col gap-8">
                    {[
                      { title: "MoReBench: Evaluating AI Moral Reasoning", img: "https://images.unsplash.com/photo-1614850523296-e8c041de4398?auto=format&fit=crop&q=80&w=300" },
                      { title: "The Agentic Era: Building Foundations", img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=300" }
                    ].map((blog, i) => (
                      <div key={i} className="flex gap-4 relative group cursor-not-allowed">
                        <div className="w-[130px] h-[75px] bg-[#111] rounded-md border border-white/10 overflow-hidden flex-shrink-0">
                          <img src={blog.img} className="w-full h-full object-cover blur-[5px] opacity-30" />
                        </div>
                        <p className="text-[14px] text-white/30 blur-[2.5px] line-clamp-2 leading-tight self-start">{blog.title}</p>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                          <span className="px-2 py-0.5 bg-white text-black text-[9px] font-black uppercase tracking-tighter rounded-sm shadow-xl rotate-[-2deg]">Coming Soon</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link to="/events" className="text-[14px] font-medium text-muted-foreground hover:text-white transition-colors">Events</Link>

            {/* Try CODéVO Play Button */}
            <Button 
              onClick={() => navigate('/practice-arena')}
              variant="outline" 
              className="group border-white/20 bg-transparent hover:bg-white text-white hover:text-black rounded-full px-6 h-10 text-[13px] font-bold transition-all flex items-center gap-2"
            >
              Try CODéVO Play
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-2 shrink-0">
            {session ? (
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-[11px] font-bold text-white border border-white/20">{userName.charAt(0).toUpperCase()}</div>
                    <span className="text-sm font-medium text-gray-200">{userName}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[320px] p-8 bg-[#0a0a0a] border border-[#222222] shadow-[0_40px_80px_rgba(0,0,0,0.9)]">
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#888888] mb-8">Public Profile</p>
                    <div className="bg-white p-4 inline-block mb-6 rounded-sm">
                      <QRCodeSVG value={displayUrl} size={140} />
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-10 group cursor-pointer" onClick={() => { navigator.clipboard.writeText(displayUrl); toast.success('Link copied!'); }}>
                      <p className="text-[#444444] text-[13px] font-medium group-hover:text-[#888888]">{displayUrl}</p>
                    </div>
                    <Link to="/profile" className="w-full block py-4 text-[13px] font-bold uppercase tracking-widest bg-white text-black hover:bg-transparent hover:text-white border border-white transition-all">Edit Profile</Link>
                    <div className="mt-4 pt-4 border-t border-[#222222]">
                      <button onClick={onLogout} className="flex items-center w-full text-white text-[13px] font-medium hover:opacity-60 transition-opacity"><LogOut className="mr-3 w-[18px] h-[18px]" /> Logout</button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <Button size="lg" className="bg-white/10 hover:bg-white/20 text-white rounded-full px-7 font-semibold h-10 transition-all border border-white/10 backdrop-blur-md text-[14px]" onClick={() => navigate('/auth')}>Sign in</Button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
