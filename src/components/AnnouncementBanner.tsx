import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StickyBanner } from "@/components/ui/sticky-banner";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Define the shape of your announcement data
type Announcement = {
  id: string;
  message: string;
  link: string | null;
  button_text: string | null;
  page_route: string;
  is_active: boolean | null;
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

  // 3. Carousel Logic (Cycles through messages if multiple exist)
  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 45000); // Very slow cycle to match scrolling speed
    return () => clearInterval(interval);
  }, [announcements.length]);

  if (announcements.length === 0 || !isVisible) return null;

  const currentAnnouncement = announcements[currentIndex];

  return (
    <>
      <style>{`
        @keyframes marquee-scroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee-slow {
          display: inline-block;
          white-space: nowrap;
          animation: marquee-scroll 40s linear infinite; /* Slower speed */
        }
        .animate-marquee-slow:hover {
          animation-play-state: paused;
        }
        .mask-gradient-fade {
          mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
        }
      `}</style>

      <StickyBanner 
        ref={bannerRef}
        onClose={() => setIsVisible(false)}
        className={cn(
          "fixed top-0 left-0 right-0 z-[60] transition-all duration-300",
          "border-b border-white/5 shadow-2xl backdrop-blur-md",
          // Premium Color Grading: Dark Indigo base with a subtle top glow
          "bg-[#0a0a0f] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/60 via-[#0a0a0f] to-[#0a0a0f]"
        )}
      >
        <div className="flex w-full items-center justify-between gap-4 px-4 py-1">
          
          {/* Main Content Area - 3/4th Width */}
          <div className="flex-1 flex justify-center w-full">
            <div className="w-full md:w-[75%] relative flex items-center overflow-hidden h-7 mask-gradient-fade">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentAnnouncement.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="w-full h-full relative flex items-center"
                >
                  {/* Scrolling Text */}
                  <div className="w-full absolute inset-0 flex items-center">
                    <span className="text-sm md:text-[15px] font-medium text-indigo-100/90 tracking-wide drop-shadow-sm animate-marquee-slow">
                      {currentAnnouncement.message} 
                      {/* Spacer for loop effect */}
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                      {currentAnnouncement.message}
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Action Button - Kept clean and minimal */}
          {currentAnnouncement.link && (
            <div className="shrink-0 z-10">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-4 text-xs font-semibold rounded-full bg-white/5 hover:bg-white/10 text-indigo-200 hover:text-white border border-white/5 transition-all shadow-sm"
                asChild
              >
                <a href={currentAnnouncement.link} target="_blank" rel="noreferrer">
                  {currentAnnouncement.button_text || "Explore"}
                </a>
              </Button>
            </div>
          )}
        </div>
      </StickyBanner>
    </>
  );
};
