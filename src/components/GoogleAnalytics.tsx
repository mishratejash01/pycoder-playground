import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReactGA from "react-ga4";

const MEASUREMENT_ID = "G-TR0E0NZM6J"; 

export const GoogleAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // 1. Initialize Google Analytics (only once)
    if (!window.GA_INITIALIZED) {
      ReactGA.initialize(MEASUREMENT_ID);
      window.GA_INITIALIZED = true;
    }

    // 2. Send pageview event on route change
    ReactGA.send({ 
        hitType: "pageview", 
        page: location.pathname + location.search,
        title: document.title
    });
    
  }, [location]);

  return null;
};

// Type definition to prevent TypeScript errors
declare global {
  interface Window {
    GA_INITIALIZED: boolean;
  }
}
