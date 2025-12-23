import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Mail, CheckCircle2, X, ChevronRight, Loader2, Trophy, Sparkles } from 'lucide-react';
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
        console.error('Invitation response error:', error);
        toast.error(`Failed to respond: ${error.message}`);
        setProcessing(false);
        return;
      }

      if (accept) {
        toast.success("Invitation accepted! Complete your registration below.");
        onAccept();
      } else {
        toast.info("Invitation declined");
        onDecline();
      }
    } catch (err) {
      console.error('Error responding to invitation:', err);
      toast.error("Something went wrong. Please try again.");
    }
    
    setProcessing(false);
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-b from-card to-background overflow-hidden">
      {/* Header */}
      <CardHeader className="bg-primary/5 border-b border-primary/10 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">You're Invited!</h3>
            <p className="text-sm text-muted-foreground">{eventTitle}</p>
          </div>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="p-6 space-y-5">
        <div className="bg-muted/50 rounded-xl p-4 text-center border border-border">
          <p className="text-muted-foreground mb-1">
            <span className="text-foreground font-medium">{invitation.inviter_name}</span> wants you to join
          </p>
          <p className="text-xl font-bold text-primary">{invitation.team_name}</p>
          <Badge variant="secondary" className="mt-2 text-xs">
            Role: {invitation.role}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          Accept to join the team and complete your registration.
        </p>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50"
            onClick={() => handleResponse(false)}
            disabled={processing}
          >
            <X className="w-4 h-4 mr-2" /> Decline
          </Button>
          <Button
            className="flex-1"
            onClick={() => handleResponse(true)}
            disabled={processing}
          >
            {processing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            Accept & Join
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

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
        .select(`
          *,
          event:events(title, slug, image_url, start_date)
        `)
        .ilike('invitee_email', session.user.email)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invitations:', error);
      } else if (data) {
        setInvitations(data as any);
      }
    } catch (err) {
      console.error('Error:', err);
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
        console.error('Invitation response error:', error);
        toast.error(`Failed to respond: ${error.message}`);
        setProcessing(false);
        return;
      }

      if (accept) {
        toast.success("Invitation accepted! Complete your registration on the event page.");
      } else {
        toast.info("Invitation declined");
      }

      setSelectedInvite(null);
      fetchPendingInvitations();
    } catch (err) {
      console.error('Error responding to invitation:', err);
      toast.error("Something went wrong. Please try again.");
    }
    
    setProcessing(false);
  }

  if (loading || invitations.length === 0) return null;

  return (
    <>
      {/* Banner */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 mb-6">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-grow min-w-0">
              <h3 className="text-base font-semibold text-foreground">
                You have {invitations.length} pending invitation{invitations.length > 1 ? 's' : ''}!
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {invitations[0].inviter_name} invited you to join <span className="text-primary font-medium">{invitations[0].team_name}</span>
              </p>
            </div>
            <Button 
              onClick={() => setSelectedInvite(invitations[0])}
              size="sm"
            >
              View <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Mini preview of other invitations */}
          {invitations.length > 1 && (
            <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2">
              {invitations.slice(1).map((invite) => (
                <button
                  key={invite.id}
                  onClick={() => setSelectedInvite(invite)}
                  className="flex items-center gap-2 bg-muted hover:bg-muted/80 rounded-lg px-3 py-2 text-xs transition-colors shrink-0 border border-border"
                >
                  <Users className="w-3 h-3 text-primary" />
                  <span className="text-foreground">{invite.team_name}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {invite.event?.title?.slice(0, 15)}...
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invitation Detail Modal */}
      <Dialog open={!!selectedInvite} onOpenChange={() => setSelectedInvite(null)}>
        <DialogContent className="sm:max-w-[480px] bg-card border-border text-foreground p-0 gap-0">
          {selectedInvite && (
            <>
              {/* Header with Event Image */}
              {selectedInvite.event?.image_url && (
                <div className="h-36 relative overflow-hidden">
                  <img 
                    src={selectedInvite.event.image_url} 
                    alt="" 
                    className="w-full h-full object-cover opacity-70"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                  <div className="absolute bottom-4 left-6 right-6">
                    <Badge className="bg-primary/80 mb-2">
                      <Trophy className="w-3 h-3 mr-1" /> Hackathon
                    </Badge>
                    <h3 className="text-lg font-bold text-foreground">{selectedInvite.event?.title}</h3>
                  </div>
                </div>
              )}

              <div className="p-6 space-y-5">
                <DialogHeader>
                  <DialogTitle className="text-center">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                      <Sparkles className="w-7 h-7 text-primary" />
                    </div>
                    <span className="block text-xl">You've been invited!</span>
                  </DialogTitle>
                </DialogHeader>

                <div className="bg-muted/50 rounded-xl p-4 text-center border border-border">
                  <p className="text-muted-foreground mb-1">
                    <span className="text-foreground font-medium">{selectedInvite.inviter_name}</span> wants you to join
                  </p>
                  <p className="text-xl font-bold text-primary">{selectedInvite.team_name}</p>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    Role: {selectedInvite.role}
                  </Badge>
                </div>

                <div className="text-center text-sm text-muted-foreground space-y-1">
                  <p>By accepting, you'll join the team for this hackathon.</p>
                  <p>You'll need to complete your registration details.</p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50"
                    onClick={() => handleResponse(selectedInvite.id, false)}
                    disabled={processing}
                  >
                    <X className="w-4 h-4 mr-2" /> Decline
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleResponse(selectedInvite.id, true)}
                    disabled={processing}
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Accept & Join
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
