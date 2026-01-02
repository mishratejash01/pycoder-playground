import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StickyBanner } from "@/components/ui/sticky-banner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

// Update the type to include the new column
type Announcement = {
  id: string;
  message: string;
  link: string | null;
  button_text: string | null;
  page_route: string;
  is_active: boolean | null;
  is_dismissible?: boolean | null; // Added this field
};

export const AnnouncementBanner = () => {
  const location = useLocation();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const bannerRef = useRef<HTMLDivElement>(null);

  // 1. Fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from("announcements")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (!error && data) {
          const filtered = data.filter(
            (item) =>
              item.page_route === "*" || item.page_route === location.pathname
          );
          // Cast data to Announcement[] to handle the new column dynamically
          setAnnouncements(filtered as Announcement[]);
        }
      } catch (err) {
        console.error("Failed to fetch announcements", err);
      }
    };

    fetchAnnouncements();
  }, [location.pathname]);

  // 2. Sync Height to CSS Variable
  useEffect(() => {
    const updateHeight = () => {
      const height = isVisible && announcements.length > 0 && bannerRef.current 
        ? bannerRef.current.offsetHeight 
        : 0;
      document.documentElement.style.setProperty('--banner-height', `${height}px`);
    };

    updateHeight();
    const resizeObserver = new ResizeObserver(updateHeight);
    if (bannerRef.current) resizeObserver.observe(bannerRef.current);

    return () => {
      resizeObserver.disconnect();
      document.documentElement.style.setProperty('--banner-height', '0px');
    };
  }, [isVisible, announcements, currentIndex]);

  // 3. Carousel Logic
  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 45000); 
    return () => clearInterval(interval);
  }, [announcements.length]);

  if (announcements.length === 0 || !isVisible) return null;

  const currentAnnouncement = announcements[currentIndex];

  // Logic: Only show the close button if 'is_dismissible' is explicitly NOT false.
  // This handles the default case where it might be true or undefined.
  const showCloseButton = currentAnnouncement.is_dismissible !== false;

  return (
    <>
      <style>{`
        @keyframes marquee-infinite {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-infinite {
          display: flex;
          width: fit-content;
          animation: marquee-infinite 90s linear infinite;
        }
        .animate-marquee-infinite:hover {
          animation-play-state: paused;
        }
        .mask-fade-wide {
          mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
        }
      `}</style>

      <StickyBanner 
        ref={bannerRef}
        // Conditionally pass the onClose handler. If undefined, StickyBanner hides the button.
        onClose={showCloseButton ? () => setIsVisible(false) : undefined}
        className={cn(
          "fixed top-0 left-0 right-0 z-[60] transition-all duration-500 ease-in-out",
          "border-b border-white/5 backdrop-blur-xl py-0", 
          // Sleek Dark Gradient
          "bg-[#020202] bg-[linear-gradient(180deg,rgba(109,40,217,0.1)_0%,rgba(2,2,2,0.9)_100%)]"
        )}
      >
        {/* Compact container: h-8 (32px) total height */}
        <div className="flex w-full items-center justify-between gap-4 px-4 h-8">
          
          {/* SCROLLING TEXT AREA */}
          <div className="flex-1 flex justify-center w-full h-full items-center">
            <div className="w-[85%] md:w-[75%] relative flex items-center overflow-hidden mask-fade-wide h-full">
               <div className="animate-marquee-infinite flex items-center">
                  {[0, 1, 2, 3].map((i) => (
                    <span 
                      key={i} 
                      // Compact Font: text-xs md:text-sm
                      className="mx-12 font-sans italic text-xs md:text-sm font-medium text-gray-300/90 tracking-wide whitespace-nowrap flex items-center"
                    >
                      {/* Smaller dot */}
                      <span className="w-1 h-1 rounded-full bg-violet-400 mr-3 opacity-75" />
                      {currentAnnouncement.message}
                    </span>
                  ))}
               </div>
            </div>
          </div>

          {/* FIXED BUTTON AREA */}
          {currentAnnouncement.link && (
            <div className="shrink-0 z-20 flex items-center">
              <Button
                size="sm"
                variant="ghost"
                // Compact Button: h-6, smaller text
                className="h-6 px-3 text-[10px] font-sans italic text-violet-300 hover:text-white hover:bg-white/5 rounded-full border border-white/5 transition-all shadow-sm group"
                asChild
              >
                <a href={currentAnnouncement.link} target="_blank" rel="noreferrer">
                  {currentAnnouncement.button_text || "Explore"}
                  <ChevronRight className="w-2.5 h-2.5 ml-1 opacity-50 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </Button>
            </div>
          )}
        </div>
      </StickyBanner>
    </>
  );
};
