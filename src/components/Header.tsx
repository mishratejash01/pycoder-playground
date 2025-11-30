import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { Button, buttonVariants } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LogIn, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

interface HeaderProps {
  session: Session | null;
  onLogout: () => void;
}

export function Header({ session, onLogout }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email;

  // FETCH MENU STRUCTURE (Levels -> Subjects)
  const { data: menuStructure = [] } = useQuery({
    queryKey: ['iitm_menu_structure'],
    queryFn: async () => {
      // 1. Fetch Levels sorted by sequence (Foundation -> Diploma -> Degree)
      const { data: levels, error: levelsError } = await supabase
        .from('iitm_levels')
        .select('*')
        .order('sequence', { ascending: true });

      if (levelsError) throw levelsError;
      if (!levels) return [];

      // 2. Fetch all subjects
      const { data: subjects, error: subjectsError } = await supabase
        .from('iitm_subjects')
        .select('*')
        .order('name');
      
      if (subjectsError) throw subjectsError;

      // 3. Group subjects by level_id
      return levels.map(level => ({
        ...level,
        subjects: subjects?.filter(s => s.level_id === level.id) || []
      }));
    }
  });

  const ListItem = ({ className, title, href, ...props }: any) => (
    <li>
      <NavigationMenuLink asChild>
        <Link
          to={href}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none text-white">{title}</div>
        </Link>
      </NavigationMenuLink>
    </li>
  );

  return (
    <header className="fixed top-5 z-50 left-0 right-0 mx-auto w-full max-w-6xl px-4 md:px-0 transition-all duration-300">
      <div className={cn(
        "rounded-2xl border border-white/10 shadow-2xl",
        "bg-black/60 backdrop-blur-xl supports-[backdrop-filter]:bg-black/40",
        "transition-all duration-300 hover:border-primary/20"
      )}>
        <nav className="flex items-center justify-between p-2 px-6">
          
          {/* LEFT: Logo */}
          <Link to="/" className="flex items-center gap-2 group mr-8">
            <span className={cn(
              "font-neuropol text-xl md:text-2xl font-bold tracking-wider text-white",
              "transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
            )}>
              COD
              <span className="text-[1.2em] lowercase relative top-[1px] mx-[1px] inline-block">é</span>
              VO
            </span>
          </Link>

          {/* CENTER: Mega Menu */}
          <div className="hidden md:flex flex-1 justify-center">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-muted-foreground hover:text-white hover:bg-white/5 data-[state=open]:bg-white/10">
                    IITM BS DEGREE
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid gap-3 p-6 md:w-[600px] lg:w-[700px] lg:grid-cols-3 bg-[#0c0c0e] border border-white/10">
                      
                      {/* DYNAMIC COLUMNS based on Database Levels */}
                      {menuStructure.map((level) => (
                        <div key={level.id} className="space-y-3">
                          <h4 className="font-medium leading-none text-primary mb-2 border-b border-white/10 pb-2">
                            {level.name}
                          </h4>
                          <ul className="space-y-1">
                            {level.subjects.length > 0 ? (
                              level.subjects.map((sub: any) => (
                                <ListItem 
                                  key={sub.id} 
                                  title={sub.name} 
                                  href={`/degree/subject/${sub.id}/${encodeURIComponent(sub.name)}`} 
                                />
                              ))
                            ) : (
                              <li className="text-xs text-muted-foreground px-3 py-2 italic">No subjects yet</li>
                            )}
                          </ul>
                        </div>
                      ))}

                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <Link to="/about" className={cn(buttonVariants({ variant: "ghost" }), "text-muted-foreground hover:text-white hover:bg-white/5")}>
                    About
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* RIGHT: Auth */}
          <div className="flex items-center gap-2">
            {session ? (
              <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md shadow-inner group hover:bg-white/10">
                <span className="text-xs font-medium text-gray-200 max-w-[150px] truncate">{userName}</span>
                <div className="h-4 w-px bg-white/10 mx-1" />
                <button onClick={onLogout} className="text-muted-foreground hover:text-white transition-colors" title="Logout">
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <Button size="sm" className="hidden md:flex bg-primary hover:bg-primary/90 text-white rounded-xl px-6" onClick={() => navigate('/auth')}>
                <LogIn className="h-3.5 w-3.5 mr-2" /> Login
              </Button>
            )}

            {/* Mobile Menu */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden rounded-xl text-muted-foreground">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="w-full bg-[#09090b]/95 backdrop-blur-2xl border-b border-white/10 text-white pt-20">
                <div className="flex flex-col gap-6 p-4">
                  <div className="font-bold text-lg text-primary">IITM BS DEGREE</div>
                  
                  {/* Mobile Dynamic Menu */}
                  {menuStructure.map((level) => (
                    <div key={level.id} className="space-y-2">
                      <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{level.name}</div>
                      <div className="grid grid-cols-1 gap-2 pl-4 border-l border-white/10">
                        {level.subjects.map((sub: any) => (
                          <Link 
                            key={sub.id} 
                            to={`/degree/subject/${sub.id}/${encodeURIComponent(sub.name)}`} 
                            onClick={() => setOpen(false)}
                            className="block py-2 text-white hover:text-primary transition-colors text-sm"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}

                  {session && <Button variant="destructive" onClick={onLogout}>Sign Out</Button>}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </header>
  );
}
