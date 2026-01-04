import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ChevronLeft, 
  X, 
  Github, 
  Linkedin, 
  Globe, 
  MapPin, 
  Check, 
  Link as LinkIcon, 
  Copy, 
  Share, 
  Edit2,
  UserCog,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

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

const COVER_TEMPLATES = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2064&auto=format&fit=crop"
];

const getLinkedInUsername = (url?: string) => {
  if (!url) return null;
  const match = url.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/);
  return match ? match[1] : null;
};

export function HitMeUpWidget({ defaultUsername = "mishratejash01" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [session, setSession] = useState<any>(null);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { 
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session)); 
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      let query = supabase.from("profiles").select("*");
      if (session?.user?.id) query = query.eq("id", session.user.id);
      else query = query.eq("username", defaultUsername);
      
      const { data } = await query.maybeSingle();
      if (data) setProfile(data as ProfileData);
    };
    fetchProfile();
  }, [session, defaultUsername]);

  const handleLinkClick = () => {
    if (!profile) return;
    const url = `${window.location.origin}/u/${profile.username}`;
    navigator.clipboard.writeText(url);
    setIsLinkCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setIsLinkCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!profile) return;
    const url = `${window.location.origin}/u/${profile.username}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.full_name} | Codevo Profile`,
          text: `Check out ${profile.full_name}'s developer profile on Codevo.`,
          url: url
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      handleLinkClick();
    }
  };

  if (!profile) return null;

  const isProfileComplete = !!(profile.bio && profile.institute_name);
  const isOwner = session?.user?.id === profile.id;
  const displayUrl = `${window.location.host}/u/${profile.username}`;
  const linkedInUser = getLinkedInUsername(profile.linkedin_url);
  
  const avatarSources = [
    profile.avatar_url,
    linkedInUser ? `https://unavatar.io/linkedin/${linkedInUser}` : null,
    `https://ui-avatars.com/api/?name=${profile.full_name}&background=random`
  ].filter(Boolean) as string[];

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-2 w-[340px] sm:w-[380px] bg-[#0c0c0e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative"
          >
             {/* --- Profile Card Header (Cover) --- */}
             <div className="relative h-32 bg-cover bg-center shrink-0" style={{ backgroundImage: `url('${profile.cover_url || COVER_TEMPLATES[0]}')` }}>
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"></div>
                <div className="absolute inset-x-0 top-0 p-4 flex justify-between items-start text-white z-10">
                    <div className="flex items-center">
                        <span className="font-neuropol font-bold text-xs tracking-widest text-white/90 drop-shadow-md">
                            COD<span className="text-[1.2em] lowercase relative -top-[1px] mx-[1px] inline-block text-white">é</span>VO
                        </span>
                    </div>
                    <div className="flex gap-2">
                        {isOwner && (
                            <button onClick={() => navigate('/profile')} className="p-1.5 rounded-full hover:bg-white/20 transition-colors bg-black/20 backdrop-blur-md border border-white/10">
                                <Edit2 className="w-3.5 h-3.5 text-white" />
                            </button>
                        )}
                        <button onClick={handleShare} className="p-1.5 rounded-full hover:bg-white/20 transition-colors bg-black/20 backdrop-blur-md border border-white/10">
                            <Share className="w-3.5 h-3.5 text-white" />
                        </button>
                    </div>
                </div>
            </div>

            {/* --- Profile Card Body --- */}
            <div className="px-5 pb-6 relative bg-[#0c0c0e]">
                {/* Avatar */}
                <div className="-mt-12 mb-3 relative z-20 flex justify-center">
                    <Avatar className="w-24 h-24 border-[4px] border-[#0c0c0e] shadow-2xl ring-1 ring-white/10 bg-[#1a1a1c]">
                        {avatarSources.map((src) => <AvatarImage key={src} src={src} className="object-cover" />)}
                        <AvatarFallback className="bg-[#1a1a1c] text-2xl font-bold text-white/40">{profile.full_name?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                </div>

                {/* Info */}
                <div className="text-center mb-6">
                    <h1 className="text-xl font-extrabold text-white tracking-tight">{profile.full_name}</h1>
                    <div onClick={handleLinkClick} className="mt-1.5 inline-flex items-center justify-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                        {isLinkCopied ? <Check className="w-3 h-3 text-green-400" /> : <LinkIcon className="w-3 h-3 text-white/50 group-hover:text-white" />}
                        <span className="text-xs font-medium text-white/70 group-hover:text-white truncate max-w-[150px]">{displayUrl}</span>
                        <Copy className="w-3 h-3 text-white/30 group-hover:text-white/70 ml-1" />
                    </div>
                    
                    {profile.country && (
                        <div className="mt-2 flex items-center justify-center gap-1 text-gray-500 text-[10px] font-medium uppercase tracking-wider">
                            <MapPin className="w-3 h-3" /><span>{profile.country}</span>
                        </div>
                    )}
                    
                    {profile.bio && (
                        <div className="mt-3 text-gray-400 text-xs leading-relaxed text-center px-2 line-clamp-3">
                            <p>{profile.bio}</p>
                        </div>
                    )}
                </div>

                {/* Social Links */}
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                    {profile.github_handle && (
                        <a href={`https://github.com/${profile.github_handle.replace(/^@/, '')}`} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#24292e] hover:text-white hover:border-transparent transition-all shadow-sm"><Github className="w-4 h-4" /></a>
                    )}
                    {profile.linkedin_url && (
                        <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#0077b5] hover:text-white hover:border-transparent transition-all shadow-sm"><Linkedin className="w-4 h-4" /></a>
                    )}
                    {profile.portfolio_url && (
                        <a href={profile.portfolio_url} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-gray-400 hover:bg-emerald-600 hover:text-white hover:border-transparent transition-all shadow-sm"><Globe className="w-4 h-4" /></a>
                    )}
                </div>

                <div className="w-full h-px bg-white/5 mb-4" />

                {/* Education */}
                {profile.institute_name ? (
                    <div className="text-center">
                        <h2 className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-600 mb-2">Education</h2>
                        <div className="inline-block text-center">
                            <p className="font-bold text-cyan-400 text-sm leading-tight">{profile.institute_name}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{profile.degree} • {profile.branch}</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-xs text-gray-500 italic">
                        Education details not available
                    </div>
                )}
                
                {/* --- Bottom Action Button --- */}
                <div className="mt-5">
                   {isOwner && !isProfileComplete ? (
                     <Button onClick={() => navigate('/profile')} className="w-full h-10 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold shadow-lg hover:shadow-orange-500/20 text-xs">
                       <UserCog className="w-3.5 h-3.5 mr-2" /> Complete Profile
                     </Button>
                   ) : (
                     <Button onClick={() => navigate(`/u/${profile.username}`)} className="w-full h-10 rounded-xl bg-white text-black font-bold hover:bg-gray-200 text-xs">
                       View Full Profile <ArrowRight className="w-3.5 h-3.5 ml-2" />
                     </Button>
                   )}
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-transparent text-white hover:bg-white/5 rounded-full transition-all duration-300 flex items-center justify-center group z-50 overflow-hidden relative"
        aria-label="Toggle widget"
      >
        <div className="relative w-8 h-8">
            <motion.div
                initial={false}
                animate={{ rotate: isOpen ? 180 : 0, opacity: isOpen ? 0 : 1 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center"
            >
                {/* Scaled up the icon slightly since there's no background */}
                <ChevronLeft className="w-8 h-8 drop-shadow-md" /> 
            </motion.div>
            <motion.div
                initial={false}
                animate={{ rotate: isOpen ? 0 : -180, opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center"
            >
                <X className="w-8 h-8 drop-shadow-md" />
            </motion.div>
        </div>
      </button>
    </div>
  );
}
