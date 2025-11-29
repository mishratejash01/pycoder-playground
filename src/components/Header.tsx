import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  // Suggestions for your text link buttons
  const links = [
    { label: 'Services', href: '/services' },
    { label: 'Projects', href: '/projects' },
    { label: 'About', href: '/about' },
  ];

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 mx-auto w-full border-b border-transparent transition-all duration-300 ease-out',
        {
          'bg-black/80 backdrop-blur-md border-white/10 shadow-md': scrolled,
          'bg-transparent': !scrolled && !open,
          'bg-[#09090b]': open,
        }
      )}
    >
      <div className="container mx-auto px-4 md:px-6">
        <nav className="flex h-16 w-full items-center justify-between">
          {/* LEFT: Logo in Neuropol X */}
          <Link to="/" className="flex items-center gap-2 z-50">
            <span className="font-neuropol text-2xl md:text-3xl font-bold tracking-wider text-white hover:text-primary transition-colors">
              CODéVO
            </span>
          </Link>

          {/* CENTER: Text Links (Hidden on Mobile) */}
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {links.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* RIGHT: Login Button & Mobile Toggle */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex">
              <Button 
                variant="outline" 
                className="border-primary/20 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all rounded-full px-6"
                onClick={() => navigate('/auth')}
              >
                Login
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-muted-foreground hover:text-white"
              onClick={() => setOpen(!open)}
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      {open && (
        <div className="fixed inset-0 top-16 z-40 bg-[#09090b] border-t border-white/10 md:hidden animate-in slide-in-from-top-5 duration-200">
          <div className="flex flex-col p-6 gap-6">
            {links.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setOpen(false)}
                className="text-lg font-medium text-muted-foreground hover:text-primary transition-colors py-2 border-b border-white/5"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4">
              <Button 
                className="w-full bg-primary hover:bg-primary/90 rounded-full" 
                onClick={() => {
                  setOpen(false);
                  navigate('/auth');
                }}
              >
                Login
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
