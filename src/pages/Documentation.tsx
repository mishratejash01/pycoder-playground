import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Home, Code2, Terminal, GraduationCap, Trophy, Shield, User, Map, LayoutGrid, Server, Database, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// --- Types & Data ---

type DocSection = {
  id: string;
  title: string;
  route: string;
  icon: React.ReactNode;
  description: string;
  technicalDetails: string[];
  visualComponent: React.ReactNode;
};

const SECTIONS: DocSection[] = [
  {
    id: 'landing',
    title: 'Central Hub',
    route: '/',
    icon: <Home className="w-6 h-6 text-primary" />,
    description: "The primary interface serves as the central entry point for the CODéVO ecosystem. It orchestrates user navigation, showcases core platform capabilities, and provides immediate access to authentication and operational status metrics.",
    technicalDetails: ["Landing Page Architecture", "Feature Showcase Matrix", "Navigation Dock Integration"],
    visualComponent: (
      <div className="flex flex-col h-full bg-black/90 p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
        <div className="mt-8 space-y-4 text-center z-10">
          <div className="w-32 h-8 bg-white/10 rounded mx-auto mb-4" />
          <div className="text-2xl font-bold text-white tracking-widest font-neuropol">CODéVO</div>
          <div className="h-2 w-48 bg-white/20 rounded mx-auto" />
          <div className="flex justify-center gap-2 mt-4">
            <div className="w-8 h-8 rounded bg-white/5" />
            <div className="w-8 h-8 rounded bg-white/5" />
            <div className="w-8 h-8 rounded bg-white/5" />
          </div>
        </div>
        <div className="mt-auto bg-[#0c0c0e] rounded-t-xl h-32 border-t border-white/10 p-3">
           <div className="flex gap-2">
             <div className="w-1/3 h-16 bg-white/5 rounded" />
             <div className="w-2/3 h-16 bg-white/5 rounded" />
           </div>
        </div>
      </div>
    )
  },
  {
    id: 'auth',
    title: 'Authentication Module',
    route: '/auth',
    icon: <User className="w-6 h-6 text-blue-400" />,
    description: "A secure gateway facilitating identity verification via OAuth 2.0 protocols. This module manages session persistence, user profile synchronization, and access control for protected academic resources.",
    technicalDetails: ["Supabase Auth Integration", "Session Token Management", "Secure Route Protection"],
    visualComponent: (
      <div className="flex items-center justify-center h-full bg-[#050505] p-8">
        <div className="w-full max-w-[200px] space-y-4">
          <div className="h-6 w-1/2 bg-white/10 rounded" />
          <div className="h-2 w-3/4 bg-white/5 rounded" />
          <div className="h-10 w-full bg-white/10 rounded flex items-center justify-center gap-2 border border-white/5">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <div className="h-2 w-16 bg-white/20 rounded" />
          </div>
          <div className="h-px w-full bg-white/10 my-4" />
          <div className="text-center">
             <span className="font-neuropol text-white text-xl">COD<span className="lowercase">é</span>VO</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'degree',
    title: 'Academic Dashboard',
    route: '/degree',
    icon: <GraduationCap className="w-6 h-6 text-green-400" />,
    description: "The dedicated interface for the IIT Madras BS Degree curriculum. It structures academic content hierarchically, allowing filtering by Foundation, Diploma, and Degree levels, and connects students to specific subject modules.",
    technicalDetails: ["Hierarchical Data Modeling", "Level-based Filtering", "Dynamic Subject Retrieval"],
    visualComponent: (
      <div className="flex flex-col h-full bg-[#09090b] p-4">
        <div className="flex gap-2 mb-4">
          <div className="h-8 w-20 bg-primary/20 rounded border border-primary/30" />
          <div className="h-8 w-20 bg-white/5 rounded border border-white/10" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-video bg-white/5 rounded border border-white/10 p-2 flex flex-col justify-between">
              <div className="w-6 h-6 bg-white/10 rounded" />
              <div className="h-2 w-3/4 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    id: 'practice',
    title: 'Practice Environment',
    route: '/practice',
    icon: <Code2 className="w-6 h-6 text-purple-400" />,
    description: "An advanced integrated development environment (IDE) tailored for skill acquisition. Features include a Monaco-based code editor, real-time syntax highlighting, and an automated test-case execution engine.",
    technicalDetails: ["Monaco Editor Implementation", "Client-side Execution", "Test Case Validation Logic"],
    visualComponent: (
      <div className="flex h-full bg-[#1e1e1e] font-mono text-[6px] text-gray-400">
        <div className="w-1/4 border-r border-white/10 p-2 space-y-2 bg-[#0c0c0e]">
          <div className="h-2 w-10 bg-white/20 rounded" />
          <div className="h-2 w-full bg-white/5 rounded" />
          <div className="h-2 w-full bg-white/5 rounded" />
        </div>
        <div className="w-3/4 p-2 space-y-1">
          <div className="flex gap-2"><span className="text-purple-400">def</span> <span className="text-yellow-200">solve</span>():</div>
          <div className="pl-4 text-green-400">return "Success"</div>
          <div className="mt-8 border-t border-white/10 pt-2 text-blue-300">
            {">"} Running tests...
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'exam',
    title: 'Proctored Assessment',
    route: '/exam',
    icon: <Shield className="w-6 h-6 text-red-500" />,
    description: "A secure, controlled environment for high-stakes evaluations. Enforces full-screen mode, monitors tab switching, and utilizes webcam/audio inputs to ensure integrity during the examination process.",
    technicalDetails: ["Fullscreen API Enforcement", "Media Stream Analysis", "Anti-Cheat Heuristics"],
    visualComponent: (
      <div className="flex flex-col h-full bg-black relative">
        <div className="absolute top-2 right-2 w-12 h-8 bg-gray-800 rounded border border-red-500/50 flex items-center justify-center">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </div>
        <div className="h-8 border-b border-white/10 flex items-center px-2 gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <div className="h-1 w-20 bg-white/20 rounded" />
        </div>
        <div className="flex-1 flex items-center justify-center text-red-900/20 font-bold text-4xl select-none">
          SECURE
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-950/50 border border-red-500/30 px-3 py-1 rounded text-[8px] text-red-200">
          ● REC
        </div>
      </div>
    )
  },
  {
    id: 'leaderboard',
    title: 'Global Rankings',
    route: '/leaderboard',
    icon: <Trophy className="w-6 h-6 text-yellow-500" />,
    description: "A competitive tracking system displaying top performers. Aggregates scores from practice sessions and exams, presenting them in a monthly or all-time format to foster healthy competition.",
    technicalDetails: ["Score Aggregation Algorithms", "Real-time DB Subscriptions", "Ranking Logic"],
    visualComponent: (
      <div className="flex flex-col h-full bg-[#0c0c0e] p-4">
        <div className="flex justify-center mb-4"><Trophy className="w-8 h-8 text-yellow-500" /></div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-white/10 text-[6px] flex items-center justify-center">{i}</div>
                <div className="w-12 h-2 bg-white/20 rounded" />
              </div>
              <div className="w-6 h-2 bg-yellow-500/50 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }
];

// --- Components ---

const LaptopFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="relative w-full max-w-[500px] aspect-[16/10] perspective-1000 group">
    {/* Lid/Screen */}
    <div className="relative w-full h-full bg-[#121212] rounded-[1rem] border-[6px] border-[#2a2a2a] shadow-2xl overflow-hidden transform-gpu transition-transform duration-700 ease-out group-hover:rotate-x-2">
      {/* Camera Dot */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#0f0f0f] rounded-full border border-white/10 z-20" />
      {/* Screen Content */}
      <div className="w-full h-full bg-black overflow-hidden relative">
        {children}
        {/* Screen Glare */}
        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
      </div>
    </div>
    
    {/* Base */}
    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[120%] h-4 bg-[#1a1a1a] rounded-b-xl border-t border-[#333] shadow-xl z-0 transform translate-z-10">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-[#222] rounded-b-md" />
    </div>
  </div>
);

const Documentation = () => {
  const navigate = useNavigate();
  const [activeSectionId, setActiveSectionId] = useState<string>(SECTIONS[0].id);
  
  // Create refs for each section to observe
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSectionId(entry.target.id);
          }
        });
      },
      {
        root: null,
        rootMargin: '-40% 0px -40% 0px', // Trigger when section is in the middle of screen
        threshold: 0.2,
      }
    );

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const activeSection = SECTIONS.find(s => s.id === activeSectionId) || SECTIONS[0];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-primary/30">
      
      {/* Top Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/5 h-16 flex items-center px-6 md:px-12">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')} 
          className="text-muted-foreground hover:text-white transition-colors pl-0 gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Platform
        </Button>
        <div className="ml-auto font-neuropol text-sm tracking-widest text-white/50">
          SYS.DOCS.V1
        </div>
      </nav>

      <div className="flex flex-col lg:flex-row relative pt-16">
        
        {/* LEFT COLUMN: Scrollable Content */}
        <div className="w-full lg:w-1/2 p-6 md:p-16 lg:p-24 space-y-32">
          
          <div className="space-y-6 mb-24">
            <h1 className="text-5xl md:text-7xl font-bold font-neuropol tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">
              System<br/>Architecture
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
              This document serves as the comprehensive manual for the <span className="text-white font-bold">CODéVO</span> ecosystem. Follow this guide to navigate the platform's various operational zones.
            </p>
          </div>

          {SECTIONS.map((section, index) => (
            <div 
              key={section.id} 
              id={section.id}
              ref={el => sectionRefs.current[section.id] = el}
              className="scroll-mt-32 space-y-8 group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:bg-primary/10 group-hover:border-primary/50 transition-all duration-500">
                  {section.icon}
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                <Badge variant="outline" className="font-mono text-xs border-white/10 text-muted-foreground">
                  0{index + 1}
                </Badge>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-white group-hover:text-primary transition-colors duration-300">
                {section.title}
              </h2>

              <p className="text-lg text-gray-400 leading-8">
                {section.description}
              </p>

              <Card className="bg-[#0a0a0a] border-white/5 shadow-inner">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground font-mono">
                    Technical Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {section.technicalDetails.map((tech, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                        {tech}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Button 
                variant="link" 
                onClick={() => navigate(section.route)}
                className="text-primary hover:text-white p-0 h-auto text-base font-medium group/link"
              >
                Access Module <span className="ml-2 transition-transform group-hover/link:translate-x-1">→</span>
              </Button>
            </div>
          ))}

          <div className="h-[20vh]" /> {/* Bottom spacer */}
        </div>

        {/* RIGHT COLUMN: Sticky Visuals */}
        <div className="hidden lg:flex w-1/2 sticky top-16 h-[calc(100vh-4rem)] items-center justify-center bg-[#050505] border-l border-white/5">
          <div className="w-full max-w-lg relative">
            {/* Background Decoration */}
            <div className="absolute -inset-20 bg-gradient-to-tr from-primary/10 via-transparent to-purple-500/10 blur-3xl opacity-50 rounded-full" />
            
            <LaptopFrame>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.4, ease: "circOut" }}
                  className="w-full h-full"
                >
                  {activeSection.visualComponent}
                </motion.div>
              </AnimatePresence>
            </LaptopFrame>

            <div className="mt-12 text-center">
              <motion.div
                key={`text-${activeSection.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className="font-mono text-xs text-primary uppercase tracking-[0.3em] mb-2">
                  System Preview
                </p>
                <h3 className="text-xl font-bold text-white">
                  {activeSection.title}
                </h3>
              </motion.div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Documentation;
