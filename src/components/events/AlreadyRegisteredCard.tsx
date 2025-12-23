import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Users, User, Clock, Send, RefreshCw, ChevronDown, ChevronUp, Crown, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TeamInvitation {
  id: string;
  invitee_name: string;
  invitee_email: string;
  invitee_mobile: string | null;
  role: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
}

interface Registration {
  id: string;
  full_name: string;
  email: string;
  team_name: string | null;
  team_role: string;
  participation_type: string;
  payment_status: string;
  status: string;
  preferred_track: string | null;
  created_at: string;
}

interface AlreadyRegisteredCardProps {
  eventId: string;
  eventTitle: string;
  eventType: 'hackathon' | 'normal';
  isPaid: boolean;
  registrationFee?: number;
  currency?: string;
}

export function AlreadyRegisteredCard({ 
  eventId, 
  eventTitle, 
  eventType,
  isPaid,
  registrationFee,
  currency = 'INR'
}: AlreadyRegisteredCardProps) {
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTeamDetails, setShowTeamDetails] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRegistration();
  }, [eventId]);

  async function fetchRegistration() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setLoading(false);
      return;
    }

    // Fetch registration
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

    // Fetch team invitations if hackathon with team
    if (eventType === 'hackathon' && reg.participation_type === 'Team') {
      const { data: invites } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('registration_id', reg.id)
        .order('created_at', { ascending: true });

      if (invites) setInvitations(invites as any);
    }

    setLoading(false);
  }

  async function resendInvitation(invitationId: string) {
    setResendingId(invitationId);
    // In a real app, this would trigger an edge function to resend the email
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    toast.success("Invitation resent successfully!");
    setResendingId(null);
  }

  if (loading) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-zinc-800 rounded w-1/3 mb-4" />
        <div className="h-4 bg-zinc-800 rounded w-1/2" />
      </div>
    );
  }

  if (!registration) return null;

  const isPaymentPending = isPaid && registration.payment_status === 'pending';
  const acceptedCount = invitations.filter(i => i.status === 'accepted').length;
  const pendingCount = invitations.filter(i => i.status === 'pending').length;

  return (
    <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/10 border border-green-500/30 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-green-500/10 border-b border-green-500/20 p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/30">
            <CheckCircle2 className="w-7 h-7 text-green-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">You're Registered!</h3>
            <p className="text-sm text-green-400">{eventTitle}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={cn(
            "border-green-500/30",
            isPaymentPending ? "text-yellow-400 border-yellow-500/30" : "text-green-400"
          )}>
            {isPaymentPending ? (
              <><Clock className="w-3 h-3 mr-1" /> Payment Pending</>
            ) : (
              <><CheckCircle2 className="w-3 h-3 mr-1" /> Confirmed</>
            )}
          </Badge>
          
          {eventType === 'hackathon' && (
            <Badge variant="outline" className="border-purple-500/30 text-purple-400">
              {registration.participation_type === 'Team' ? (
                <><Users className="w-3 h-3 mr-1" /> Team</>
              ) : (
                <><User className="w-3 h-3 mr-1" /> Solo</>
              )}
            </Badge>
          )}

          {registration.preferred_track && (
            <Badge variant="outline" className="border-blue-500/30 text-blue-400">
              {registration.preferred_track}
            </Badge>
          )}
        </div>

        {/* Registration Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-zinc-500">Registered As</p>
            <p className="text-white font-medium">{registration.full_name}</p>
          </div>
          <div>
            <p className="text-zinc-500">Email</p>
            <p className="text-white font-medium truncate">{registration.email}</p>
          </div>
          {registration.team_name && (
            <>
              <div>
                <p className="text-zinc-500">Team Name</p>
                <p className="text-white font-medium">{registration.team_name}</p>
              </div>
              <div>
                <p className="text-zinc-500">Your Role</p>
                <p className="text-white font-medium flex items-center gap-1">
                  <Crown className="w-3 h-3 text-yellow-400" /> {registration.team_role}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Team Invitations Section */}
        {eventType === 'hackathon' && registration.participation_type === 'Team' && invitations.length > 0 && (
          <div className="border-t border-zinc-800 pt-4">
            <button
              onClick={() => setShowTeamDetails(!showTeamDetails)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span className="font-medium">Team Members</span>
                <span className="text-xs text-zinc-500">
                  ({acceptedCount} accepted, {pendingCount} pending)
                </span>
              </div>
              {showTeamDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showTeamDetails && (
              <div className="mt-4 space-y-3">
                {invitations.map((invite) => (
                  <div 
                    key={invite.id} 
                    className={cn(
                      "bg-zinc-800/50 rounded-xl p-4 border",
                      invite.status === 'accepted' ? "border-green-500/20" :
                      invite.status === 'declined' ? "border-red-500/20" :
                      "border-zinc-700"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                          invite.status === 'accepted' ? "bg-green-500/20 text-green-400" :
                          invite.status === 'declined' ? "bg-red-500/20 text-red-400" :
                          "bg-yellow-500/20 text-yellow-400"
                        )}>
                          {invite.invitee_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">{invite.invitee_name || 'Unknown'}</p>
                          <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">{invite.invitee_email}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn(
                          "text-xs",
                          invite.status === 'accepted' ? "border-green-500/30 text-green-400" :
                          invite.status === 'declined' ? "border-red-500/30 text-red-400" :
                          "border-yellow-500/30 text-yellow-400"
                        )}>
                          {invite.status}
                        </Badge>
                        {invite.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-purple-400 hover:text-purple-300"
                            onClick={() => resendInvitation(invite.id)}
                            disabled={resendingId === invite.id}
                          >
                            {resendingId === invite.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <><Send className="w-3 h-3 mr-1" /> Resend</>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs bg-zinc-700 text-zinc-300">
                        {invite.role}
                      </Badge>
                      {invite.invitee_mobile && (
                        <span className="flex items-center gap-1 text-xs text-zinc-500">
                          <Phone className="w-3 h-3" /> {invite.invitee_mobile}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payment CTA */}
        {isPaymentPending && (
          <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90 font-bold">
            Complete Payment - {currency} {registrationFee}
          </Button>
        )}
      </div>
    </div>
  );
}