import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Github, 
  Linkedin, 
  Globe, 
  Edit2, 
  Share2, 
  MapPin, 
  Check,
  Loader2,
  MessageSquareText,
  Phone,
  ArrowRight,
  Link as LinkIcon,
  Copy,
  LayoutTemplate,
  X,
  Save,
  RotateCcw
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- Types ---
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
}

// --- Constants: Premium Abstract Covers ---
const COVER_TEMPLATES = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2064&auto=format&fit=crop", // Dark Fluid
  "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2070&auto=format&fit=crop", // Liquid Pink/Blue
  "https://images.unsplash.com/photo-1634152962476-4b8a00e1915c?q=80&w=2068&auto=format&fit=crop", // Dark Abstract 3D
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop", // Cyberpunk Blue
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070&auto=format&fit=crop", // Gradient Texture
  "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop", // Purple Mesh
  "https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=2074&auto=format&fit=crop", // Neon Red/Black
  "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop", // Retro Grid
  "https://images.unsplash.com/photo-1492321936769-b49830bc1d1e?q=80&w=1974&auto=format&fit=crop", // Concrete Dark
  "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=1974&auto=format&fit=crop", // Dark Fabric
];

// --- Helper Functions ---
const getLinkedInUsername = (url?: string) => {
  if (!url) return null;
  const match = url.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/);
  return match ? match[1] : null;
};

// --- SUB-COMPONENT: Social Edit Block ---
const SocialEditBlock = ({ 
  icon: Icon, 
  label, 
  value, 
  onChange, 
  colorClass 
}: { 
  icon: any, 
  label: string, 
  value: string, 
  onChange: (val: string) => void,
  colorClass: string
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  // Sync temp value if prop changes (e.g. reset)
  useEffect(() => setTempValue(value), [value]);

  const handleSave = () => {
    onChange(tempValue);
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#121214] border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden">
      {/* Icon Area */}
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors z-10", colorClass, "bg-white/5 text-gray-400 group-hover:text-white")}>
        <Icon className="w-6 h-6" />
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0 z-10">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        
        {isEditing ? (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
            <Input 
              value={tempValue} 
              onChange={(e) => setTempValue(e.target.value)} 
              className="h-8 bg-black/50 border-white/20 text-sm focus-visible:ring-primary/50"
              placeholder={`Paste ${label}...`}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <Button size="icon" className="h-8 w-8 bg-green-600 hover:bg-green-700 shrink-0" onClick={handleSave}>
              <Check className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/10 shrink-0" onClick={() => setIsEditing(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <p 
            className="text-sm text-white font-medium truncate font-mono cursor-pointer hover:text-primary transition-colors" 
            onClick={() => setIsEditing(true)}
            title={value}
          >
            {value || <span className="text-white/20 italic">Not connected</span>}
          </p>
        )}
      </div>

      {/* Edit Trigger (Only visible when not editing) */}
      {!isEditing && (
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-9 w-9 text-white/30 hover:text-white hover:bg-white/10 z-10" 
          onClick={() => setIsEditing(true)}
        >
          <Edit2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

// --- SUB-COMPONENT: Profile Card (The Visual Output) ---
const ProfileCardContent = ({ profile, isOwner, onEdit }: { profile: ProfileData, isOwner: boolean, onEdit?: () => void }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const navigate = useNavigate();

  const copyProfileLink = () => {
    const url = `${window.location.origin}/u/${profile.username}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    toast.success("Profile link copied!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleLinkClick = () => {
    const url = `${window.location.origin}/u/${profile.username}`;
    navigator.clipboard.writeText(url);
    setIsLinkCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setIsLinkCopied(false), 2000);
  };

  const displayUrl = `${window.location.host}/u/${profile.username}`;
  const linkedInUser = getLinkedInUsername(profile.linkedin_url);
  
  const avatarSources = [
    profile.avatar_url,
    linkedInUser ? `https://unavatar.io/linkedin/${linkedInUser}` : null,
    `https://ui-avatars.com/api/?name=${profile.full_name}&background=random`
  ].filter(Boolean) as string[];

  return (
    <div className="h-full w-full bg-[#0c0c0e] text-white rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans border border-white/10 relative">
      <div className="flex-1 overflow-y-auto relative no-scrollbar">
        
        {/* Banner */}
        <div className="relative h-48 bg-cover bg-center shrink-0" style={{ backgroundImage: `url('${profile.cover_url || COVER_TEMPLATES[0]}')` }}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"></div>
          
          <div className="absolute inset-x-0 top-0 p-5 flex justify-between items-start text-white z-10">
            <div className="flex items-center mt-1">
              <span className="font-neuropol font-bold text-lg tracking-widest text-white/90 drop-shadow-md">
                COD<span className="text-[1.2em] lowercase relative -top-[1px] mx-[1px] inline-block text-white">é</span>VO
              </span>
            </div>
            <div className="flex gap-2">
              {isOwner && onEdit && (
                <button onClick={onEdit} className="p-2 rounded-full hover:bg-white/20 transition-colors bg-black/20 backdrop-blur-md border border-white/10">
                  <Edit2 className="w-4 h-4 text-white" />
                </button>
              )}
              {/* Redmi Style Share Button */}
              <button onClick={copyProfileLink} className="p-2 rounded-full hover:bg-white/20 transition-colors bg-black/20 backdrop-blur-md border border-white/10">
                {isCopied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-8 relative">
          <div className="-mt-16 mb-4 relative z-20 flex justify-center">
            <Avatar className="w-32 h-32 border-[4px] border-[#0c0c0e] shadow-2xl ring-1 ring-white/10 bg-[#1a1a1c]">
              {avatarSources.map((src) => <AvatarImage key={src} src={src} className="object-cover" />)}
              <AvatarFallback className="bg-[#1a1a1c] text-4xl font-bold text-white/40">{profile.full_name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{profile.full_name}</h1>
            
            <div onClick={handleLinkClick} className="mt-2 inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
              {isLinkCopied ? <Check className="w-3 h-3 text-green-400" /> : <LinkIcon className="w-3 h-3 text-white/50 group-hover:text-white" />}
              <span className="text-sm font-medium text-white/70 group-hover:text-white truncate max-w-[200px]">{displayUrl}</span>
              <Copy className="w-3 h-3 text-white/30 group-hover:text-white/70 ml-1" />
            </div>

            {profile.country && (
              <div className="mt-2 flex items-center justify-center gap-1.5 text-gray-500 text-xs font-medium uppercase tracking-wider">
                <MapPin className="w-3 h-3" /><span>{profile.country}</span>
              </div>
            )}

            {profile.bio && (
              <div className="mt-5 text-gray-400 text-sm leading-relaxed text-center px-2 line-clamp-4">
                <p>{profile.bio}</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {profile.github_handle && (
              <a href={`https://github.com/${profile.github_handle.replace(/^@/, '')}`} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#24292e] hover:text-white hover:border-transparent transition-all shadow-sm"><Github className="w-6 h-6" /></a>
            )}
            {profile.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#0077b5] hover:text-white hover:border-transparent transition-all shadow-sm"><Linkedin className="w-6 h-6" /></a>
            )}
            {profile.portfolio_url && (
              <a href={profile.portfolio_url} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-gray-400 hover:bg-emerald-600 hover:text-white hover:border-transparent transition-all shadow-sm"><Globe className="w-6 h-6" /></a>
            )}
          </div>
        </div>

        <div className="px-8"><div className="w-full h-px bg-white/5" /></div>

        {profile.institute_name && (
          <div className="p-6 text-center">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600 mb-3">Education</h2>
            <div className="inline-block text-center">
              <p className="font-bold text-cyan-400 text-base leading-tight">{profile.institute_name}</p>
              <p className="text-xs text-gray-400 mt-1 font-medium">{profile.degree} • {profile.branch}</p>
              <p className="text-[10px] text-gray-600 mt-1.5">{profile.start_year} - {profile.end_year}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Widget Component (Landing Page Popup) ---
export const HitMeUpWidget = ({ defaultUsername = "mishratejash01" }) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => { supabase.auth.getSession().then(({ data: { session } }) => setSession(session)); }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      let query = supabase.from("profiles").select("*");
      if (session?.user?.id) query = query.eq("id", session.user.id);
      else query = query.eq("username", defaultUsername);
      const { data } = await query.single();
      if (data) setProfile(data as ProfileData);
    };
    fetchProfile();
  }, [session, defaultUsername]);

  useEffect(() => {
    const handleScroll = () => setIsVisible(window.scrollY > window.innerHeight * 0.6);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!profile) return null;

  const isProfileComplete = !!(profile.bio && profile.institute_name && profile.github_handle);
  const isOwner = session?.user?.id === profile.id;

  return (
    <div className={cn("hidden md:block fixed right-0 top-1/2 -translate-y-1/2 z-[9999] font-sans transition-all duration-500 ease-in-out transform", isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none")}>
      <Sheet>
        <SheetTrigger asChild>
          <Button className="h-auto py-8 pl-1 pr-1 rounded-l-2xl rounded-r-none bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_25px_rgba(37,99,235,0.4)] border-y border-l border-white/20 transition-all hover:pr-3" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
            <div className="flex items-center justify-center gap-3 py-2 rotate-180"><MessageSquareText className="w-5 h-5 -rotate-90" /><span className="text-sm font-bold tracking-[0.15em] whitespace-nowrap">HIT ME UP</span></div>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="bg-transparent border-none shadow-none w-[380px] p-0 z-[10000] flex items-center h-full mr-4 [&>button]:hidden focus:outline-none">
           <div className="w-full h-[80vh] relative flex flex-col">
             <ProfileCardContent profile={profile} isOwner={false} />
             
             {/* Smart Action Button */}
             <div className="mt-4">
               {isOwner && !isProfileComplete ? (
                 <Button onClick={() => navigate('/profile')} className="w-full h-12 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold shadow-lg hover:shadow-orange-500/20 transition-all hover:scale-[1.02]">
                   <span className="mr-2">⚠️</span> Complete Your Profile
                 </Button>
               ) : (
                 <Button onClick={() => navigate(`/u/${profile.username}`)} className="w-full h-12 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-all hover:scale-[1.02] shadow-lg">
                   View Full Profile <ArrowRight className="w-4 h-4 ml-2" />
                 </Button>
               )}
             </div>
           </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

// --- Main Page Component (Editor) ---
const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dbProfile, setDbProfile] = useState<ProfileData | null>(null); // Real DB data
  const [draftProfile, setDraftProfile] = useState<ProfileData | null>(null); // Local editing state
  const [isOwner, setIsOwner] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!username) {
        if (!currentUser) { navigate("/auth"); return; }
        const { data: myProfile } = await supabase.from("profiles").select("username").eq("id", currentUser.id).single();
        if (myProfile?.username) navigate(`/u/${myProfile.username}`, { replace: true });
        return;
      }
      const { data, error } = await supabase.from("profiles").select("*").eq("username", username).single();
      if (error || !data) { toast.error("Profile not found"); navigate("/"); return; }
      
      setDbProfile(data as ProfileData);
      setDraftProfile(data as ProfileData);
      if (currentUser && data.id === currentUser.id) setIsOwner(true);
      setLoading(false);
    };
    init();
  }, [username, navigate]);

  // Update Draft State (Instant Preview)
  const handleDraftUpdate = (field: keyof ProfileData, value: string) => {
    if (!draftProfile) return;
    const updated = { ...draftProfile, [field]: value };
    setDraftProfile(updated);
    setHasChanges(true);
  };

  // Push to DB (Save)
  const saveChanges = async () => {
    if (!draftProfile) return;
    try {
      const { error } = await supabase.from("profiles").update({
        bio: draftProfile.bio,
        github_handle: draftProfile.github_handle,
        linkedin_url: draftProfile.linkedin_url,
        portfolio_url: draftProfile.portfolio_url,
        cover_url: draftProfile.cover_url,
        // Add other editable fields here
      }).eq("id", draftProfile.id);

      if (error) throw error;
      setDbProfile(draftProfile);
      setHasChanges(false);
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to save changes");
    }
  };

  const discardChanges = () => {
    setDraftProfile(dbProfile);
    setHasChanges(false);
    toast.info("Changes discarded");
  };

  if (loading) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  if (!draftProfile) return null;

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
        <div className="w-full max-w-sm"><ProfileCardContent profile={draftProfile} isOwner={false} /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white pt-24 pb-12 px-4 md:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative">
        
        {/* LEFT: Editor (Scrollable) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-10">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Edit Profile</h1>
              <p className="text-muted-foreground">Customize your public presence.</p>
            </div>
            
            {/* Save Actions */}
            {hasChanges && (
              <div className="flex gap-2 animate-in fade-in slide-in-from-right-4">
                <Button variant="outline" onClick={discardChanges} className="border-red-500/20 hover:bg-red-500/10 text-red-400">
                  <RotateCcw className="w-4 h-4 mr-2" /> Discard
                </Button>
                <Button onClick={saveChanges} className="bg-primary hover:bg-primary/90 text-white min-w-[140px]">
                  <Save className="w-4 h-4 mr-2" /> Save Changes
                </Button>
              </div>
            )}
          </div>
          
          {/* Visuals */}
          <div className="space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Visuals</h2>
            <div className="relative rounded-2xl overflow-hidden border border-white/10 group">
              <div className="h-64 w-full bg-cover bg-center transition-all duration-500" style={{ backgroundImage: `url('${draftProfile.cover_url || COVER_TEMPLATES[0]}')` }}>
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
              </div>
              <div className="absolute bottom-6 left-8 flex items-end gap-6">
                <Avatar className="w-32 h-32 border-4 border-[#09090b] shadow-2xl">
                  <AvatarImage src={draftProfile.avatar_url || `https://ui-avatars.com/api/?name=${draftProfile.full_name}&background=random`} className="object-cover" />
                  <AvatarFallback className="bg-[#1a1a1c] text-3xl font-bold">{draftProfile.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="mb-4 text-shadow-md">
                  <h2 className="text-2xl font-bold text-white">{draftProfile.full_name}</h2>
                  <p className="text-primary font-medium">@{draftProfile.username}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Blocks */}
          <div className="space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Social & Links</h2>
            <div className="grid gap-4">
              <SocialEditBlock icon={Github} label="GitHub Profile" value={draftProfile.github_handle || ''} onChange={(v) => handleDraftUpdate('github_handle', v)} colorClass="group-hover:bg-[#24292e] group-hover:text-white" />
              <SocialEditBlock icon={Linkedin} label="LinkedIn URL" value={draftProfile.linkedin_url || ''} onChange={(v) => handleDraftUpdate('linkedin_url', v)} colorClass="group-hover:bg-[#0077b5] group-hover:text-white" />
              <SocialEditBlock icon={Globe} label="Portfolio URL" value={draftProfile.portfolio_url || ''} onChange={(v) => handleDraftUpdate('portfolio_url', v)} colorClass="group-hover:bg-emerald-600 group-hover:text-white" />
            </div>
          </div>

          {/* Bio Edit */}
          <div className="space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">About You</h2>
            <div className="relative">
              <Textarea 
                value={draftProfile.bio || ''} 
                onChange={(e) => handleDraftUpdate('bio', e.target.value)} 
                className="min-h-[150px] bg-[#121214] border-white/5 focus:border-primary/50 text-base leading-relaxed p-6 rounded-2xl resize-none shadow-inner" 
                placeholder="Tell the world who you are..." 
              />
            </div>
          </div>
          
          {/* Cover Templates */}
          <div className="space-y-6 pb-20">
             <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2"><LayoutTemplate className="w-4 h-4" /> Cover Templates</h2>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {COVER_TEMPLATES.map((url, i) => (
                  <div key={i} onClick={() => handleDraftUpdate('cover_url', url)} className={cn("aspect-video rounded-lg bg-cover bg-center cursor-pointer border-2 transition-all hover:scale-105", draftProfile.cover_url === url ? "border-primary shadow-[0_0_15px_rgba(139,92,246,0.5)]" : "border-transparent opacity-70 hover:opacity-100")} style={{ backgroundImage: `url('${url}')` }} />
                ))}
             </div>
          </div>
        </div>

        {/* RIGHT: Live Preview (Sticky) */}
        <div className="lg:col-span-5 xl:col-span-4 relative hidden lg:block">
          <div className="sticky top-28 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live Preview</h2>
              {hasChanges && <span className="text-xs text-yellow-500 font-medium animate-pulse">Unsaved Changes</span>}
            </div>
            <div className="transform transition-transform hover:scale-[1.02] duration-500">
              <ProfileCardContent profile={draftProfile} isOwner={true} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
