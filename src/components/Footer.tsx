import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Footer = () => {
  return (
    <footer className="border-t border-white/5 bg-[#0c0c0e] pt-16 pb-8 relative z-10 w-full overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Column - Top Left */}
          <div className="space-y-4">
            <Link to="/" className="flex flex-col items-start gap-1 group w-fit">
              {/* Logo with Unfilled/Stroked Text Effect */}
              <span className={cn(
                "font-neuropol text-4xl font-bold tracking-widest transition-all duration-500",
                // Unfilled state: Transparent text with stroke
                "text-transparent bg-clip-text",
                "[-webkit-text-stroke:1px_rgba(255,255,255,0.6)]", 
                // Hover state: Glow effect
                "group-hover:[-webkit-text-stroke:1px_#ffffff]",
                "group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]",
                "cursor-pointer select-none"
              )}>
                COD
                <span className="text-[1.2em] lowercase relative top-[1px] mx-[1px] inline-block">é</span>
                VO
              </span>
              {/* Subtitle - Splash Screen Design */}
              <span className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-medium text-muted-foreground/60 group-hover:text-white/90 transition-colors duration-500 pl-1">
                The Product of Unknown IITians
              </span>
            </Link>
            
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs pt-4">
              The ultimate platform for coding mastery.
            </p>
          </div>
          
          {/* Platform Links */}
          <div>
            <h4 className="font-bold text-white mb-6">Platform</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/practice" className="hover:text-primary transition-colors">Practice Arena</Link></li>
              <li><Link to="/compiler" className="hover:text-primary transition-colors">Online Compiler</Link></li>
              <li><Link to="/leaderboard" className="hover:text-primary transition-colors">Global Leaderboard</Link></li>
              <li><Link to="/degree" className="hover:text-primary transition-colors">IITM BS</Link></li>
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="font-bold text-white mb-6">Resources</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="#" className="hover:text-primary transition-colors">Documentation</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">API Reference</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Community Guidelines</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">FAQ & Support</Link></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-bold text-white mb-6">Legal</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Security</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar Details */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground text-center md:text-left">
            © {new Date().getFullYear()}. Made with <Heart className="w-3 h-3 inline text-red-500 mx-0.5 fill-red-500" /> in India.
          </p>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground/60 bg-white/5 px-3 py-1 rounded-full border border-white/5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            All Systems Operational
          </div>
        </div>
      </div>
    </footer>
  );
};
