import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  ArrowLeft, 
  CheckCircle, 
  Mail, 
  Globe, 
  User, 
  CreditCard 
} from 'lucide-react';
import { toast } from 'sonner';
import { Session } from '@supabase/supabase-js';
import { cn } from "@/lib/utils";

// Internal Component Imports
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
  
  // --- ALL ORIGINAL LOGIC RESTORED ---
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
  }, [authLoading, session, navigate]);

  useEffect(() => {
    if (session) getEvent();
  }, [slug, session]);

  async function getEvent() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error || !data) {
        toast.error("Event not found");
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
    if (hasPendingInvitation) {
      toast.info("You have a pending invitation.");
      return;
    }
    if (hasAcceptedInvitation) {
      toast.info("Please finish your registration.");
      return;
    }
    if (isRegistered) {
      toast.success("You are already registered.");
      return;
    }

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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin h-10 w-10 text-[#ff8c00]" />
      <span className="text-[0.6rem] uppercase tracking-[4px] text-[#777777]">Loading Details</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-orange-500/30 overflow-x-hidden">
      <Header session={session} onLogout={() => supabase.auth.signOut()} />
      
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        
        {/* --- NAVIGATION --- */}
        <nav className="py-[30px] flex justify-between items-center border-b border-[#1a1a1a]">
          <div className="flex items-center gap-[30px]">
            <button 
              onClick={() => navigate('/events')} 
              className="bg-transparent border-none text-[#777777] text-[0.65rem] tracking-[2px] uppercase cursor-pointer hover:text-white transition-colors"
            >
              ← GO BACK
            </button>
            <div className="text-[1.1rem] tracking-[5px] uppercase font-light">STUDIO.DEI</div>
          </div>
          <div className="hidden md:block text-[0.65rem] tracking-[2px] text-[#777777] uppercase font-mono">
            EVENT_DETAILS_2025
          </div>
        </nav>

        {/* --- HERO SECTION --- */}
        <section className="py-[60px] md:py-[80px] grid grid-cols-1 lg:grid-cols-2 gap-[60px] items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="uppercase text-[0.7rem] tracking-[3px] text-[#ff8c00] mb-5 block font-bold">
              2025 {event.mode} Event
            </span>
            <h1 className="font-serif text-[4rem] md:text-[5rem] leading-[1] mb-8 font-bold tracking-tight">
              {event.title}
            </h1>
            <p className="text-[1.1rem] text-[#777777] font-light leading-relaxed max-w-[500px]">
              {event.short_description}
            </p>
          </motion.div>
          
          <div 
            className="w-full h-[450px] md:h-[500px] bg-cover bg-center border border-[#1a1a1a] grayscale md:grayscale hover:grayscale-0 transition-all duration-700 opacity-80" 
            style={{ backgroundImage: `url(${event.image_url})` }}
          />
        </section>

        {/* --- USER STATUS BAR --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 py-[50px] border-y border-[#1a1a1a] mb-[80px] gap-y-10">
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.6rem] uppercase text-[#777777] tracking-[2px]">Your Name</span>
            <strong className="text-[1rem] font-light text-[#e0e0e0]">
              {userProfile?.full_name || session?.user.email?.split('@')[0]}
            </strong>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.6rem] uppercase text-[#777777] tracking-[2px]">Location</span>
            <strong className="text-[1rem] font-light text-[#e0e0e0]">
              {event.location || event.mode}
            </strong>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.6rem] uppercase text-[#777777] tracking-[2px]">Email Address</span>
            <strong className="text-[1rem] font-light text-[#e0e0e0] truncate pr-4">
              {session?.user.email}
            </strong>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.6rem] uppercase text-[#777777] tracking-[2px]">Status</span>
            <strong className={cn(
              "text-[1rem] font-light uppercase tracking-wider",
              isRegistered ? "text-[#00ff88]" : "text-[#ff8c00]"
            )}>
              {isRegistered ? 'Registered' : hasPendingInvitation ? 'Invited' : 'Not Registered'}
            </strong>
          </div>
        </div>

        {/* --- MAIN GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-[80px] lg:gap-[100px] mb-[100px]">
          
          <div className="content-col space-y-[100px]">
            
            <InvitationBanner />

            {/* Registration Logic Branches */}
            {hasPendingInvitation && invitation && (
               <PendingInvitationCard invitation={invitation as any} eventTitle={event.title} onAccept={refetchRegistration} onDecline={refetchRegistration} />
            )}
            
            {hasAcceptedInvitation && invitation && (
               <InviteeRegistrationForm eventId={event.id} eventTitle={event.title} isPaid={event.is_paid} registrationFee={event.registration_fee} currency={event.currency} invitation={{ id: invitation.id, team_name: invitation.team_name, inviter_name: invitation.inviter_name, role: invitation.role, registration_id: invitation.registration_id }} onComplete={refetchRegistration} />
            )}

            {isRegistered && (
              <section>
                <h2 className="font-serif text-[2.2rem] mb-10 border-b border-[#1a1a1a] pb-5">Team Members</h2>
                <AlreadyRegisteredCard 
                  eventId={event.id} 
                  eventTitle={event.title} 
                  eventType={event.event_type || 'normal'} 
                  isPaid={event.is_paid} 
                  registrationFee={event.registration_fee} 
                  currency={event.currency} 
                />
              </section>
            )}

            <section id="schedule">
              <h2 className="font-serif text-[2.2rem] mb-10 border-b border-[#1a1a1a] pb-5">Event Schedule</h2>
              <EventStagesTimeline eventId={event.id} eventStartDate={event.start_date} eventEndDate={event.end_date} registrationDeadline={event.registration_deadline} />
            </section>

            <section id="about">
              <h2 className="font-serif text-[2.2rem] mb-10 border-b border-[#1a1a1a] pb-5">About the Event</h2>
              <EventDetailsContent event={event} />
            </section>

            <section id="eligibility">
              <h2 className="font-serif text-[2.2rem] mb-10 border-b border-[#1a1a1a] pb-5">Who Can Join</h2>
              <EventEligibility eligibilityCriteria={event.eligibility_criteria} minTeamSize={event.min_team_size} maxTeamSize={event.max_team_size} allowSolo={event.allow_solo} mode={event.mode} location={event.location} />
            </section>

            <section id="prizes">
              <h2 className="font-serif text-[2.2rem] mb-10 border-b border-[#1a1a1a] pb-5">Prizes</h2>
              <EventPrizes eventId={event.id} prizePool={event.prize_pool} />
            </section>

            <section id="partners">
              <h2 className="font-serif text-[2.2rem] mb-10 border-b border-[#1a1a1a] pb-5">Our Partners</h2>
              <EventSponsors eventId={event.id} />
            </section>

            <section id="intel">
              <h2 className="font-serif text-[2.2rem] mb-10 border-b border-[#1a1a1a] pb-5">Feedback</h2>
              <EventReviews eventId={event.id} />
            </section>

            <section id="comms">
              <h2 className="font-serif text-[2.2rem] mb-10 border-b border-[#1a1a1a] pb-5">Common Questions</h2>
              <EventFAQs eventId={event.id} />
            </section>

            <section id="discussion">
              <h2 className="font-serif text-[2.2rem] mb-10 border-b border-[#1a1a1a] pb-5">Community Chat</h2>
              <EventDiscussions eventId={event.id} />
            </section>
          </div>

          {/* --- SIDEBAR --- */}
          <aside className="hidden lg:block">
            <div className="sticky top-10 bg-[#0a0a0a] p-10 border border-[#1a1a1a]">
              <h3 className="font-serif text-[1.6rem] mb-[30px]">Event Summary</h3>
              
              {!isRegistered && !hasPendingInvitation && !hasAcceptedInvitation ? (
                <button 
                  onClick={handleRegisterClick}
                  className="w-full bg-[#ff8c00] text-black border-none p-[22px] text-center text-[0.8rem] font-extrabold uppercase tracking-[4px] cursor-pointer mb-[30px] transition-all hover:bg-white flex items-center justify-center gap-2"
                >
                  {regLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Join Event'}
                </button>
              ) : isRegistered && event.is_paid && event.payment_status === 'pending' ? (
                <button 
                  className="w-full bg-[#ff8c00] text-black border-none p-[22px] text-center text-[0.8rem] font-extrabold uppercase tracking-[4px] cursor-pointer mb-[30px] hover:bg-white transition-all"
                  onClick={() => toast.info("Redirecting to payment...")}
                >
                  Complete Payment
                </button>
              ) : isRegistered ? (
                <div className="w-full border border-[#00ff88] p-[20px] text-center bg-[#00ff88]/5 mb-[30px]">
                  <span className="text-[#00ff88] text-[0.65rem] font-bold uppercase tracking-[2px]">Registered</span>
                </div>
              ) : null}

              <ul className="list-none space-y-4">
                <li className="flex justify-between py-4 border-b border-[#1a1a1a] text-[0.8rem]">
                  <span className="text-[#777777] uppercase tracking-wider">Starts On</span>
                  <strong className="font-medium">{format(new Date(event.start_date), 'MMMM dd, yyyy')}</strong>
                </li>
                <li className="flex justify-between py-4 border-b border-[#1a1a1a] text-[0.8rem]">
                  <span className="text-[#777777] uppercase tracking-wider">Format</span>
                  <strong className="font-medium">{event.mode}</strong>
                </li>
                <li className="flex justify-between py-4 border-b border-[#1a1a1a] text-[0.8rem]">
                  <span className="text-[#777777] uppercase tracking-wider">Location</span>
                  <strong className="font-medium truncate ml-4">{event.location || 'Online'}</strong>
                </li>
              </ul>

              <div className="mt-10 pt-[25px] border-t border-[#1a1a1a]">
                <span className="text-[0.6rem] text-[#777777] tracking-[2px] uppercase block mb-1">Help Desk</span>
                <p className="text-[0.85rem] text-[#e0e0e0] font-light">{event.contact_email || 'support@studio-dei.it'}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <footer className="py-[80px] text-center border-t border-[#1a1a1a]">
        <p className="text-[0.6rem] tracking-[4px] text-[#777777] uppercase font-light">
          © {new Date().getFullYear()} STUDIO DEI MILANO • CREATED BY HAND
        </p>
      </footer>

      {renderRegistrationModal()}
    </div>
  );
}
