import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Mail, CheckCircle2, X, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PendingInvitation {
  id: string;
  event_id: string;
  team_name: string;
  inviter_name: string;
  inviter_email: string;
  role: string;
  token: string;
  created_at: string;
  registration_id: string | null;
  event?: {
    title: string;
    slug: string;
    image_url: string;
    start_date: string;
  };
}

interface PendingInvitationCardProps {
  invitation: PendingInvitation;
  eventTitle: string;
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * --- PROTOCOL CARD DESIGN ---
 * Used for specific invitation displays (e.g., on the Event Details page)
 */
export function PendingInvitationCard({ 
  invitation, 
  eventTitle,
  onAccept,
  onDecline 
}: PendingInvitationCardProps) {
  const [processing, setProcessing] = useState(false);

  async function handleResponse(accept: boolean) {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('team_invitations')
        .update({
          status: accept ? 'accepted' : 'declined',
          responded_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (error) {
        toast.error(`Protocol Error: ${error.message}`);
        setProcessing(false);
        return;
      }

      if (accept) {
        toast.success("Integration successful. Complete your squad manifest.");
        onAccept();
      } else {
        toast.info("Protocol aborted.");
        onDecline();
      }
    } catch (err) {
      toast.error("System error. Verify connection and retry.");
    }
    setProcessing(false);
  }

  return (
    <div className="w-full max-w-[500px] mx-auto bg-[#050505] border border-[#1a1a1a] font-sans selection:bg-orange-500/30">
      <div className="p-[30px] border-b border-[#1a1a1a] text-center">
        <span className="block text-[0.6rem] uppercase tracking-[3px] text-[#666666] mb-[10px] font-bold">
          Entry Request • {eventTitle}
        </span>
        <h3 className="font-serif text-[1.8rem] font-normal text-white">
          You're Invited!
        </h3>
      </div>

      <div className="p-[40px] text-center">
        <div className="mb-[35px]">
          <p className="text-[0.85rem] text-[#666666] mb-[10px] font-light italic">
            {invitation.inviter_name} has requested your presence in
          </p>
          <h4 className="font-serif text-[2rem] text-[#ff8c00] mb-[15px] leading-tight">
            {invitation.team_name}
          </h4>
          <div className="inline-block text-[0.65rem] uppercase tracking-[2px] border border-[#1a1a1a] px-[12px] py-[6px] text-[#e0e0e0] font-semibold">
            Role: {invitation.role}
          </div>
        </div>

        <p className="text-[0.85rem] text-[#666666] leading-[1.6] font-light max-w-[300px] mx-auto mb-[40px]">
          By accepting this protocol, you will be integrated into the squad manifest for the assembly.
        </p>

        <div className="flex flex-col sm:flex-row gap-[15px]">
          <button
            className="flex-1 bg-transparent border border-[#1a1a1a] text-[#666666] p-[18px] text-[0.7rem] uppercase tracking-[2px] cursor-pointer transition-all hover:border-red-500 hover:text-red-500 disabled:opacity-50"
            onClick={() => handleResponse(false)}
            disabled={processing}
          >
            Decline
          </button>
          <button
            className="flex-[1.5] bg-[#ff8c00] text-black border-none p-[18px] text-[0.75rem] font-extrabold uppercase tracking-[3px] cursor-pointer transition-all hover:bg-white disabled:opacity-50 flex items-center justify-center"
            onClick={() => handleResponse(true)}
            disabled={processing}
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Accept & Join Squad'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * --- SYSTEM BANNER DESIGN ---
 * Used as a top-level alert for pending invitations
 */
export function InvitationBanner() {
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvite, setSelectedInvite] = useState<PendingInvitation | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingInvitations();
  }, []);

  async function fetchPendingInvitations() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('team_invitations')
        .select(`*, event:events(title, slug, image_url, start_date)`)
        .ilike('invitee_email', session.user.email)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (!error && data) setInvitations(data as any);
    } catch (err) {
      console.error('Fetch Error:', err);
    }
    setLoading(false);
  }

  async function handleResponse(invitationId: string, accept: boolean) {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('team_invitations')
        .update({
          status: accept ? 'accepted' : 'declined',
          responded_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (error) {
        toast.error(`Action Failed: ${error.message}`);
        setProcessing(false);
        return;
      }

      toast.success(accept ? "Protocol accepted." : "Invitation declined.");
      setSelectedInvite(null);
      fetchPendingInvitations();
    } catch (err) {
      toast.error("System communication error.");
    }
    setProcessing(false);
  }

  if (loading || invitations.length === 0) return null;

  return (
    <div className="w-full max-w-[800px] mx-auto mb-10 font-sans">
      {/* SYSTEM BANNER */}
      <div className="bg-[#050505] border border-[#ff8c00] p-[20px_30px] flex justify-between items-center relative overflow-hidden">
        <div className="flex items-center gap-[20px]">
          <div className="w-[10px] h-[10px] bg-[#ff8c00] rounded-full shadow-[0_0_10px_#ff8c00] animate-pulse" />
          <div className="text-left">
            <h4 className="text-[0.9rem] font-semibold tracking-[0.5px] text-white">
              {invitations.length} Pending Invitation{invitations.length > 1 ? 's' : ''} Detected
            </h4>
            <p className="text-[0.75rem] text-[#666666] mt-[2px] font-light">
              {invitations[0].team_name} has requested your presence in the assembly.
            </p>
          </div>
        </div>
        <button 
          onClick={() => setSelectedInvite(invitations[0])}
          className="bg-transparent border border-[#ff8c00] text-[#ff8c00] p-[8px_16px] text-[0.65rem] uppercase tracking-[2px] cursor-pointer transition-all hover:bg-[#ff8c00] hover:text-black"
        >
          Details
        </button>
      </div>

      {/* MINI TABS (Carousel for multiple invites) */}
      {invitations.length > 1 && (
        <div className="flex gap-[10px] overflow-x-auto pb-[10px] mt-[20px] no-scrollbar">
          {invitations.slice(1).map((invite) => (
            <button
              key={invite.id}
              onClick={() => setSelectedInvite(invite)}
              className="bg-transparent border border-[#1a1a1a] p-[10px_15px] whitespace-nowrap text-[0.65rem] text-[#666666] uppercase tracking-[1px] hover:border-[#666666] transition-colors"
            >
              SQUAD: {invite.team_name.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* INVITATION MODAL (Uses Protocol Card Style) */}
      <Dialog open={!!selectedInvite} onOpenChange={() => setSelectedInvite(null)}>
        <DialogContent className="max-w-[500px] p-0 bg-transparent border-none">
          {selectedInvite && (
            <div className="bg-[#050505] border border-[#1a1a1a] w-full animate-in fade-in zoom-in-95 duration-300">
              <div className="p-[30px] border-b border-[#1a1a1a] text-center">
                <span className="block text-[0.6rem] uppercase tracking-[3px] text-[#666666] mb-[10px] font-bold">
                  Entry Request • {selectedInvite.event?.title}
                </span>
                <h3 className="font-serif text-[1.8rem] font-normal text-white">
                  Incoming Intel
                </h3>
              </div>
              <div className="p-[40px] text-center">
                <div className="mb-[35px]">
                  <p className="text-[0.85rem] text-[#666666] mb-[10px] font-light italic">
                    {selectedInvite.inviter_name} has invited you to join
                  </p>
                  <h4 className="font-serif text-[2rem] text-[#ff8c00] mb-[15px] leading-tight">
                    {selectedInvite.team_name}
                  </h4>
                  <div className="inline-block text-[0.65rem] uppercase tracking-[2px] border border-[#1a1a1a] px-[12px] py-[6px] text-[#e0e0e0] font-semibold">
                    Role: {selectedInvite.role}
                  </div>
                </div>
                <p className="text-[0.85rem] text-[#666666] leading-[1.6] font-light max-w-[300px] mx-auto mb-[40px]">
                  By accepting this protocol, you will be integrated into the squad manifest for the assembly.
                </p>
                <div className="flex flex-col sm:flex-row gap-[15px]">
                  <button
                    className="flex-1 bg-transparent border border-[#1a1a1a] text-[#666666] p-[18px] text-[0.7rem] uppercase tracking-[2px] cursor-pointer transition-all hover:border-red-500 hover:text-red-500 disabled:opacity-50"
                    onClick={() => handleResponse(selectedInvite.id, false)}
                    disabled={processing}
                  >
                    Decline
                  </button>
                  <button
                    className="flex-[1.5] bg-[#ff8c00] text-black border-none p-[18px] text-[0.75rem] font-extrabold uppercase tracking-[3px] cursor-pointer transition-all hover:bg-white disabled:opacity-50 flex items-center justify-center"
                    onClick={() => handleResponse(selectedInvite.id, true)}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Accept & Join Squad'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
