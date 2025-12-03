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
            <Link to="/" className="flex flex-col items-start gap-2 group w-fit">
              {/* Logo - Solid Filled */}
              <span className="font-neuropol text-4xl font-bold tracking-wider text-white cursor-pointer select-none">
                COD
                <span className="text-[1.2em] lowercase relative top-[1px] mx-[1px] inline-block">é</span>
                VO
              </span>
              
              {/* Subtitle - Single Line Below, Left Aligned */}
              <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-muted-foreground/80 whitespace-nowrap pl-1">
                The Product of Unknown IITians
              </span>
            </Link>
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

        {/* Know More Section - Full Width */}
        <div className="border-t border-white/5 py-8">
          <div className="max-w-4xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Know More</h3>
            <p className="text-sm text-muted-foreground/80 leading-7 text-justify md:text-left">
              So, here's the deal. We're just a group of unknown IITians who got tired of boring, grayscale coding platforms that look like they were made in 1995. We wanted something that screams 'I code, therefore I am cool' (or at least, I try to be). CODéVO is our brain-child, born from late-night debugging sessions and way too much hostel coffee. It's built for those who think <code className="text-primary bg-primary/10 px-1 py-0.5 rounded text-xs">O(n^2)</code> is just a suggestion and that "it works on my machine" is a valid defense. Poke around, break things, and maybe learn something along the way. Just don't ask us how the backend works; it's mostly magic and duct tape.
            </p>
          </div>
        </div>

        {/* Bottom Bar Details */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground text-center md:text-left">
            © {new Date().getFullYear()}. Made with <Heart className="w-3 h-3 inline text-red-500 mx-0.5 fill-red-500" /> by Unknown IITians.
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
