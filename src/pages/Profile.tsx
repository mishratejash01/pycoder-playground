import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Github, 
  Linkedin, 
  Globe, 
  Edit2, 
  Share2, 
  MapPin, 
  GraduationCap, 
  Check,
  Loader2,
  User as UserIcon
} from "lucide-react";
import { toast } from "sonner"; // Assuming you use sonner, based on your App.tsx

// Interface matching your provided Schema exactly
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
  github_handle: string; // From schema
  linkedin_url: string;  // From schema
  portfolio_url?: string; // Newly added
  bio?: string;           // Newly added
  avatar_url?: string;
}

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // Edit Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ProfileData>>({});

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      // Logic: If accessing /profile (no username), redirect to own profile or login
      if (!username) {
        if (!currentUser) {
          navigate("/auth");
          return;
        }
        const { data: myProfile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", currentUser.id)
          .single();
          
        if (myProfile?.username) {
          navigate(`/u/${myProfile.username}`, { replace: true });
        }
        return;
      }

      // Fetch profile data
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (error || !data) {
        toast.error("Profile not found");
        navigate("/");
        return;
      }

      setProfile(data as ProfileData);
      setEditForm(data as ProfileData);
      
      // Check if the viewer is the owner
      if (currentUser && data.id === currentUser.id) {
        setIsOwner(true);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error loading profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          bio: editForm.bio,
          github_handle: editForm.github_handle,
          linkedin_url: editForm.linkedin_url,
          portfolio_url: editForm.portfolio_url,
          // Users can also fix basic details if needed
          full_name: editForm.full_name,
        })
        .eq("id", profile.id);

      if (error) throw error;

      setProfile({ ...profile, ...editForm } as ProfileData);
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const copyToClipboard = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    toast.success("Profile link copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4 relative overflow-hidden">
      {/* Aesthetic Background Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <Card className="bg-[#0c0c0e] border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl">
          
          {/* Header Banner */}
          <div className="h-32 bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-blue-900/20 border-b border-white/5 relative">
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-black/50 border-white/10 hover:bg-white/10 text-white backdrop-blur-md transition-all"
                onClick={copyToClipboard}
              >
                {isCopied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Share2 className="w-4 h-4 mr-2" />}
                {isCopied ? "Copied" : "Share"}
              </Button>

              {isOwner && (
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                    >
                      <Edit2 className="w-4 h-4 mr-2" /> Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#0c0c0e] border-white/10 text-white sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Update Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase">Display Name</label>
                        <Input 
                          value={editForm.full_name || ""} 
                          onChange={e => setEditForm({...editForm, full_name: e.target.value})}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase">Bio / Summary</label>
                        <Textarea 
                          value={editForm.bio || ""} 
                          onChange={e => setEditForm({...editForm, bio: e.target.value})}
                          className="bg-white/5 border-white/10 text-white min-h-[80px]"
                          placeholder="Passionate developer experienced in..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-2">
                          <Github className="w-3 h-3" /> GitHub Handle
                        </label>
                        <Input 
                          value={editForm.github_handle || ""} 
                          onChange={e => setEditForm({...editForm, github_handle: e.target.value})}
                          className="bg-white/5 border-white/10 text-white"
                          placeholder="e.g. mishratejash01"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-2">
                          <Linkedin className="w-3 h-3" /> LinkedIn URL
                        </label>
                        <Input 
                          value={editForm.linkedin_url || ""} 
                          onChange={e => setEditForm({...editForm, linkedin_url: e.target.value})}
                          className="bg-white/5 border-white/10 text-white"
                          placeholder="https://linkedin.com/in/..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-2">
                          <Globe className="w-3 h-3" /> Portfolio URL
                        </label>
                        <Input 
                          value={editForm.portfolio_url || ""} 
                          onChange={e => setEditForm({...editForm, portfolio_url: e.target.value})}
                          className="bg-white/5 border-white/10 text-white"
                          placeholder="https://mywebsite.com"
                        />
                      </div>
                      <Button onClick={handleSave} className="w-full mt-4 bg-primary text-white hover:bg-primary/90">Save Changes</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          <CardContent className="pt-0 relative px-6 md:px-10 pb-10">
            {/* Avatar Profile Section */}
            <div className="relative -mt-16 mb-6 flex flex-col md:flex-row items-center md:items-end gap-6">
              <Avatar className="w-32 h-32 border-4 border-[#0c0c0e] shadow-2xl ring-2 ring-white/10 bg-[#1a1a1c]">
                <AvatarImage src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name}&background=random`} />
                <AvatarFallback className="bg-primary text-2xl font-bold">{profile.full_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-left mb-2 space-y-1">
                <h1 className="text-3xl font-bold text-white tracking-tight">{profile.full_name}</h1>
                <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground font-medium">
                  <UserIcon className="w-4 h-4" /> 
                  @{profile.username}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              
              {/* Left Column: Bio & Education */}
              <div className="md:col-span-2 space-y-8">
                {/* Bio Section */}
                <div className="prose prose-invert max-w-none">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                    About
                  </h3>
                  {profile.bio ? (
                    <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                  ) : (
                    <p className="text-gray-600 text-sm italic">No bio added yet.</p>
                  )}
                </div>

                {/* Education Section */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                    <GraduationCap className="w-5 h-5 text-primary" /> Education
                  </h3>
                  
                  <div className="relative pl-6 border-l-2 border-white/10 pb-2 ml-2">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#0c0c0e] border-2 border-primary" />
                    <div className="bg-white/5 rounded-lg p-4 border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-medium text-white text-base">{profile.institute_name || "Institute Name"}</h4>
                        <Badge variant="secondary" className="bg-white/10 hover:bg-white/20 text-xs">
                          {profile.start_year || "YYYY"} - {profile.end_year || "YYYY"}
                        </Badge>
                      </div>
                      <p className="text-sm text-primary/80 font-medium mb-2">{profile.degree} • {profile.branch}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {profile.country && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {profile.country}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Socials */}
              <div className="space-y-6">
                <div className="bg-white/5 rounded-xl p-5 border border-white/5">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Connect</h3>
                  <div className="space-y-3">
                    {/* GitHub */}
                    {profile.github_handle ? (
                       <a 
                         href={`https://github.com/${profile.github_handle.replace(/^@/, '')}`} 
                         target="_blank" 
                         rel="noreferrer" 
                         className="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-all p-2 hover:bg-white/5 rounded-lg -mx-2 group"
                       >
                         <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-colors">
                           <Github className="w-4 h-4" />
                         </div>
                         <div className="flex flex-col">
                           <span className="font-medium">GitHub</span>
                           <span className="text-xs text-muted-foreground truncate max-w-[150px]">{profile.github_handle}</span>
                         </div>
                       </a>
                    ) : ( isOwner && <div className="text-xs text-muted-foreground italic pl-2 py-1">Add GitHub handle</div>)}

                    {/* LinkedIn */}
                    {profile.linkedin_url ? (
                       <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-all p-2 hover:bg-white/5 rounded-lg -mx-2 group">
                         <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center border border-white/10 group-hover:border-blue-500/50 transition-colors">
                           <Linkedin className="w-4 h-4" />
                         </div>
                         <span className="font-medium">LinkedIn</span>
                       </a>
                    ) : ( isOwner && <div className="text-xs text-muted-foreground italic pl-2 py-1">Add LinkedIn URL</div>)}

                    {/* Portfolio */}
                    {profile.portfolio_url ? (
                       <a href={profile.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-all p-2 hover:bg-white/5 rounded-lg -mx-2 group">
                         <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center border border-white/10 group-hover:border-green-500/50 transition-colors">
                           <Globe className="w-4 h-4" />
                         </div>
                         <span className="font-medium">Portfolio</span>
                       </a>
                    ) : ( isOwner && <div className="text-xs text-muted-foreground italic pl-2 py-1">Add Portfolio URL</div>)}
                  </div>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
