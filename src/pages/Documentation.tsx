import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Home, Code2, GraduationCap, Trophy, Shield, User, Terminal, ChevronRight, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// --- Mini Visual Components (Mockups - Kept as requested) ---

// Abstract Version
const MiniLanding = () => (
  <div className="flex flex-col h-full bg-[#050505] p-4 relative overflow-hidden font-sans">
    <div className="absolute top-0 left-0 right-0 h-1 bg-white/20" />
    <div className="mt-8 space-y-4 text-center z-10">
      <div className="w-32 h-6 bg-white/10 rounded-sm mx-auto mb-4" />
      <div className="text-2xl font-bold text-white tracking-widest font-neuropol">CODéVO</div>
      <div className="h-2 w-48 bg-white/10 rounded-sm mx-auto" />
      <div className="flex justify-center gap-2 mt-4">
        <div className="w-8 h-8 rounded-sm bg-white/5 border border-white/10" />
        <div className="w-8 h-8 rounded-sm bg-white/5 border border-white/10" />
        <div className="w-8 h-8 rounded-sm bg-white/5 border border-white/10" />
      </div>
    </div>
    <div className="mt-auto bg-[#0a0a0a] rounded-t-lg h-32 border-t border-white/10 p-3">
       <div className="flex gap-2">
         <div className="w-1/3 h-16 bg-white/5 rounded-sm" />
         <div className="w-2/3 h-16 bg-white/5 rounded-sm" />
       </div>
    </div>
  </div>
);

const MiniAuth = () => (
  <div className="flex h-full bg-[#050505]">
    <div className="w-1/2 p-6 flex flex-col justify-center space-y-4">
      <div className="space-y-1">
        <div className="h-3 w-20 bg-white/20 rounded-sm" />
        <div className="h-5 w-32 bg-white rounded-sm" />
      </div>
      <div className="h-8 w-full bg-white text-black rounded-sm flex items-center justify-center gap-2 text-[8px] font-bold">
        <div className="w-2 h-2 bg-black rounded-full" /> Google Sign In
      </div>
      <div className="h-px w-full bg-white/10" />
      <div className="font-neuropol text-[10px] text-white/50 text-center">CODéVO</div>
    </div>
    <div className="w-1/2 bg-black relative overflow-hidden flex items-center justify-center border-l border-white/10">
      <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px] opacity-20" />
      <div className="font-mono text-[8px] text-white/50">Authenticate</div>
    </div>
  </div>
);

const MiniDegree = () => (
  <div className="flex flex-col h-full bg-[#050505] p-4">
    <div className="flex gap-2 mb-4">
      <div className="h-6 w-20 bg-white text-black rounded-sm flex items-center justify-center text-[8px] font-bold">BS Degree</div>
      <div className="h-6 w-20 bg-white/5 rounded-sm border border-white/10" />
    </div>
    <div className="grid grid-cols-2 gap-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="aspect-video bg-white/5 rounded-sm border border-white/10 p-2 flex flex-col justify-between">
          <div className="w-6 h-6 bg-white/10 rounded-sm" />
          <div className="h-2 w-3/4 bg-white/10 rounded-sm" />
        </div>
      ))}
    </div>
  </div>
);

const MiniPractice = () => (
  <div className="flex h-full bg-[#050505] text-[6px] font-mono">
    <div className="w-1/4 border-r border-white/10 bg-[#0a0a0a] flex flex-col">
      <div className="p-2 border-b border-white/10 font-bold text-gray-400">FILES</div>
      {[1,2,3,4].map(i => (
        <div key={i} className={cn("p-2 border-b border-white/5 flex items-center gap-2", i === 1 ? "bg-white/10 text-white" : "text-gray-600")}>
          <div className={cn("w-1 h-1 rounded-sm", i===1 ? "bg-white" : "bg-gray-700")} />
          prob_{i}.py
        </div>
      ))}
    </div>
    <div className="flex-1 flex flex-col">
      <div className="h-6 border-b border-white/10 flex items-center px-2 bg-[#0a0a0a] justify-between">
        <span className="text-gray-300">main.py</span>
        <div className="flex gap-1">
          <div className="px-2 py-0.5 bg-white text-black font-bold rounded-[2px]">RUN</div>
        </div>
      </div>
      <div className="flex-1 p-2 space-y-1 bg-[#050505]">
        <div className="text-gray-600"># Solution</div>
        <div><span className="text-white">def</span> <span className="text-gray-300">solve</span>(x):</div>
        <div className="pl-2"><span className="text-white">return</span> x * <span className="text-gray-400">2</span></div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="w-1 h-2 bg-white ml-2 mt-1"
        />
      </div>
      <div className="h-1/3 border-t border-white/10 bg-[#0a0a0a] p-2">
        <div className="text-gray-400 mb-1">{">"} Running tests...</div>
        <div className="text-white">{">"} All Passed (0.02s)</div>
      </div>
    </div>
  </div>
);

const MiniExam = () => (
  <div className="flex flex-col h-full bg-[#050505] relative font-sans">
    <div className="h-8 bg-white/5 border-b border-white/10 flex items-center justify-between px-3">
      <div className="flex items-center gap-2">
        <Shield className="w-3 h-3 text-white" />
        <span className="text-[8px] font-bold text-white tracking-widest">SECURE MODE</span>
      </div>
      <div className="text-[8px] font-mono text-gray-400">01:59:45</div>
    </div>
    <div className="flex-1 flex relative">
      <div className="flex-1 p-4">
        <div className="h-2 w-1/3 bg-white/20 rounded-sm mb-4" />
        <div className="space-y-2">
          <div className="h-1.5 w-full bg-white/10 rounded-sm" />
          <div className="h-1.5 w-5/6 bg-white/10 rounded-sm" />
        </div>
        <div className="mt-6 grid grid-cols-1 gap-2">
          <div className="h-6 border border-white/10 rounded-sm bg-white/5 flex items-center px-2 text-[8px] text-gray-500">Option A</div>
          <div className="h-6 border border-white/40 rounded-sm bg-white/10 flex items-center px-2 text-[8px] text-white font-medium">Option B</div>
          <div className="h-6 border border-white/10 rounded-sm bg-white/5 flex items-center px-2 text-[8px] text-gray-500">Option C</div>
        </div>
      </div>
      <div className="absolute top-2 right-2 w-16 h-12 bg-[#111] border border-white/10 rounded-sm flex items-center justify-center">
         <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
      </div>
    </div>
  </div>
);

const MiniLeaderboard = () => (
  <div className="flex flex-col h-full bg-[#050505] p-4 font-sans">
    <div className="flex items-center justify-center mb-4 space-x-2">
      <Trophy className="w-4 h-4 text-white" />
      <span className="text-[10px] font-bold text-white tracking-widest">RANKINGS</span>
    </div>
    <div className="space-y-1.5">
      {[1, 2, 3].map((rank, i) => (
        <div key={i} className="flex items-center justify-between p-2 rounded-sm border border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-white/10 flex items-center justify-center text-[8px] font-bold text-white">{rank}</div>
            <div className="h-1.5 w-12 bg-white/10 rounded-sm" />
          </div>
          <div className="h-1.5 w-6 bg-white/10 rounded-sm" />
        </div>
      ))}
    </div>
  </div>
);

// --- Main Data ---

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
    title: 'Navigation & Dashboard',
    route: '/',
    icon: <Home className="w-5 h-5" />,
    description: "The primary entry vector serves as the operational command center. It facilitates high-level ecosystem navigation, presents core platform capabilities, and provides immediate status metrics through a unified interface.",
    technicalDetails: ["Dynamic Route Rendering", "Interactive Feature Showcase", "Global State Management"],
    visualComponent: <MiniLanding />
  },
  {
    id: 'auth',
    title: 'Identity Management',
    route: '/auth',
    icon: <User className="w-5 h-5" />,
    description: "A robust authentication gateway utilizing OAuth 2.0 protocols. This module handles secure session initiation, JWT token persistence, and role-based access control for protected academic resources.",
    technicalDetails: ["OAuth 2.0 Integration", "JWT Token Handling", "Session Persistence"],
    visualComponent: <MiniAuth />
  },
  {
    id: 'degree',
    title: 'Curriculum Dashboard',
    route: '/degree',
    icon: <GraduationCap className="w-5 h-5" />,
    description: "Specialized interface for academic programs implementing a hierarchical content structure. Enables granular filtering by academic level (Foundation, Diploma, Degree) and subject matter domains.",
    technicalDetails: ["Relational Data Mapping", "Real-time Filtering", "Dynamic Hydration"],
    visualComponent: <MiniDegree />
  },
  {
    id: 'practice',
    title: 'Development Environment',
    route: '/practice',
    icon: <Code2 className="w-5 h-5" />,
    description: "Feature-rich coding environment tailored for skill acquisition. Integrates the Monaco Editor for professional syntax highlighting and employs a WebAssembly runtime for secure, client-side execution.",
    technicalDetails: ["Monaco Editor Engine", "Pyodide WASM Runtime", "Client-side Sandboxing"],
    visualComponent: <MiniPractice />
  },
  {
    id: 'exam',
    title: 'Secure Assessment',
    route: '/exam',
    icon: <Shield className="w-5 h-5" />,
    description: "Hardened environment designed for formal evaluations. Enforces strict compliance via Fullscreen API integration, visibility state monitoring, and browser fingerprinting prevention mechanisms.",
    technicalDetails: ["Fullscreen API Enforcement", "Visibility API Monitoring", "Input Interception"],
    visualComponent: <MiniExam />
  },
  {
    id: 'leaderboard',
    title: 'Global Metrics',
    route: '/leaderboard',
    icon: <Trophy className="w-5 h-5" />,
    description: "Analytics-driven leaderboard system aggregating user performance. Employs real-time database subscriptions to reflect score updates instantaneously across the global user base.",
    technicalDetails: ["Real-time Aggregation", "PostgreSQL Views", "Query Caching"],
    visualComponent: <MiniLeaderboard />
  }
];

// --- Components ---

const LaptopFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="relative w-full max-w-[600px] aspect-[16/10] perspective-1000 group mx-auto">
    {/* Lid/Screen */}
    <div className="relative w-full h-full bg-[#0a0a0a] rounded-[6px] border border-[#333] shadow-2xl overflow-hidden ring-1 ring-white/5">
      {/* Screen Content */}
      <div className="w-full h-full bg-black overflow-hidden relative">
        {children}
        {/* Subtle Glare */}
        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-white/[0.02] to-transparent pointer-events-none z-10" />
      </div>
    </div>
    
    {/* Base - Keyboard Area Mockup */}
    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[102%] h-2 bg-[#1a1a1a] rounded-b-md border-t border-[#333] shadow-[0_20px_40px_-10px_rgba(0,0,0,1)] z-0 flex justify-center">
      <div className="w-16 h-1 bg-[#2a2a2a] rounded-b-sm mt-[1px]" />
    </div>
  </div>
);

const Documentation = () => {
  const navigate = useNavigate();
  const [activeSectionId, setActiveSectionId] = useState<string>(SECTIONS[0].id);
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
      { root: null, rootMargin: '-45% 0px -45% 0px', threshold: 0.1 }
    );

    Object.values(sectionRefs.current).forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  const activeSection = SECTIONS.find(s => s.id === activeSectionId) || SECTIONS[0];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white/20">
      
      {/* Top Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5 h-16 flex items-center px-6 md:px-12 justify-between">
        <Button variant="ghost" onClick={() => navigate('/')} className="text-gray-400 hover:text-white transition-colors pl-0 gap-2 hover:bg-transparent text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Platform
        </Button>
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
          <span className="font-mono text-xs text-white/40 tracking-wider">SYSTEM_DOCS</span>
        </div>
      </nav>

      <div className="flex flex-col lg:flex-row relative pt-16">
        
        {/* LEFT COLUMN: Scrollable Content */}
        <div className="w-full lg:w-[45%] p-6 md:p-12 lg:p-16 space-y-40 pb-40">
          
          <div className="space-y-8 pt-10">
            <div className="inline-flex items-center gap-2 px-2 py-1 rounded border border-white/10 bg-white/5">
                <Terminal className="w-3 h-3 text-white/70" />
                <span className="text-[10px] font-mono font-medium text-white/70 uppercase tracking-widest">Version 2.0</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.1]">
              System<br/>Documentation
            </h1>
            <p className="text-sm md:text-base text-gray-500 leading-relaxed max-w-md">
              Detailed technical specifications and operational manuals for the CodeVo ecosystem. Designed for developers and system administrators.
            </p>
          </div>

          {SECTIONS.map((section, index) => (
            <div 
              key={section.id} 
              id={section.id}
              ref={el => sectionRefs.current[section.id] = el}
              className="scroll-mt-40 space-y-8 group"
            >
              {/* Section Header */}
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs text-white/30 tracking-widest">0{index + 1}</span>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                  {section.title}
                </h2>
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-[#111] border border-white/10 text-[10px] font-mono text-gray-400">
                    <Hash className="w-2.5 h-2.5" />
                    {section.route}
                  </div>
                </div>
                <p className="text-sm md:text-base text-gray-400 leading-7 text-justify">
                  {section.description}
                </p>
              </div>

              {/* Technical Details - Minimalist List */}
              <div className="border-l-2 border-white/5 pl-6 py-2">
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-4 font-mono">Technical Specs</h4>
                 <ul className="space-y-3">
                    {section.technicalDetails.map((tech, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                        <ChevronRight className="w-3 h-3 text-white/30" />
                        {tech}
                      </li>
                    ))}
                  </ul>
              </div>

              {/* Mobile Visual - Embedded directly after the module content */}
              <div className="lg:hidden mt-8 mb-4">
                 <LaptopFrame>
                   {section.visualComponent}
                 </LaptopFrame>
              </div>

            </div>
          ))}
        </div>

        {/* RIGHT COLUMN: Sticky Visuals (Desktop Only) */}
        <div className="hidden lg:flex w-[55%] sticky top-16 h-[calc(100vh-4rem)] items-center justify-center bg-[#050505] overflow-hidden border-l border-white/5">
          
          <div className="w-full px-16 relative z-10 flex flex-col items-center gap-10">
            <LaptopFrame>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full"
                >
                  {activeSection.visualComponent}
                </motion.div>
              </AnimatePresence>
            </LaptopFrame>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.02]">
               <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
               <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                 Live Preview: {activeSection.title}
               </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Documentation;
