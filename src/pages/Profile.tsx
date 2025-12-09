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
  Save,
  X,
  ImageIcon,
  LayoutTemplate
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
  cover_url?: string; // Added for cover photo support
}

// --- Constants ---
const COVER_TEMPLATES = [
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070&auto=format&fit=crop", // Gradient Blue/Pink
  "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2070&auto=format&fit=crop", // Abstract Liquid
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2064&auto=format&fit=crop", // Dark Fluid
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop", // Cyberpunk City
  "https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?q=80&w=2070&auto=format&fit=crop", // Golden Particles
  "https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=2074&auto=format&fit=crop", // Neon Code
  "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop", // Retro Grid
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop", // Deep Space
  "https://images.unsplash.com/photo-1519638399535-1b036603ac77?q=80&w=1931&auto=format&fit=crop", // White Marble
  "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop", // Dark Gradient
  "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop", // Purple Mesh
  "https://images.unsplash.com/photo-1506318137071-a8bcbf6755dd?q=80&w=2070&auto=format&fit=crop", // Dark Leaves
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

  const handleSave = () => {
    onChange(tempValue);
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#121214] border border-white/5 hover:border-white/10 transition-all group">
      {/* Icon */}
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors", colorClass, "bg-white/5 text-gray-400 group-hover:text-white")}>
        <Icon className="w-6 h-6" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input 
              value={tempValue} 
              onChange={(e) => setTempValue(e.target.value)} 
              className="h-8 bg-black/50 border-white/20 text-sm focus-visible:ring-primary/50"
              placeholder={`Enter ${label}...`}
              autoFocus
            />
            <Button size="icon" className="h-8 w-8 bg-green-600 hover:bg-green-700" onClick={handleSave}>
              <Check className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/10" onClick={() => setIsEditing(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <p className="text-sm text-white font-medium truncate font-mono">
            {value || <span className="text-white/20 italic">Not connected</span>}
          </p>
        )}
      </div>

      {/* Edit Trigger */}
      {!isEditing && (
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-9 w-9 text-white/30 hover:text-white hover:bg-white/10" 
          onClick={() => setIsEditing(true)}
        >
          <Edit2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

// --- SUB-COMPONENT: Preview Card (The "Output") ---
const ProfilePreviewCard = ({ profile }: { profile: ProfileData }) => {
  const linkedInUser = getLinkedInUsername(profile.linkedin_url);
  const avatarSources = [
    profile.avatar_url,
    linkedInUser ? `https://unavatar.io/linkedin/${linkedInUser}` : null,
    `https://unavatar.io/${profile.username}`,
    `https://ui-avatars.com/api/?name=${profile.full_name}&background=random`
  ].filter(Boolean) as string[];

  // Display URL (clean)
  const displayUrl = `${window.location.host}/u/${profile.username}`;

  return (
    <div className="w-full bg-[#0c0c0e] text-white rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans border border-white/10">
      {/* Banner */}
      <div className="relative h-40 bg-cover bg-center shrink-0" style={{ backgroundImage: `url('${profile.cover_url || COVER_TEMPLATES[0]}')` }}>
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"></div>
        <div className="absolute top-4 left-5 z-10">
          <span className="font-neuropol font-bold text-lg tracking-widest text-white/90 drop-shadow-md">
            CODÉVO
          </span>
        </div>
      </div>

      <div className="px-6 pb-8 relative bg-[#0c0c0e]">
        {/* Avatar */}
        <div className="-mt-16 mb-4 relative z-20 flex justify-center">
          <Avatar className="w-32 h-32 border-[4px] border-[#0c0c0e] shadow-xl ring-1 ring-white/10 bg-[#1a1a1c]">
            {avatarSources.map((src) => (
              <AvatarImage key={src} src={src} className="object-cover" />
            ))}
            <AvatarFallback className="bg-[#1a1a1c] text-3xl font-bold text-white/50">
              {profile.full_name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Info */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">{profile.full_name}</h2>
          <div className="mt-2 inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
            <LinkIcon className="w-3 h-3 text-white/50" />
            <span className="text-xs font-mono text-white/70">{displayUrl}</span>
          </div>
          {profile.country && (
            <div className="mt-3 flex items-center justify-center gap-1.5 text-gray-500 text-xs font-medium uppercase tracking-wider">
              <MapPin className="w-3 h-3" />
              <span>{profile.country}</span>
            </div>
          )}
          {profile.bio && (
            <div className="mt-5 text-gray-400 text-sm leading-relaxed px-2 line-clamp-3">
              {profile.bio}
            </div>
          )}
        </div>

        {/* Socials Row (Rectangular) */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {profile.github_handle && (
            <div className="w-10 h-10 rounded-xl bg-[#24292e]/20 border border-white/10 flex items-center justify-center text-gray-400">
              <Github className="w-5 h-5" />
            </div>
          )}
          {profile.linkedin_url && (
            <div className="w-10 h-10 rounded-xl bg-[#0077b5]/20 border border-white/10 flex items-center justify-center text-gray-400">
              <Linkedin className="w-5 h-5" />
            </div>
          )}
          {profile.portfolio_url && (
            <div className="w-10 h-10 rounded-xl bg-emerald-900/20 border border-white/10 flex items-center justify-center text-gray-400">
              <Globe className="w-5 h-5" />
            </div>
          )}
        </div>

        {/* Education */}
        {profile.institute_name && (
          <>
            <div className="w-full h-px bg-white/5 mb-6" />
            <div className="text-center">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600 mb-2">Education</h3>
              <p className="font-bold text-cyan-400 text-sm">{profile.institute_name}</p>
              <p className="text-xs text-gray-500 mt-1">{profile.degree} • {profile.branch}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// --- Page Component (The Editor) ---

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  // Fetch Logic
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
      
      if (error || !data) {
        toast.error("Profile not found");
        navigate("/");
        return;
      }

      setProfile(data as ProfileData);
      if (currentUser && data.id === currentUser.id) setIsOwner(true);
      setLoading(false);
    };
    init();
  }, [username, navigate]);

  // Real-time Update Handler
  const updateProfile = async (field: keyof ProfileData, value: string) => {
    if (!profile) return;
    
    // Optimistic Update
    const updatedProfile = { ...profile, [field]: value };
    setProfile(updatedProfile);

    // DB Update
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ [field]: value })
        .eq("id", profile.id);
      
      if (error) throw error;
      toast.success("Saved", { position: "bottom-right", duration: 1000 });
    } catch (err) {
      toast.error("Failed to save");
      // Revert on fail? (Simplified for now)
    }
  };

  if (loading) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  if (!profile) return null;

  // If not owner, just show the card centered (Public View)
  if (!isOwner) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <ProfilePreviewCard profile={profile} />
        </div>
      </div>
    );
  }

  // Owner View: Split Editor
  return (
    <div className="min-h-screen bg-[#09090b] text-white pt-24 pb-12 px-4 md:px-8 lg:px-12">
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* --- LEFT SIDE: EDITOR (65%) --- */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-10">
          
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Edit Profile</h1>
            <p className="text-muted-foreground">Customize your public presence. Changes save automatically.</p>
          </div>

          {/* Cover & Avatar Section */}
          <div className="space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Visuals</h2>
            
            <div className="relative rounded-2xl overflow-hidden border border-white/10 group">
              {/* Cover */}
              <div 
                className="h-64 w-full bg-cover bg-center transition-all duration-500" 
                style={{ backgroundImage: `url('${profile.cover_url || COVER_TEMPLATES[0]}')` }}
              >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
              </div>

              {/* Avatar Overlay */}
              <div className="absolute bottom-6 left-8 flex items-end gap-6">
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-[#09090b] shadow-2xl">
                    <AvatarImage src={profile.avatar_url || `https://unavatar.io/${profile.username}`} className="object-cover" />
                    <AvatarFallback className="bg-[#1a1a1c] text-3xl font-bold">{profile.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {/* Avatar Edit Hint (Visual only for now, real logic implies upload) */}
                  <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                    <ImageIcon className="w-8 h-8 text-white/80" />
                  </div>
                </div>
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-white">{profile.full_name}</h2>
                  <p className="text-primary font-medium">@{profile.username}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Blocks */}
          <div className="space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Social & Links</h2>
            <div className="grid gap-4">
              <SocialEditBlock 
                icon={Github} 
                label="GitHub Profile" 
                value={profile.github_handle || ''} 
                onChange={(v) => updateProfile('github_handle', v)}
                colorClass="group-hover:bg-[#24292e] group-hover:text-white"
              />
              <SocialEditBlock 
                icon={Linkedin} 
                label="LinkedIn URL" 
                value={profile.linkedin_url || ''} 
                onChange={(v) => updateProfile('linkedin_url', v)}
                colorClass="group-hover:bg-[#0077b5] group-hover:text-white"
              />
              <SocialEditBlock 
                icon={Globe} 
                label="Portfolio URL" 
                value={profile.portfolio_url || ''} 
                onChange={(v) => updateProfile('portfolio_url', v)}
                colorClass="group-hover:bg-emerald-600 group-hover:text-white"
              />
            </div>
          </div>

          {/* Bio Edit */}
          <div className="space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">About You</h2>
            <div className="relative">
              <Textarea 
                value={profile.bio || ''} 
                onChange={(e) => updateProfile('bio', e.target.value)}
                className="min-h-[150px] bg-[#121214] border-white/5 focus:border-primary/50 text-base leading-relaxed p-6 rounded-2xl resize-none"
                placeholder="Tell the world who you are..."
              />
              <div className="absolute bottom-4 right-4 text-xs text-muted-foreground pointer-events-none">Markdown supported</div>
            </div>
          </div>

        </div>

        {/* --- RIGHT SIDE: PREVIEW & TEMPLATES (35%) --- */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-10">
          
          {/* Live Preview Card */}
          <div className="sticky top-28 space-y-8">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Live Preview
              </h2>
              <div className="transform transition-transform hover:scale-[1.02] duration-500">
                <ProfilePreviewCard profile={profile} />
              </div>
            </div>

            {/* Cover Templates */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4" />
                Cover Templates
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {COVER_TEMPLATES.map((url, i) => (
                  <div 
                    key={i} 
                    onClick={() => updateProfile('cover_url', url)}
                    className={cn(
                      "aspect-video rounded-lg bg-cover bg-center cursor-pointer border-2 transition-all hover:scale-105",
                      profile.cover_url === url ? "border-primary shadow-[0_0_15px_rgba(139,92,246,0.5)]" : "border-transparent opacity-70 hover:opacity-100"
                    )}
                    style={{ backgroundImage: `url('${url}')` }}
                  />
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

// --- Widget Export (For Landing Page) ---
export const HitMeUpWidget = ({ defaultUsername = "mishratejash01" }) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [session, setSession] = useState<any>(null);

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

  return (
    <div className={cn("hidden md:block fixed right-0 top-1/2 -translate-y-1/2 z-[9999] font-sans transition-all duration-500 ease-in-out transform", isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none")}>
      <Sheet>
        <SheetTrigger asChild>
          <Button className="h-auto py-8 pl-1 pr-1 rounded-l-2xl rounded-r-none bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_25px_rgba(37,99,235,0.4)] border-y border-l border-white/20 transition-all hover:pr-3" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
            <div className="flex items-center justify-center gap-3 py-2 rotate-180"><MessageSquareText className="w-5 h-5 -rotate-90" /><span className="text-sm font-bold tracking-[0.15em] whitespace-nowrap">HIT ME UP</span></div>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="bg-transparent border-none shadow-none w-[380px] p-0 z-[10000] flex items-center h-full mr-4 [&>button]:hidden focus:outline-none">
           <div className="w-full h-[80vh]"><ProfilePreviewCard profile={profile} /></div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Profile;
