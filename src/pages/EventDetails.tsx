import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { EventRegistrationModal } from '@/components/EventRegistrationModal';

// --- Types ---
interface Event {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  start_date: string;
  end_date: string;
  registration_deadline?: string;
  created_at: string;
  image_url: string;
  category: string;
  mode: string;
  location: string;
  prize_pool: string;
  is_featured: boolean;
  event_type: 'hackathon' | 'normal';
  max_team_size: number | null;
  registration_fee: number | null;
  is_paid: boolean | null;
}

export default function EventDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!slug) return;
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('Error fetching event:', error);
        toast({
          title: "Error",
          description: "Could not find the requested event.",
          variant: "destructive"
        });
        navigate('/events');
        return;
      }

      setEvent(data as unknown as Event);
      setLoading(false);
    };

    fetchEvent();
  }, [slug, navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-white" />
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="min-h-screen bg-black text-white font-inter selection:bg-white/20">
      {/* Load Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@200;300;400;600&display=swap');

        :root {
            --bg: #000000;
            --surface: #0a0a0a;
            --text-main: #ffffff;
            --text-muted: #777777;
            --border: #1a1a1a;
            --titanium: #e0e0e0;
        }

        .font-serif { font-family: 'Playfair Display', serif; letter-spacing: -1px; }
        .font-sans { font-family: 'Inter', sans-serif; }

        /* Animations */
        @keyframes lineGrow { from { height: 0; } to { height: 100%; } }
        
        .roadmap { position: relative; padding-left: 40px; margin-bottom: 80px; }
        .roadmap-line { position: absolute; left: 0; top: 0; width: 1px; height: 100%; background: var(--border); }
        .roadmap-progress { position: absolute; left: 0; top: 0; width: 1px; background: var(--titanium); animation: lineGrow 3s ease-in-out forwards; }
        .stage-item { position: relative; margin-bottom: 50px; }
        .stage-item::before {
            content: ""; position: absolute; left: -43.5px; top: 10px;
            width: 8px; height: 8px; background: var(--titanium); border-radius: 50%;
        }

        .stat-item span { display: block; font-size: 0.65rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 2px; }
        .stat-item strong { font-size: 1.4rem; font-weight: 200; color: var(--titanium); }

        .section-title { font-size: 2.2rem; margin-bottom: 40px; position: relative; font-weight: 400; }
        .section-title::after { content: ""; display: block; width: 60px; height: 1px; background: var(--text-muted); margin-top: 20px; }

        .btn-participate {
            display: block; width: 100%; padding: 22px;
            background: var(--text-main); color: #000;
            text-align: center; text-decoration: none; text-transform: uppercase;
            letter-spacing: 3px; font-size: 0.8rem; font-weight: 700;
            transition: 0.4s; cursor: pointer; border: 1px solid var(--text-main);
        }
        .btn-participate:hover { background: transparent; color: #fff; }

        .prize-card { border: 1px solid var(--border); padding: 40px; text-align: left; transition: 0.3s; }
        .prize-card:hover { border-color: var(--titanium); }
        .prize-pos { font-size: 3rem; font-weight: 200; margin-bottom: 10px; color: var(--titanium); }

        .patrons-grid {
            display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px;
            background: var(--border); border: 1px solid var(--border);
        }
        .patron-logo {
            background: var(--bg); padding: 30px; text-align: center;
            font-size: 0.75rem; text-transform: uppercase; letter-spacing: 3px; color: var(--text-muted);
        }

        .qa-q { font-weight: 400; font-size: 1.1rem; margin-bottom: 12px; color: var(--titanium); border-left: 1px solid var(--titanium); padding-left: 20px; }
        .qa-a { color: var(--text-muted); font-size: 0.95rem; padding-left: 21px; }

        .insight-card { padding: 40px; background: var(--surface); border: 1px solid var(--border); }
        .insight-quote { font-style: italic; color: var(--text-muted); margin-bottom: 20px; font-weight: 300; }
        .insight-author { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 2px; color: var(--titanium); }

        .meta-list li { display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid var(--border); font-size: 0.8rem; }
        .meta-list li span { color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
      `}</style>

      {/* Global App Header Preserved */}
      <Header />

      <div className="max-w-[1200px] mx-auto px-10 pt-20">
        
        {/* --- HERO SECTION --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center py-24">
            <div>
                <span className="text-[0.7rem] uppercase tracking-[3px] text-[#777] block mb-5">
                    {event.category} • {event.event_type}
                </span>
                <h1 className="font-serif text-[3rem] md:text-[4.5rem] leading-[1] font-bold mb-6">
                    {event.title}
                </h1>
                <p className="text-xl text-[#777] font-light mb-10 leading-relaxed">
                    {event.short_description}
                </p>
                <div className="w-[250px]">
                    <EventRegistrationModal 
                        event={event} 
                        trigger={<button className="btn-participate">Apply for Entry</button>} 
                    />
                </div>
            </div>
            <div 
                className="w-full h-[500px] bg-[#0a0a0a] bg-cover bg-center grayscale opacity-80"
                style={{ backgroundImage: `url(${event.image_url})` }}
            />
        </section>

        {/* --- STATS BAR --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 py-12 border-y border-[#1a1a1a] mb-24 gap-8 md:gap-0">
            <div className="stat-item"><span>Treasury Pool</span><strong>{event.prize_pool || "Unannounced"}</strong></div>
            <div className="stat-item"><span>Status</span><strong>{new Date(event.end_date) > new Date() ? 'Open' : 'Closed'}</strong></div>
            <div className="stat-item"><span>Team Limit</span><strong>{event.max_team_size ? `0${event.max_team_size} Members` : "Solo"}</strong></div>
            <div className="stat-item"><span>Applicants</span><strong>Verified</strong></div>
        </div>

        {/* --- MAIN GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-24 mb-24">
            
            {/* LEFT CONTENT COLUMN */}
            <div className="content-col">
                
                {/* Concept */}
                <section className="mb-20">
                    <h2 className="section-title font-serif">Concept & Rigor</h2>
                    <div className="text-[#777] font-light max-w-[600px] text-lg leading-relaxed whitespace-pre-wrap">
                        {event.description || event.short_description}
                    </div>
                </section>

                {/* Roadmap (Timeline) */}
                <section className="mb-20">
                    <h2 className="section-title font-serif">The Roadmap</h2>
                    <div className="roadmap">
                        <div className="roadmap-line"></div>
                        <div className="roadmap-progress"></div>
                        
                        <div className="stage-item">
                            <span className="text-[0.7rem] text-[#777] tracking-[2px] block mb-1">
                                {format(new Date(event.start_date), 'MMM dd')}
                            </span>
                            <h3 className="font-serif text-xl mb-1">Digital Manifest</h3>
                            <p className="text-[#777] text-sm">Official briefing and resource allocation.</p>
                        </div>
                        
                        <div className="stage-item">
                            <span className="text-[0.7rem] text-[#777] tracking-[2px] block mb-1">
                                {format(new Date(event.end_date), 'MMM dd')}
                            </span>
                            <h3 className="font-serif text-xl mb-1">Grand Submission</h3>
                            <p className="text-[#777] text-sm">Final project uploads and documentation freeze.</p>
                        </div>
                    </div>
                </section>

                {/* Prizes */}
                <section className="mb-20">
                    <h2 className="section-title font-serif">Prizes</h2>
                    <div className="prize-grid">
                        <div className="prize-card">
                            <div className="prize-pos">01</div>
                            <strong className="uppercase tracking-[2px] block">Grand Laurels</strong>
                            <p className="text-[#777] text-sm mt-2">{event.prize_pool ? `Share of ${event.prize_pool}` : "TBA"}</p>
                        </div>
                        <div className="prize-card">
                            <div className="prize-pos">02</div>
                            <strong className="uppercase tracking-[2px] block">Runner Up</strong>
                            <p className="text-[#777] text-sm mt-2">Special Recognition + Swag</p>
                        </div>
                    </div>
                </section>

                {/* Patrons (Static Design Element) */}
                <section className="mb-20">
                    <h2 className="section-title font-serif">Patrons</h2>
                    <div className="patrons-grid">
                        <div className="patron-logo">OpenAI</div>
                        <div className="patron-logo">Vercel</div>
                        <div className="patron-logo">Supabase</div>
                        <div className="patron-logo">Github</div>
                        <div className="patron-logo">React</div>
                        <div className="patron-logo">Stripe</div>
                    </div>
                </section>

                {/* FAQ / Conversation */}
                <section className="mb-20">
                    <h2 className="section-title font-serif">Conversation</h2>
                    <div className="mb-10">
                        <div className="qa-q">@developer: Is this open to beginners?</div>
                        <div className="qa-a">Organizer: While we encourage ambition, this event is designed for intermediate to advanced builders.</div>
                    </div>
                    <div className="mb-10">
                        <div className="qa-q">@team_lead: IP Ownership?</div>
                        <div className="qa-a">Organizer: All Intellectual Property created during the event remains 100% with the participants.</div>
                    </div>
                </section>

                {/* Insights */}
                <section>
                    <h2 className="section-title font-serif">Member Insights</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="insight-card">
                            <p className="insight-quote">"The technical depth expected here is on par with top-tier engineering."</p>
                            <span className="insight-author">— Sarah J., Full Stack</span>
                        </div>
                        <div className="insight-card">
                            <p className="insight-quote">"A perfect intersection of creative freedom and logical constraint."</p>
                            <span className="insight-author">— David L., Designer</span>
                        </div>
                    </div>
                </section>

            </div>

            {/* RIGHT SIDEBAR COLUMN */}
            <aside className="sidebar-col">
                <div className="sticky top-24 bg-[#0a0a0a] p-10 border border-[#1a1a1a]">
                    <h3 className="font-serif text-2xl mb-8 font-normal">Event Summary</h3>
                    
                    <EventRegistrationModal 
                        event={event} 
                        trigger={<button className="btn-participate mb-8">Participate Now</button>} 
                    />

                    <ul className="meta-list">
                        <li><span>Starts</span> <strong>{format(new Date(event.start_date), 'dd MMM yyyy')}</strong></li>
                        <li><span>Ends</span> <strong>{format(new Date(event.end_date), 'dd MMM yyyy')}</strong></li>
                        <li><span>Venue</span> <strong>{event.mode === 'Online' ? 'Remote' : event.location}</strong></li>
                        <li><span>Solo</span> <strong>ALLOWED</strong></li>
                        <li><span>Mode</span> <strong>{event.mode.toUpperCase()}</strong></li>
                    </ul>

                    <div className="mt-10 pt-6 border-t border-[#1a1a1a]">
                        <span className="text-[0.6rem] text-[#777] tracking-[2px] uppercase block">Concierge</span>
                        <p className="text-sm mt-1">help@codevo.com</p>
                    </div>
                </div>
            </aside>

        </div>
      </div>
    </div>
  );
}
