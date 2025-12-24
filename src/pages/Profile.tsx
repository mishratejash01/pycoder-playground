import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Github, 
  Linkedin, 
  Globe, 
  Edit3, 
  Share2, 
  MapPin, 
  Check, 
  Loader2,
  Copy, 
  Layout, 
  User, 
  Save, 
  Calendar, 
  Ticket, 
  GraduationCap,
  Terminal,
  Cpu,
  ArrowUpRight,
  School,
  Building2,
  Trophy,
  Zap,
  Activity,
  Code2,
  MousePointer2,
  ShieldCheck,
  Radar,
  X
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

// ============================================================================
// 1. TYPE DEFINITIONS (STRICT MODE)
// ============================================================================

interface ProfileData {
  id: string;
  username: string;
  full_name: string;
  institute_name: string;
  degree: string;
  branch: string;
  start_year: number;
  end_year: number;
  country: string;
  github_handle: string;
  linkedin_url: string;
  portfolio_url?: string;
  bio?: string;
  avatar_url?: string;
  contact_no?: string;
  cover_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface Registration {
    id: string;
    status: string;
    participation_type: 'Solo' | 'Team';
    team_name?: string;
    created_at: string;
    event: {
        title: string;
        slug: string;
        image_url: string;
        start_date: string;
        location: string;
    };
}

// ============================================================================
// 2. HIGH-RESOLUTION ASSETS
// ============================================================================

const COVER_TEMPLATES = [
  "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2064&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519608487953-e999c9dc2968?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=2070&auto=format&fit=crop"
];

// ============================================================================
// 3. UI COMPONENTS (VISUAL ARTIFACTS)
// ============================================================================

/**
 * A highly styled container for profile sections.
 * Features a glassmorphic background and subtle border glow.
 */
const GlassPanel = ({ children, className, title, icon: Icon, action }: any) => (
  <div className={cn("relative overflow-hidden rounded-2xl border border-white/5 bg-[#0a0a0c]/60 backdrop-blur-xl transition-all duration-300 hover:border-white/10 group", className)}>
    {/* Internal Glow Gradient */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
    
    {(title || action) && (
      <div className="relative px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#0a0a0c]/40">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-zinc-400 group-hover:text-white group-hover:bg-white/10 transition-colors">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500 group-hover:text-zinc-300 transition-colors">
            {title}
          </span>
        </div>
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="relative p-6">
      {children}
    </div>
  </div>
);

/**
 * An interactive statistic block that lights up on hover.
 */
const StatMatrix = ({ label, value, icon: Icon, trend }: any) => (
  <div className="flex flex-col p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all cursor-default group">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] uppercase font-bold text-zinc-600 tracking-wider group-hover:text-zinc-400 transition-colors">{label}</span>
      <Icon className="w-4 h-4 text-zinc-700 group-hover:text-cyan-400 transition-colors" />
    </div>
    <div className="flex items-end gap-2">
      <span className="text-2xl font-mono font-bold text-white tracking-tight">{value}</span>
      {trend && <span className="text-[10px] text-emerald-500 mb-1">{trend}</span>}
    </div>
  </div>
);

// ============================================================================
// 4. THE PUBLIC PROFILE VIEW (MARKETING / SHAREABLE)
// ============================================================================

const PublicProfileView = ({ 
  profile, 
  isOwner, 
  registrations, 
  onEdit 
}: { 
  profile: ProfileData, 
  isOwner: boolean, 
  registrations: Registration[], 
  onEdit?: () => void 
}) => {
  const [copied, setCopied] = useState(false);

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Identity Link Encrypted & Copied", {
      className: "bg-black text-white border-zinc-800"
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4 md:p-8 animate-in fade-in zoom-in-95 duration-700">
      
      {/* --- HERO SECTION --- */}
      <div className="relative mb-12 group perspective-container">
        
        {/* Cinematic Cover */}
        <div className="relative h-[300px] md:h-[400px] w-full rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[2s] ease-out group-hover:scale-105"
            style={{ backgroundImage: `url('${profile.cover_url || COVER_TEMPLATES[0]}')` }} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-[#020202]/40 to-transparent" />
          
          {/* Holographic Overlay Effect */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay" />
        </div>

        {/* Identity Artifact (Floating Card) */}
        <div className="absolute -bottom-16 left-6 right-6 md:left-12 md:right-auto md:w-[600px] z-20">
          <div className="flex flex-col md:flex-row items-end md:items-center gap-8">
            
            {/* Avatar Housing */}
            <div className="relative group/avatar">
              <div className="absolute -inset-0.5 rounded-[2.5rem] bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 opacity-50 blur-lg group-hover/avatar:opacity-100 transition-opacity duration-700" />
              <Avatar className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] border-4 border-[#020202] bg-[#18181b] relative z-10 shadow-2xl">
                <AvatarImage src={profile.avatar_url} className="object-cover" />
                <AvatarFallback className="rounded-[2rem] bg-zinc-900 text-4xl font-black text-zinc-700">{profile.full_name?.[0]}</AvatarFallback>
              </Avatar>
              
              {/* Online Indicator */}
              <div className="absolute bottom-2 right-2 z-20 w-6 h-6 bg-[#020202] rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
              </div>
            </div>
            
            {/* Text Identity */}
            <div className="mb-4 flex-1 space-y-2">
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-xl">
                {profile.full_name}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline" className="h-7 px-3 rounded-md bg-white/5 border-white/10 text-cyan-400 font-mono text-xs backdrop-blur-md">
                  @{profile.username}
                </Badge>
                {profile.country && (
                  <div className="flex items-center gap-1.5 text-zinc-400 text-sm font-medium px-3 py-1 rounded-md bg-black/40 backdrop-blur-md border border-white/5">
                    <MapPin className="w-3.5 h-3.5 text-red-500" /> {profile.country}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Action Array (Top Right) */}
        <div className="absolute top-6 right-6 flex gap-3 z-30">
          {isOwner && (
            <Button size="sm" onClick={onEdit} className="h-10 px-6 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 text-white hover:bg-white hover:text-black transition-all font-bold tracking-wide shadow-lg">
              <Edit3 className="w-4 h-4 mr-2" /> EDIT_MODE
            </Button>
          )}
          <Button size="icon" onClick={copyUrl} className="h-10 w-10 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 text-white hover:bg-white hover:text-black transition-all shadow-lg">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* --- MAIN GRID SYSTEM --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-24 md:mt-16">
        
        {/* LEFT COLUMN: The Core Data (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* 1. Bio & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassPanel title="Personal Directive" icon={User} className="md:col-span-2">
              {profile.bio ? (
                <p className="text-sm md:text-base text-zinc-300 leading-relaxed font-light">
                  {profile.bio}
                </p>
              ) : (
                <div className="h-24 flex items-center justify-center text-zinc-600 text-sm font-mono border border-dashed border-white/10 rounded-lg">
                  // NO BIOMETRIC DATA AVAILABLE
                </div>
              )}
            </GlassPanel>

            <GlassPanel title="Academic Data" icon={School}>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{profile.institute_name || "Unknown Institute"}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">Alma Mater</div>
                  </div>
                </div>
                <div className="w-full h-px bg-white/5" />
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{profile.degree || "N/A"}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{profile.branch || "General Studies"}</div>
                  </div>
                </div>
              </div>
            </GlassPanel>

            <GlassPanel title="Performance Metrics" icon={Radar}>
              <div className="grid grid-cols-2 gap-3">
                <StatMatrix label="Events" value={registrations.length} icon={Ticket} trend="+12% this month" />
                <StatMatrix label="Reputation" value="850" icon={Trophy} trend="Top 5%" />
                <StatMatrix label="Completion" value="92%" icon={Check} />
                <StatMatrix label="Streak" value="14" icon={Zap} />
              </div>
            </GlassPanel>
          </div>

          {/* 2. Event Timeline */}
          <GlassPanel title="Mission Log" icon={Activity} action={
            <Badge variant="outline" className="border-white/10 bg-white/5 text-zinc-400 font-mono text-[10px]">{registrations.length} ENTRIES</Badge>
          }>
            {registrations.length > 0 ? (
              <div className="relative border-l border-white/10 ml-3 space-y-8 py-2">
                {registrations.map((reg, idx) => (
                  <div key={reg.id} className="relative pl-8 group">
                    {/* Timeline Node */}
                    <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#0a0a0c] border-2 border-zinc-700 group-hover:border-cyan-500 group-hover:scale-125 transition-all" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-lg bg-zinc-900 overflow-hidden shrink-0 border border-white/5">
                            <img src={reg.event.image_url} alt="" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                         </div>
                         <div>
                            <div className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{reg.event.title}</div>
                            <div className="text-xs text-zinc-500 flex items-center gap-2 mt-1 font-mono">
                               <Calendar className="w-3 h-3" />
                               {format(new Date(reg.event.start_date), 'yyyy-MM-dd')}
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                         <div className="hidden sm:flex flex-col items-end gap-1">
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Status</span>
                            <Badge variant="outline" className={cn("h-5 text-[10px] border-zinc-800", reg.status === 'verified' ? "text-emerald-500 bg-emerald-950/30" : "text-amber-500 bg-amber-950/30")}>
                              {reg.status}
                            </Badge>
                         </div>
                         <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-600 hover:text-white">
                            <ChevronRight className="w-4 h-4" />
                         </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-zinc-600 font-mono text-sm border border-dashed border-white/10 rounded-xl">
                 <Ticket className="w-8 h-8 mb-3 opacity-30" />
                 NO MISSION DATA RECORDED
              </div>
            )}
          </GlassPanel>

        </div>

        {/* RIGHT COLUMN: Sidebar (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
           
           {/* Social Matrix */}
           <GlassPanel title="Digital Footprint" icon={Globe}>
              <div className="space-y-3">
                 {/* GitHub Block */}
                 <div className="group relative overflow-hidden p-4 rounded-xl bg-[#181717] border border-white/10 hover:border-white/30 transition-all cursor-pointer">
                    <div className="flex items-center justify-between relative z-10">
                       <div className="flex items-center gap-3">
                          <Github className="w-5 h-5 text-white" />
                          <div>
                             <div className="text-xs font-bold text-white">GitHub</div>
                             <div className="text-[10px] text-zinc-500 font-mono truncate max-w-[120px]">
                               {profile.github_handle ? profile.github_handle : 'Not Linked'}
                             </div>
                          </div>
                       </div>
                       <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                    </div>
                    {profile.github_handle && (
                       <a href={`https://github.com/${profile.github_handle.replace('@','')}`} target="_blank" className="absolute inset-0 z-20" />
                    )}
                 </div>

                 {/* LinkedIn Block */}
                 <div className="group relative overflow-hidden p-4 rounded-xl bg-[#0077b5]/10 border border-[#0077b5]/20 hover:border-[#0077b5]/50 transition-all cursor-pointer">
                    <div className="flex items-center justify-between relative z-10">
                       <div className="flex items-center gap-3">
                          <Linkedin className="w-5 h-5 text-[#0077b5]" />
                          <div>
                             <div className="text-xs font-bold text-white">LinkedIn</div>
                             <div className="text-[10px] text-zinc-500 font-mono">Professional Network</div>
                          </div>
                       </div>
                       <ArrowUpRight className="w-4 h-4 text-[#0077b5]/50 group-hover:text-[#0077b5] transition-colors" />
                    </div>
                    {profile.linkedin_url && (
                       <a href={profile.linkedin_url} target="_blank" className="absolute inset-0 z-20" />
                    )}
                 </div>

                 {/* Portfolio Block */}
                 <div className="group relative overflow-hidden p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 hover:border-emerald-500/50 transition-all cursor-pointer">
                    <div className="flex items-center justify-between relative z-10">
                       <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5 text-emerald-500" />
                          <div>
                             <div className="text-xs font-bold text-white">Portfolio</div>
                             <div className="text-[10px] text-zinc-500 font-mono">External Site</div>
                          </div>
                       </div>
                       <ArrowUpRight className="w-4 h-4 text-emerald-500/50 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    {profile.portfolio_url && (
                       <a href={profile.portfolio_url} target="_blank" className="absolute inset-0 z-20" />
                    )}
                 </div>
              </div>
           </GlassPanel>

           {/* Tech Stack / Meta */}
           <GlassPanel title="System Status" icon={Cpu}>
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500 font-medium">Account Age</span>
                    <span className="text-xs text-white font-mono">
                       {profile.created_at ? format(new Date(profile.created_at), 'yyyy') : '2024'}
                    </span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500 font-medium">Last Sync</span>
                    <span className="text-xs text-green-400 font-mono flex items-center gap-1">
                       <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live
                    </span>
                 </div>
                 <div className="h-px w-full bg-white/5" />
                 <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500 font-medium">Reputation Tier</span>
                    <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/10 text-[9px]">DIAMOND</Badge>
                 </div>
              </div>
           </GlassPanel>

        </div>

      </div>
    </div>
  );
};

// ============================================================================
// 5. THE MAIN CONTAINER (Logic Core)
// ============================================================================

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  
  // -- STATE --
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [originalProfile, setOriginalProfile] = useState<ProfileData | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // For visual asset slider
  const sliderRef = useRef<HTMLDivElement>(null);

  // -- DATA FETCHING --
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        setLoading(true);
        // 1. Get Current User Session
        const { data: { user } } = await supabase.auth.getUser();
        
        let targetProfile: ProfileData | null = null;

        // Case A: No username URL param -> User wants to view/edit their OWN profile
        if (!username) {
          if (!user) { 
            if (isMounted) navigate("/auth"); 
            return; 
          }
          
          // Try to fetch existing profile
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

          if (profileError) throw profileError;
          
          // If no profile exists, create a default structure
          const def: ProfileData = {
              id: user.id,
              username: profileData?.username || "", 
              full_name: profileData?.full_name || user.user_metadata?.full_name || "Operative",
              institute_name: profileData?.institute_name || "",
              degree: profileData?.degree || "",
              branch: profileData?.branch || "",
              start_year: profileData?.start_year || new Date().getFullYear(),
              end_year: profileData?.end_year || new Date().getFullYear() + 4,
              country: profileData?.country || "",
              github_handle: profileData?.github_handle || "",
              linkedin_url: profileData?.linkedin_url || "",
              portfolio_url: profileData?.portfolio_url || "",
              bio: profileData?.bio || "",
              avatar_url: profileData?.avatar_url || user.user_metadata?.avatar_url || "",
              contact_no: profileData?.contact_no || "",
              cover_url: profileData?.cover_url || "",
              created_at: profileData?.created_at,
              updated_at: profileData?.updated_at
          };
          
          if (isMounted) {
            setProfile(def); 
            setOriginalProfile(def); 
            setIsOwner(true);
          }
          
          // Fetch their event history
          const { data: regs } = await supabase.from('event_registrations')
            .select(`*, event:events(*)`)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
            
          if (isMounted && regs) setRegistrations(regs as any);

        } else {
          // Case B: Username URL param -> Viewing SOMEONE ELSE'S profile
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("username", username)
            .maybeSingle();
          
          if (error) throw error;
          
          if (!data) { 
            toast.error("Identity Not Found"); 
            if (isMounted) navigate("/"); 
            return; 
          }
          
          if (isMounted) {
            setProfile(data as ProfileData);
            // Check if I am actually the owner viewing my own public link
            if (user && data.id === user.id) { 
              setIsOwner(true); 
              setOriginalProfile(data as ProfileData); 
            }
            
            // Fetch public event history
            const { data: regs } = await supabase.from('event_registrations')
              .select(`*, event:events(*)`)
              .eq('user_id', data.id)
              .order('created_at', { ascending: false });
            
            if (regs) setRegistrations(regs as any);
          }
        }
      } catch (error: any) {
        console.error("Profile load error:", error);
        toast.error("Failed to load profile data.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();

    return () => { isMounted = false; };
  }, [username, navigate]);

  // -- ACTION HANDLERS --

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try { 
        const { error } = await supabase.from("profiles").upsert({ 
          ...profile, 
          updated_at: new Date().toISOString() 
        }); 
        
        if (error) throw error;
        
        toast.success("Profile Updated Successfully"); 
        setOriginalProfile(profile);
    } catch (e: any) { 
        toast.error("Update Failed: " + e.message); 
    } 
    finally { setIsSaving(false); }
  };

  const handleScrollSlider = (dir: 'left' | 'right') => {
    if (sliderRef.current) {
        const amount = dir === 'left' ? -200 : 200;
        sliderRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // -- LOADING STATE --
  if (loading) {
    return (
      <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center gap-4 text-white">
        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
        <p className="text-xs font-mono text-zinc-500 animate-pulse tracking-widest">DECRYPTING IDENTITY PROTOCOL...</p>
      </div>
    );
  }

  // -- NOT FOUND STATE --
  if (!profile) {
    return (
      <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center text-white">
        <h2 className="text-2xl font-black font-neuropol text-zinc-300">USER NOT FOUND</h2>
        <Button onClick={() => navigate('/')} variant="link" className="text-cyan-500">Return to Base</Button>
      </div>
    );
  }

  // -- RENDER PUBLIC VIEW --
  if (!isOwner) {
    return (
      <div className="min-h-screen bg-[#020202] text-white font-sans relative">
        {/* Background Noise & Gradient */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none" />
        <div className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] bg-purple-900/10 rounded-full blur-[150px] animate-pulse duration-[10000ms]" />
        
        {/* Top Nav */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
           <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all">
                 <Layout className="w-5 h-5 text-zinc-400 group-hover:text-white" />
              </div>
              <span className="font-neuropol font-bold text-lg text-white tracking-widest">CODEVO</span>
           </div>
           <Button onClick={() => navigate('/auth')} className="h-10 px-6 rounded-full bg-cyan-600 text-white hover:bg-cyan-500 font-bold shadow-lg shadow-cyan-900/20">
             Create Profile
           </Button>
        </div>

        <PublicProfileView profile={profile} isOwner={false} registrations={registrations} />
      </div>
    );
  }

  // -- RENDER EDIT VIEW (DASHBOARD) --
  const isDirty = JSON.stringify(profile) !== JSON.stringify(originalProfile);

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-20 font-sans selection:bg-cyan-500/30 relative overflow-hidden">
      
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-900/5 rounded-full blur-[120px]" />
         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <div className="max-w-[1600px] mx-auto px-6 grid grid-cols-1 xl:grid-cols-12 gap-12 relative z-10">
        
        {/* LEFT COLUMN: EDITOR FORM */}
        <div className="xl:col-span-7 space-y-10">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5">
            <div>
              <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                <UserCog className="w-8 h-8 text-cyan-500" /> IDENTITY CONFIG
              </h1>
              <p className="text-zinc-400 text-sm font-mono">Manage your public-facing developer persona.</p>
            </div>
            <div className="flex gap-3">
               <Button onClick={() => navigate(`/u/${profile.username}`)} variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 hover:text-white">
                  <ArrowUpRight className="w-4 h-4 mr-2" /> View Live
               </Button>
               <Button 
                 onClick={handleSave} 
                 disabled={!isDirty || isSaving} 
                 className={cn(
                   "h-10 px-8 rounded-lg font-bold tracking-wide transition-all shadow-lg",
                   isDirty 
                     ? "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-500/20" 
                     : "bg-zinc-800 text-zinc-500 border border-white/5 cursor-not-allowed"
                 )}
               >
                 {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                 {isSaving ? "SYNCING..." : "SAVE CHANGES"}
               </Button>
            </div>
          </div>

          {/* Core Info */}
          <GlassPanel title="Biometric Data" icon={Sparkles}>
             <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <Label className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Display Name</Label>
                   <Input 
                     value={profile.full_name} 
                     onChange={(e) => setProfile({...profile, full_name: e.target.value})} 
                     className="bg-[#0f0f12] border-white/10 h-12 rounded-lg focus:border-cyan-500/50 focus:ring-0 transition-all text-white font-medium" 
                   />
                </div>
                <div className="space-y-2">
                   <Label className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Username</Label>
                   <div className="relative">
                      <span className="absolute left-4 top-3.5 text-zinc-500 font-mono">@</span>
                      <Input 
                        value={profile.username} 
                        onChange={(e) => setProfile({...profile, username: e.target.value})} 
                        className="bg-[#0f0f12] border-white/10 h-12 rounded-lg pl-8 focus:border-cyan-500/50 focus:ring-0 transition-all text-white font-mono" 
                      />
                   </div>
                </div>
                <div className="col-span-2 space-y-2">
                   <Label className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Directives (Bio)</Label>
                   <Textarea 
                     value={profile.bio || ''} 
                     onChange={(e) => setProfile({...profile, bio: e.target.value})} 
                     className="bg-[#0f0f12] border-white/10 min-h-[120px] rounded-lg focus:border-cyan-500/50 focus:ring-0 transition-all text-zinc-300 leading-relaxed p-4 resize-none" 
                     placeholder="Brief description of your skills and mission..." 
                   />
                </div>
             </div>
          </GlassPanel>

          {/* Visual Assets */}
          <GlassPanel title="Aesthetic Modules" icon={Layout}>
             <div className="space-y-4">
                <div className="relative h-48 rounded-xl overflow-hidden border border-white/10 group cursor-pointer shadow-lg">
                   <div className="absolute inset-0 bg-cover bg-center transition-all duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${profile.cover_url || COVER_TEMPLATES[0]}')` }} />
                   <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <span className="text-xs font-bold text-white uppercase tracking-widest border border-white/20 px-4 py-2 rounded-full bg-white/10">Select Below</span>
                   </div>
                </div>
                
                <div className="relative">
                   <div className="flex gap-3 overflow-x-auto pb-4 pt-2 px-1 no-scrollbar snap-x" ref={sliderRef}>
                      {COVER_TEMPLATES.map((url, i) => (
                         <div 
                           key={i} 
                           onClick={() => setProfile({...profile, cover_url: url})} 
                           className={cn(
                             "flex-shrink-0 w-32 aspect-video rounded-lg bg-cover bg-center cursor-pointer border-2 transition-all hover:scale-105 snap-start shadow-md", 
                             profile.cover_url === url ? "border-cyan-500 ring-2 ring-cyan-500/20 scale-105" : "border-transparent opacity-60 hover:opacity-100"
                           )} 
                           style={{ backgroundImage: `url('${url}')` }} 
                         />
                      ))}
                   </div>
                   {/* Scroll Hints */}
                   <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#0a0a0c]/90 to-transparent pointer-events-none" />
                   <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#0a0a0c]/90 to-transparent pointer-events-none" />
                </div>
             </div>
          </GlassPanel>

          {/* Education */}
          <GlassPanel title="Education Matrix" icon={GraduationCap}>
             <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <Label className="text-xs text-zinc-500">Institution</Label>
                   <Input value={profile.institute_name} onChange={(e) => setProfile({...profile, institute_name: e.target.value})} className="bg-[#0f0f12] border-white/10" />
                </div>
                <div className="space-y-2">
                   <Label className="text-xs text-zinc-500">Degree</Label>
                   <Input value={profile.degree} onChange={(e) => setProfile({...profile, degree: e.target.value})} className="bg-[#0f0f12] border-white/10" />
                </div>
                <div className="space-y-2">
                   <Label className="text-xs text-zinc-500">Branch</Label>
                   <Input value={profile.branch} onChange={(e) => setProfile({...profile, branch: e.target.value})} className="bg-[#0f0f12] border-white/10" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <Label className="text-xs text-zinc-500">Start Year</Label>
                      <Input type="number" value={profile.start_year} onChange={(e) => setProfile({...profile, start_year: parseInt(e.target.value)})} className="bg-[#0f0f12] border-white/10" />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-xs text-zinc-500">End Year</Label>
                      <Input type="number" value={profile.end_year} onChange={(e) => setProfile({...profile, end_year: parseInt(e.target.value)})} className="bg-[#0f0f12] border-white/10" />
                   </div>
                </div>
             </div>
          </GlassPanel>

          {/* Social Links */}
          <GlassPanel title="Network Uplinks" icon={Share2}>
             <div className="grid gap-4">
                <div className="flex items-center gap-3 bg-[#0f0f12] p-3 rounded-lg border border-white/5 focus-within:border-cyan-500/50 transition-colors">
                   <Github className="w-5 h-5 text-white" />
                   <Input 
                     placeholder="GitHub Handle" 
                     value={profile.github_handle} 
                     onChange={(e) => setProfile({...profile, github_handle: e.target.value})} 
                     className="border-none bg-transparent h-auto p-0 focus-visible:ring-0 text-sm font-mono placeholder:text-zinc-700" 
                   />
                </div>
                <div className="flex items-center gap-3 bg-[#0f0f12] p-3 rounded-lg border border-white/5 focus-within:border-[#0077b5]/50 transition-colors">
                   <Linkedin className="w-5 h-5 text-[#0077b5]" />
                   <Input 
                     placeholder="LinkedIn URL" 
                     value={profile.linkedin_url} 
                     onChange={(e) => setProfile({...profile, linkedin_url: e.target.value})} 
                     className="border-none bg-transparent h-auto p-0 focus-visible:ring-0 text-sm font-mono placeholder:text-zinc-700" 
                   />
                </div>
                <div className="flex items-center gap-3 bg-[#0f0f12] p-3 rounded-lg border border-white/5 focus-within:border-emerald-500/50 transition-colors">
                   <Globe className="w-5 h-5 text-emerald-500" />
                   <Input 
                     placeholder="Portfolio URL" 
                     value={profile.portfolio_url} 
                     onChange={(e) => setProfile({...profile, portfolio_url: e.target.value})} 
                     className="border-none bg-transparent h-auto p-0 focus-visible:ring-0 text-sm font-mono placeholder:text-zinc-700" 
                   />
                </div>
             </div>
          </GlassPanel>

        </div>

        {/* RIGHT COLUMN: LIVE PREVIEW (STICKY) */}
        <div className="xl:col-span-5 hidden xl:block">
           <div className="sticky top-32 space-y-8">
              <div className="flex items-center justify-between">
                 <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                    </span>
                    Live Artifact Rendering
                 </h2>
              </div>
              
              <div className="transform hover:scale-[1.02] transition-transform duration-700">
                 <PublicProfileView profile={profile} isOwner={true} registrations={registrations} />
              </div>

              {/* Tips */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-900/10 to-transparent border border-blue-500/20 flex gap-4">
                 <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 h-fit">
                    <ShieldCheck className="w-5 h-5" />
                 </div>
                 <div className="space-y-1">
                    <h4 className="text-sm font-bold text-blue-200">Optimization Protocol</h4>
                    <p className="text-xs text-blue-300/60 leading-relaxed">
                       Complete your bio and add social links to increase your "Trust Factor". High-trust profiles get priority in matchmaking.
                    </p>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
