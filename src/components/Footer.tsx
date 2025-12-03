import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Footer = () => {
  return (
    <footer className="border-t border-white/5 bg-[#0c0c0e] pt-16 relative z-10 w-full overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Column */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 group w-fit">
              {/* Logo with Hollow/Stroked Effect */}
              <span className={cn(
                "font-neuropol text-3xl font-bold tracking-widest transition-all duration-500",
                // Base State: Hollow with faint stroke (blends with background)
                "text-transparent bg-clip-text",
                "[-webkit-text-stroke:1px_rgba(255,255,255,0.15)]", 
                // Hover State: Bright white stroke + Glow
                "group-hover:[-webkit-text-stroke:1px_rgba(255,255,255,0.9)]",
                "group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]",
                "cursor-pointer select-none"
              )}>
                CODéVO
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              The ultimate platform for coding mastery. Built by IITians for the next generation of developers.
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
        <div className="border-t border-white/5 pt-8 pb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground text-center md:text-left">
            © {new Date().getFullYear()}. Made with <Heart className="w-3 h-3 inline text-red-500 mx-0.5 fill-red-500" /> by Unknown IITians.
          </p>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground/60 bg-white/5 px-3 py-1 rounded-full border border-white/5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            All Systems Operational
          </div>
        </div>
      </div>

      {/* Full Width Footer Text */}
      <div className="w-full border-t border-white/5 bg-[#0a0a0c] py-6">
         <h1 className="text-center font-neuropol text-[3vw] md:text-[4vw] font-bold text-white/5 tracking-widest leading-none select-none hover:text-white/10 transition-colors w-full px-4">
            CODEVO THE PRODUCT OF UNKNOWN IITIANS
         </h1>
      </div>
    </footer>
  );
};
