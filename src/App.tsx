import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Practice from "./pages/Practice";
import Exam from "./pages/Exam";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { SplashScreen } from "@/components/SplashScreen"; // Import the splash screen

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Check if the user has already seen the splash screen in this session
    const hasSeenSplash = sessionStorage.getItem("has_seen_splash");

    if (hasSeenSplash) {
      // If already seen (e.g., on refresh), skip splash
      setShowSplash(false);
    } else {
      // If not seen (new tab), show splash and set flag
      
      // Mark as seen immediately so it doesn't show on accidental quick reload
      sessionStorage.setItem("has_seen_splash", "true");

      // Duration of the splash screen (e.g., 3.5 seconds)
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, []);

  // Render Splash Screen if active
  if (showSplash) {
    return <SplashScreen />;
  }

  // Render Main App
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/exam" element={<Exam />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
