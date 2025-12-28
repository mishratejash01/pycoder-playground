import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { format, differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  CheckCircle, 
  Mail, 
  Globe, 
  User, 
  CreditCard,
  MapPin,
  Building2,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { Session } from '@supabase/supabase-js';
import { cn } from "@/lib/utils";

// Component Imports
import { HackathonRegistrationModal } from '@/components/events/HackathonRegistrationModal';
import { NormalEventRegistrationModal } from '@/components/events/NormalEventRegistrationModal';
import { WorkshopRegistrationModal } from '@/components/events/WorkshopRegistrationModal';
import { WebinarRegistrationModal } from '@/components/events/WebinarRegistrationModal';
import { MeetupRegistrationModal } from '@/components/events/MeetupRegistrationModal';
import { ContestRegistrationModal } from '@/components/events/ContestRegistrationModal';
import { AlreadyRegisteredCard } from '@/components/events/AlreadyRegisteredCard';
import { PendingInvitationCard, InvitationBanner } from '@/components/events/InvitationBanner';
import { InviteeRegistrationForm } from '@/components/events/InviteeRegistrationForm';
import { useEventRegistration } from '@/hooks/useEventRegistration';
import { EventStagesTimeline } from '@/components/events/EventStagesTimeline';
import { EventDetailsContent } from '@/components/events/EventDetails';
import { EventPrizes } from '@/components/events/EventPrizes';
import { EventReviews } from '@/components/events/EventReviews';
import { EventFAQs } from '@/components/events/EventFAQs';
import { EventDiscussions } from '@/components/events/EventDiscussions';
import { EventEligibility } from '@/components/events/EventEligibility';
import { EventSponsors } from '@/components/events/EventSponsors';

export default function EventDetailsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  // --- CORE LOGIC ---
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  const { 
    isRegistered, 
    invitation, 
    hasPendingInvitation,
    hasAcceptedInvitation,
    loading: regLoading,
    refetch: refetchRegistration
  } = useEventRegistration(event?.id);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
      if (session) fetchProfile(session.user.id);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
      if (session) fetchProfile(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(uid: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (data) setUserProfile(data);
  }

  useEffect(() => {
    if (!authLoading && !session) navigate('/auth');
  }, [authLoading, session]);

  useEffect(() => {
    if (session) getEvent();
  }, [slug, session]);

  async function getEvent() {
    try {
      const { data, error } = await supabase.from('events').select('*').eq('slug', slug).single();
      if (error || !data) {
        toast.error("Event data not found");
        navigate('/events');
        return;
      }
      setEvent(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleRegisterClick = () => {
    if (hasPendingInvitation) { toast.info("Pending invitation detected."); return; }
    if (hasAcceptedInvitation) { toast.info("Please finish registration."); return; }
    if (isRegistered) { toast.success("Already registered."); return; }

    const effectiveType = (event.form_type || event.event_type || '').toLowerCase();
    const internalTypes = ['hackathon', 'workshop', 'webinar', 'meetup', 'contest'];

    if (internalTypes.includes(effectiveType)) {
      setIsRegisterOpen(true);
      return;
    }
    if (event.registration_link) {
       window.open(event.registration_link, '_blank');
       return;
    }
    setIsRegisterOpen(true);
  };

  const renderRegistrationModal = () => {
    if (!event) return null;
    const type = (event.form_type || event.event_type || 'normal').toLowerCase();
    const commonProps = { event, isOpen: isRegisterOpen, onOpenChange: setIsRegisterOpen };
    switch (type) {
      case 'hackathon': return <HackathonRegistrationModal {...commonProps} />;
      case 'workshop': return <WorkshopRegistrationModal {...commonProps} />;
      case 'webinar': return <WebinarRegistrationModal {...commonProps} />;
      case 'meetup': return <MeetupRegistrationModal {...commonProps} />;
      case 'contest': return <ContestRegistrationModal {...commonProps} />;
      default: return <NormalEventRegistrationModal {...commonProps} />;
    }
  };

  if (authLoading || loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <Loader2 className="animate-spin h-10 w-10 text-[#ff8c00]" />
    </div>
  );

  const daysRemaining = event.registration_deadline 
    ? differenceInDays(new Date(event.registration_deadline), new Date()) 
    : null;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-orange-500/30 overflow-x-hidden">
      <Header session={session} onLogout={() => supabase.auth.signOut()} />
      
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        
        {/* --- NAVIGATION --- */}
        <nav className="py-[30px] flex justify-between items-center border-b border-[#1a1a1a]">
          <div className="flex items-center gap-[30px]">
            <button onClick={() => navigate('/events')} className="bg-transparent border-none text-[#777777] text-[0.65rem] tracking-[2px] uppercase cursor-pointer hover:text-white transition-colors">
              ← GO BACK
            </button>
            <div className="text-[1.1rem] tracking-[5px] uppercase font-light">STUDIO.DEI</div>
          </div>
          <div className="hidden md:block text-[0.65rem] tracking-[2px] text-[#777777] uppercase font-mono">
            REF_CODE: {event.id.slice(0, 8).toUpperCase()}
          </div>
        </nav>

        {/* --- HERO --- */}
        <section className="py-[80px] grid grid-cols-1 lg:grid-cols-2 gap-[60px] items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <span className="uppercase text-[0.7rem] tracking-[3px] text-[#ff8c00] mb-5 block font-bold">
              {event.category} • {event.mode} Mode
            </span>
            <h1 className="font-serif text-[4rem] md:text-[4.5rem] leading-[1] mb-6 font-bold tracking-tight">
              {event.title}
            </h1>
            <p className="text-[1.1rem] text-[#777777] font-light leading-relaxed max-w-[500px]">
              {event.short_description}
            </p>
          </motion.div>
          <div 
            className="w-full h-[500px] bg-cover bg-center border border-[#1a1a1a] grayscale md:grayscale hover:grayscale-0 transition-all duration-700 opacity-80" 
            style={{ backgroundImage: `url(${event.image_url})` }}
          />
        </section>

        {/* --- STATUS BAR --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 py-[50px] border-y border-[#1a1a1a] mb-[80px] gap-y-10">
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.6rem] uppercase text-[#777777] tracking-[2px]">Last Day to Join</span>
            <strong className="text-[1rem] font-light text-[#e0e0e0]">
              {event.registration_deadline ? format(new Date(event.registration_deadline), 'MMMM dd, yyyy') : 'Open'}
            </strong>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.6rem] uppercase text-[#777777] tracking-[2px]">Total Capacity</span>
            <strong className="text-[1rem] font-light text-[#e0e0e0]">{event.max_participants || 'Unlimited'} People</strong>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.6rem] uppercase text-[#777777] tracking-[2px]">Currently Joined</span>
            <strong className="text-[1rem] font-light text-[#e0e0e0]">{event.current_participants || 0} People</strong>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.6rem] uppercase text-[#777777] tracking-[2px]">Registration Status</span>
            <strong className={cn(
              "text-[1rem] font-light uppercase tracking-wider",
              daysRemaining && daysRemaining <= 3 ? "text-[#ff4444]" : "text-[#ff8c00]"
            )}>
              {daysRemaining !== null 
                ? (daysRemaining > 0 ? `Closes in ${daysRemaining} Days` : 'Closed')
                : 'Active'}
            </strong>
          </div>
        </div>

        {/* --- MAIN GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-[100px] mb-[100px]">
          
          <div className="content-col space-y-[100px]">
            <InvitationBanner />

            {/* Registration State Branches */}
            <AnimatePresence mode="wait">
              {hasPendingInvitation && invitation && (
                 <PendingInvitationCard invitation={invitation as any} eventTitle={event.title} onAccept={refetchRegistration} onDecline={refetchRegistration} />
              )}
              {hasAcceptedInvitation && invitation && (
                 <InviteeRegistrationForm eventId={event.id} eventTitle={event.title} isPaid={event.is_paid} registrationFee={event.registration_fee} currency={event.currency} invitation={{ id: invitation.id, team_name: invitation.team_name, inviter_name: invitation.inviter_name, role: invitation.role, registration_id: invitation.registration_id }} onComplete={refetchRegistration} />
              )}
              {isRegistered && (
                <section>
                  <h2 className="section-title">Team Members</h2>
                  <AlreadyRegisteredCard eventId={event.id} eventTitle={event.title} eventType={event.event_type || 'normal'} isPaid={event.is_paid} registrationFee={event.registration_fee} currency={event.currency} />
                </section>
              )}
            </AnimatePresence>

            <section id="about">
              <h2 className="section-title">About the Event</h2>
              <EventDetailsContent event={event} />
            </section>

            {/* Dynamic Tracks */}
            {event.tracks && Array.isArray(event.tracks) && event.tracks.length > 0 && (
              <section id="tracks">
                <h2 className="section-title">Available Tracks</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
                  {event.tracks.map((track: any, idx: number) => (
                    <div key={idx} className="border border-[#1a1a1a] p-[25px] bg-[#050505]">
                      <h4 className="font-serif text-[1.2rem] mb-2.5 text-[#ff8c00]">
                        {String(idx + 1).padStart(2, '0')}. {typeof track === 'string' ? track : track.name}
                      </h4>
                      <p className="text-[0.8rem] text-[#777777]">
                        {typeof track === 'string' ? 'Standard track participant' : track.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section id="schedule">
              <h2 className="section-title">Event Schedule</h2>
              <EventStagesTimeline eventId={event.id} eventStartDate={event.start_date} eventEndDate={event.end_date} registrationDeadline={event.registration_deadline} />
            </section>

            <section id="eligibility">
              <h2 className="section-title">Who Can Join</h2>
              <EventEligibility eligibilityCriteria={event.eligibility_criteria} minTeamSize={event.min_team_size} maxTeamSize={event.max_team_size} allowSolo={event.allow_solo} mode={event.mode} location={event.location} />
            </section>

            <section id="prizes">
              <h2 className="section-title">Awards</h2>
              <EventPrizes eventId={event.id} prizePool={event.prize_pool} />
            </section>

            {/* Rules Section - Link Removed */}
            {event.rules && (
              <section id="rules">
                <h2 className="section-title">The Rules</h2>
                <div className="card-box p-10 leading-[2] text-[0.9rem] text-[#777777] whitespace-pre-wrap">
                  {event.rules}
                </div>
              </section>
            )}

            <section id="partners">
              <h2 className="section-title">Our Partners</h2>
              <EventSponsors eventId={event.id} />
            </section>

            <section id="intel">
              <h2 className="section-title">Feedback</h2>
              <EventReviews eventId={event.id} />
            </section>

            <section id="comms">
              <h2 className="section-title">Common Questions</h2>
              <EventFAQs eventId={event.id} />
            </section>

            <section id="discussion">
              <h2 className="section-title">Community Chat</h2>
              <EventDiscussions eventId={event.id} />
            </section>
          </div>

          {/* --- STICKY SIDEBAR --- */}
          <aside className="hidden lg:block relative">
            <div className="sticky top-10 sidebar-card">
              <h3 className="serif text-[1.6rem] mb-[30px]">Event Details</h3>
              
              {!isRegistered && !hasPendingInvitation && !hasAcceptedInvitation ? (
                <button onClick={handleRegisterClick} className="btn-orange border-none cursor-pointer w-full hover:bg-white transition-all">Join Event</button>
              ) : isRegistered && event.is_paid && event.payment_status === 'pending' ? (
                <button className="btn-orange border-none cursor-pointer w-full hover:bg-white transition-all" onClick={() => toast.info("Redirecting to payment...")}>
                  Pay {event.currency} {event.registration_fee}
                </button>
              ) : isRegistered ? (
                <div className="w-full border border-[#00ff88] p-[20px] text-center bg-[#00ff88]/5 mb-[30px]">
                  <span className="text-[#00ff88] text-[0.65rem] font-bold uppercase tracking-[2px]">Registration Active</span>
                </div>
              ) : null}

              <ul className="side-list">
                <li><span>Format</span> <strong>{event.mode}</strong></li>
                <li><span>Location</span> <strong>{event.location || 'Online'}</strong></li>
                <li><span>Venue</span> <strong className="truncate ml-4">{event.venue || 'Digital Hub'}</strong></li>
              </ul>

              <div className="organizer-box">
                {event.organizer_logo ? (
                  <img src={event.organizer_logo} className="org-logo object-cover" alt="Logo" />
                ) : (
                  <div className="org-logo bg-[#1a1a1a]" />
                )}
                <div>
                  <span className="text-[0.6rem] text-[#777777] tracking-[2px] uppercase">Organized By</span>
                  <p className="text-[0.9rem] font-semibold text-white">{event.organizer_name || 'Studio.Dei'}</p>
                </div>
              </div>
              
              <div className="mt-6 text-[0.75rem]">
                <span className="text-[#777777]">Contact:</span> {event.contact_email}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <footer className="py-[80px] text-center border-t border-[#1a1a1a]">
        <p className="text-[0.6rem] tracking-[5px] text-[#777777] uppercase">
          © {new Date().getFullYear()} STUDIO.DEI • ALL RIGHTS RESERVED
        </p>
      </footer>

      {renderRegistrationModal()}
    </div>
  );
}
