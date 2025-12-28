import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  Check, Users, RefreshCw, ChevronDown, ChevronUp, Layers, 
  UserPlus, Pencil, Trash2, ShieldCheck, QrCode, X, Info 
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  maxTeamSize = 4
}: AlreadyRegisteredCardProps) {
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTeamDetails, setShowTeamDetails] = useState(false);
  const [isLeader, setIsLeader] = useState(false);
  
  // Modal States
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showQR, setShowQR] = useState(false);
  
  // Editing State
  const [editingMember, setEditingMember] = useState<{
    id: string;
    name: string;
    role: string;
    type: 'leader' | 'member';
  } | null>(null);

  // Invite Form State
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: '' });

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
    setIsLeader(!reg.invited_by_registration_id);

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

  const handleEditOpen = (member: any, type: 'leader' | 'member') => {
    setEditingMember({
      id: member.id,
      name: type === 'leader' ? member.full_name : member.invitee_name,
      role: type === 'leader' ? member.team_role : member.role,
      type
    });
    setIsEditOpen(true);
  };

  const saveMemberChanges = async () => {
    if (!editingMember) return;
    
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
      
      toast.success("Identity updated successfully");
      setIsEditOpen(false);
      fetchRegistration();
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (invitations.length + 1 >= maxTeamSize) {
      toast.error(`Squad capacity reached (Max: ${maxTeamSize})`);
      return;
    }

    try {
      const { error } = await supabase.from('team_invitations').insert({
        registration_id: registration?.id,
        event_id: eventId,
        invitee_name: inviteForm.name,
        invitee_email: inviteForm.email,
        role: inviteForm.role,
        team_name: registration?.team_name || 'Team',
        inviter_name: registration?.full_name || 'Leader',
        inviter_email: registration?.email || '',
        status: 'pending',
        token: crypto.randomUUID(),
      });

      if (error) throw error;

      toast.success("Invitation dispatched");
      setInviteForm({ name: '', email: '', role: '' });
      setIsInviteOpen(false);
      fetchRegistration();
    } catch (err: any) {
      toast.error(err.message || "Failed to send invitation");
    }
  };

  const removeMember = async (id: string) => {
    try {
      const { error } = await supabase.from('team_invitations').delete().eq('id', id);
      if (error) throw error;
      toast.success("Member removed from squad");
      fetchRegistration();
    } catch (err: any) {
      toast.error(err.message || "Removal failed");
    }
  };

  if (loading || !registration) return null;

  // CUSTOM STATUS BLOCK COMPONENT
  const StatusBadge = ({ isConfirmed }: { isConfirmed: boolean }) => (
    <div className="flex items-center gap-3 px-3 py-1.5 border border-[#1a1a1a] bg-transparent rounded-none">
      <div className="relative flex h-2 w-2">
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.9)]"></span>
      </div>
      <span className="text-[10px] uppercase tracking-[1px] text-[#e0e0e0] font-medium">
        {isConfirmed ? 'Confirmed' : 'Awaiting'}
      </span>
    </div>
  );

  return (
    <div className="w-full max-w-[700px] bg-[#0a0a0a] border border-[#1a1a1a] mx-auto font-sans overflow-hidden">
      {/* HEADER - CLEAN NO PURPLE */}
      <header className="p-6 md:p-10 border-b border-[#1a1a1a] flex justify-between items-center">
        <div className="flex items-center gap-5">
          <div className="w-[50px] h-[50px] border border-[#00ff88] rounded-full flex items-center justify-center text-[#00ff88]">
            <Check className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] tracking-[3px] uppercase text-[#777777] block">Registry Verified</span>
            <h2 className="font-serif text-3xl md:text-[2.4rem] font-normal leading-none text-white">Active Profile</h2>
          </div>
        </div>
        <button 
          onClick={() => setShowQR(true)}
          className="w-[45px] h-[45px] border border-[#1a1a1a] flex items-center justify-center text-[#777777] hover:text-[#00ff88] transition-colors"
        >
          <QrCode className="w-5 h-5" />
        </button>
      </header>

      {/* TEAM MANIFEST SECTION */}
      {registration.participation_type === 'Team' && (
        <div className="mx-6 md:mx-10 my-10 border border-[#1a1a1a]">
          <button
            onClick={() => setShowTeamDetails(!showTeamDetails)}
            className="w-full p-5 bg-[#0d0d0d] flex justify-between items-center cursor-pointer transition-colors hover:bg-[#111]"
          >
            <div className="text-[11px] tracking-[2px] uppercase flex items-center gap-3 text-white">
              <Users className="w-3.5 h-3.5" />
              Squad Manifest ({invitations.length + 1}/{maxTeamSize})
            </div>
            <div className="flex items-center gap-4">
               {isLeader && invitations.length + 1 < maxTeamSize && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsInviteOpen(true); }}
                    className="text-[9px] uppercase tracking-[2px] text-[#00ff88] border border-[#00ff88]/20 px-2 py-1 hover:bg-[#00ff88]/10"
                  >
                    + Add Subject
                  </button>
               )}
               {showTeamDetails ? <ChevronUp className="w-3 h-3 text-[#777777]" /> : <ChevronDown className="w-3 h-3 text-[#777777]" />}
            </div>
          </button>

          {showTeamDetails && (
            <div className="bg-[#050505] border-t border-[#1a1a1a] divide-y divide-[#1a1a1a]">
              {/* Leader Row */}
              <div className="p-6 flex justify-between items-center gap-5 text-white">
                <div className="flex gap-4 items-center flex-1">
                  <div className="text-[10px] text-[#777777] border border-[#1a1a1a] px-1.5 py-1">01</div>
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-medium">{registration.full_name}</h4>
                    <p className="text-[11px] text-[#777777] uppercase tracking-tighter">{registration.team_role || 'Squad Leader'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <StatusBadge isConfirmed={true} />
                  {isLeader && (
                    <button onClick={() => handleEditOpen(registration, 'leader')} className="text-[#777777] hover:text-white">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Members Rows */}
              {invitations.map((invite, index) => {
                const canEdit = isLeader || invite.invitee_email === registration.email;
                return (
                  <div key={invite.id} className="p-6 flex justify-between items-center gap-5 text-white">
                    <div className="flex gap-4 items-center flex-1">
                      <div className="text-[10px] text-[#777777] border border-[#1a1a1a] px-1.5 py-1">
                        {String(index + 2).padStart(2, '0')}
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-medium">{invite.invitee_name || 'Pending Subject'}</h4>
                        <p className="text-[11px] text-[#777777] uppercase tracking-tighter">{invite.role}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <StatusBadge isConfirmed={invite.status === 'completed'} />
                      <div className="flex items-center gap-3">
                        {canEdit && (
                          <button onClick={() => handleEditOpen(invite, 'member')} className="text-[#777777] hover:text-white">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isLeader && (
                          <button onClick={() => removeMember(invite.id)} className="text-[#777777] hover:text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODALS - OVERRIDDEN TO REMOVE PURPLE */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-[#0a0a0a] border-[#1a1a1a] text-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Modify Identity</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
             <div className="space-y-2">
               <Label className="text-[10px] uppercase tracking-widest text-[#777777]">Full Identity Name</Label>
               <Input 
                value={editingMember?.name || ''} 
                onChange={e => setEditingMember(prev => prev ? {...prev, name: e.target.value} : null)}
                className="bg-black border-[#1a1a1a] rounded-none focus:ring-0 focus:border-[#00ff88] h-12" 
               />
             </div>
             <div className="space-y-2">
               <Label className="text-[10px] uppercase tracking-widest text-[#777777]">Squad Designation/Role</Label>
               <Input 
                value={editingMember?.role || ''} 
                onChange={e => setEditingMember(prev => prev ? {...prev, role: e.target.value} : null)}
                className="bg-black border-[#1a1a1a] rounded-none focus:ring-0 focus:border-[#00ff88] h-12" 
               />
             </div>
             <Button onClick={saveMemberChanges} className="w-full bg-[#00ff88] text-black font-bold uppercase tracking-widest rounded-none h-12 hover:bg-[#00ff88]/90">
               Sync Protocol
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="bg-[#0a0a0a] border-[#1a1a1a] text-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">New Subject Invite</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-6 pt-4">
             <div className="space-y-2">
               <Label className="text-[10px] uppercase tracking-widest text-[#777777]">Name</Label>
               <Input required value={inviteForm.name} onChange={e => setInviteForm({...inviteForm, name: e.target.value})} className="bg-black border-[#1a1a1a] rounded-none h-12 focus:border-[#00ff88] focus:ring-0" />
             </div>
             <div className="space-y-2">
               <Label className="text-[10px] uppercase tracking-widest text-[#777777]">Email Address</Label>
               <Input required type="email" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} className="bg-black border-[#1a1a1a] rounded-none h-12 focus:border-[#00ff88] focus:ring-0" />
             </div>
             <div className="space-y-2">
               <Label className="text-[10px] uppercase tracking-widest text-[#777777]">Designated Role</Label>
               <Input required value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value})} className="bg-black border-[#1a1a1a] rounded-none h-12 focus:border-[#00ff88] focus:ring-0" />
             </div>
             <Button type="submit" className="w-full bg-[#00ff88] text-black font-bold uppercase tracking-widest rounded-none h-12 hover:bg-[#00ff88]/90">
               Dispatch Invite
             </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="bg-[#0a0a0a] border-[#1a1a1a] text-white max-w-sm">
          <DialogHeader className="items-center">
            <DialogTitle className="font-serif text-2xl">Squad Credential</DialogTitle>
          </DialogHeader>
          <div className="bg-white p-4 mx-auto my-6">
            <QRCodeSVG 
              value={`${window.location.origin}/verify/${registration.id}`} 
              size={200}
              level="H"
            />
          </div>
          <div className="text-center space-y-1">
             <p className="text-sm font-medium uppercase tracking-widest">{registration.full_name}</p>
             <p className="text-[10px] text-[#777777] uppercase tracking-widest">{registration.team_name}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
