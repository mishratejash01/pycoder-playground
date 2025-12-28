import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  Check, Users, RefreshCw, ChevronDown, ChevronUp, Layers, 
  UserPlus, Pencil, Trash2, ShieldCheck, QrCode, X, Info, Clock, CheckCircle2 
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react'; // Ensure qrcode.react is installed
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TeamInvitation {
  id: string;
  invitee_name: string;
  invitee_email: string;
  invitee_mobile: string | null;
  role: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'completed';
  created_at: string;
}

interface Registration {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  team_name: string | null;
  team_role: string;
  participation_type: string;
  payment_status: string;
  status: string;
  invited_by_registration_id: string | null;
  created_at: string;
}

interface AlreadyRegisteredCardProps {
  eventId: string;
  eventTitle: string;
  eventType: string; 
  isPaid: boolean;
  registrationFee?: number;
  currency?: string;
  maxTeamSize?: number;
}

export function AlreadyRegisteredCard({ 
  eventId, 
  eventTitle, 
  isPaid,
  registrationFee,
  currency = 'INR',
  maxTeamSize = 4
}: AlreadyRegisteredCardProps) {
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTeamDetails, setShowTeamDetails] = useState(false);
  const [isLeader, setIsLeader] = useState(false);
  
  // Edit States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<{id: string, name: string, email: string, role: string, type: 'leader' | 'member'} | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRegistration();
  }, [eventId]);

  async function fetchRegistration() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setLoading(false);
      return;
    }

    const { data: reg, error } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (error || !reg) {
      setLoading(false);
      return;
    }

    setRegistration(reg as any);
    setIsLeader(!reg.invited_by_registration_id); // If not invited, they are the leader

    if (reg.participation_type === 'Team') {
      const primaryId = reg.invited_by_registration_id || reg.id;
      const { data: invites } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('registration_id', primaryId)
        .order('created_at', { ascending: true });

      if (invites) setInvitations(invites as any);
    }
    setLoading(false);
  }

  const handleEditClick = (member: any, type: 'leader' | 'member') => {
    setEditingMember({
      id: member.id,
      name: member.full_name || member.invitee_name,
      email: member.email || member.invitee_email,
      role: member.team_role || member.role,
      type
    });
    setIsEditOpen(true);
  };

  const saveChanges = async () => {
    if (!editingMember) return;
    setIsSubmitting(true);

    try {
      if (editingMember.type === 'leader') {
        const { error } = await supabase
          .from('event_registrations')
          .update({ 
            full_name: editingMember.name,
            team_role: editingMember.role 
          })
          .eq('id', editingMember.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('team_invitations')
          .update({ 
            invitee_name: editingMember.name,
            role: editingMember.role 
          })
          .eq('id', editingMember.id);
        if (error) throw error;
      }
      
      toast.success("Profile updated successfully");
      setIsEditOpen(false);
      fetchRegistration();
    } catch (error: any) {
      toast.error(error.message || "Failed to update");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="w-full h-64 bg-[#0a0a0a] border border-[#1a1a1a] animate-pulse mx-auto" />;
  if (!registration) return null;

  const qrValue = `${window.location.origin}/verify-entry/${registration.id}`;

  // Helper for Status Block Design
  const StatusBlock = ({ status, isConfirmed }: { status: string, isConfirmed: boolean }) => (
    <div className="flex items-center gap-3">
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center border",
        isConfirmed ? "border-[#00ff88] text-[#00ff88]" : "border-orange-500 text-orange-500"
      )}>
        {isConfirmed ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
      </div>
      <div className="hidden sm:block">
        <span className="text-[8px] tracking-[2px] uppercase text-[#777777] block">Status</span>
        <p className={cn("text-[10px] font-bold uppercase", isConfirmed ? "text-[#00ff88]" : "text-orange-500")}>
          {status}
        </p>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-[700px] bg-[#0a0a0a] border border-[#1a1a1a] mx-auto font-sans overflow-hidden">
      {/* Header */}
      <header className="p-6 md:p-10 border-b border-[#1a1a1a] flex justify-between items-center">
        <div className="flex items-center gap-5">
          <div className="w-[50px] h-[50px] border border-[#00ff88] rounded-full flex items-center justify-center text-[#00ff88]">
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[10px] tracking-[3px] uppercase text-[#777777] block">Active Registry</span>
            <h2 className="font-serif text-3xl font-normal text-white">Entry Verified</h2>
          </div>
        </div>
        <button onClick={() => setShowQR(true)} className="p-3 border border-[#1a1a1a] text-[#777777] hover:text-[#00ff88] transition-colors">
          <QrCode className="w-5 h-5" />
        </button>
      </header>

      {/* Team Manifest Section */}
      {registration.participation_type === 'Team' && (
        <div className="mx-6 md:mx-10 my-10 border border-[#1a1a1a]">
          <button
            onClick={() => setShowTeamDetails(!showTeamDetails)}
            className="w-full p-5 bg-[#0d0d0d] flex justify-between items-center cursor-pointer transition-colors hover:bg-[#111]"
          >
            <div className="text-[11px] tracking-[2px] uppercase flex items-center gap-3 text-white">
              <Users className="w-3.5 h-3.5" />
              Squad Manifest ({invitations.filter(i => i.status === 'completed').length + 1}/{maxTeamSize})
            </div>
            <div className="text-[10px] text-[#777777] flex items-center gap-2 uppercase tracking-wider">
              Toggle Details {showTeamDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </div>
          </button>

          {showTeamDetails && (
            <div className="bg-[#050505] border-t border-[#1a1a1a]">
              {/* Leader Row */}
              <div className="p-6 border-b border-[#1a1a1a] flex justify-between items-center gap-5 text-white">
                <div className="flex gap-4 items-center flex-1">
                  <div className="text-[10px] text-[#777777] border border-[#1a1a1a] px-1.5 py-1">01</div>
                  <div>
                    <h4 className="text-sm font-medium">{registration.full_name} (Leader)</h4>
                    <p className="text-[11px] text-[#777777] uppercase tracking-tighter">{registration.team_role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <StatusBlock status="Confirmed" isConfirmed={true} />
                  {isLeader && (
                    <button onClick={() => handleEditClick(registration, 'leader')} className="text-[#777777] hover:text-[#00ff88]">
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Members Rows */}
              {invitations.map((invite, index) => (
                <div key={invite.id} className="p-6 border-b border-[#1a1a1a] last:border-b-0 flex justify-between items-center gap-5 text-white">
                  <div className="flex gap-4 items-center flex-1">
                    <div className="text-[10px] text-[#777777] border border-[#1a1a1a] px-1.5 py-1">{String(index + 2).padStart(2, '0')}</div>
                    <div>
                      <h4 className="text-sm font-medium">{invite.invitee_name}</h4>
                      <p className="text-[11px] text-[#777777] uppercase tracking-tighter">{invite.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <StatusBlock 
                      status={invite.status === 'completed' ? 'Confirmed' : 'Waiting'} 
                      isConfirmed={invite.status === 'completed'} 
                    />
                    {(isLeader || invite.invitee_email === registration.email) && (
                      <button onClick={() => handleEditClick(invite, 'member')} className="text-[#777777] hover:text-[#00ff88]">
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-[#0a0a0a] border-[#1a1a1a] text-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Modify Identity</DialogTitle>
            <DialogDescription className="text-[#777777]">Edit profile details for this event.</DialogDescription>
          </DialogHeader>
          {editingMember && (
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-[#777777]">Full Identity Name</Label>
                <Input 
                  value={editingMember.name} 
                  onChange={(e) => setEditingMember({...editingMember, name: e.target.value})}
                  className="bg-black border-[#1a1a1a] focus:border-[#00ff88] rounded-none" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-[#777777]">Assigned Role</Label>
                <Input 
                  value={editingMember.role} 
                  onChange={(e) => setEditingMember({...editingMember, role: e.target.value})}
                  className="bg-black border-[#1a1a1a] focus:border-[#00ff88] rounded-none" 
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={() => setIsEditOpen(false)} variant="outline" className="flex-1 rounded-none border-[#1a1a1a] uppercase text-[10px] tracking-widest">Cancel</Button>
                <Button onClick={saveChanges} disabled={isSubmitting} className="flex-1 rounded-none bg-[#00ff88] text-black hover:bg-[#00ff88] brightness-110 uppercase text-[10px] tracking-widest font-bold">
                  {isSubmitting ? "Processing..." : "Save Protocol"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Badge Modal */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="bg-white text-black p-10 max-w-sm flex flex-col items-center">
          <QRCodeSVG value={qrValue} size={200} />
          <div className="mt-6 text-center">
            <h3 className="font-serif text-xl font-bold">{registration.full_name}</h3>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">{registration.team_name || "Individual"}</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer Info */}
      <div className="px-6 md:px-10 pb-10">
        <div className="border border-[#1a1a1a] p-4 flex items-start gap-4 bg-[#0d0d0d]">
          <Info className="w-4 h-4 text-[#777777] mt-0.5" />
          <p className="text-[10px] text-[#777777] leading-relaxed uppercase tracking-wider">
            Protocol Notice: Leaders may modify squad data. Sub-units may only modify their own identity records. Changes are synced with the registry.
          </p>
        </div>
      </div>
    </div>
  );
}
