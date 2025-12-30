import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { 
  ArrowLeft, Search, Layers, Clock, Play, 
  Infinity as InfinityIcon, ChevronRight, FileCode2, Lock, Menu, Code2, X, Trophy, Target, Flame, BarChart3, Activity, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { checkUserProfile, ProfileSheet } from '@/components/ProfileCompletion';
import { PremiumLockOverlay } from '@/components/PremiumLockOverlay';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';

// --- SHARED COMPONENTS ---
const ArchiveToggle = ({ checked, onChange }: { checked: boolean, onChange: (val: boolean) => void }) => (
  <label className="relative inline-block w-[94px] h-[42px] cursor-pointer">
    <input type="checkbox" className="opacity-0 w-0 h-0" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span className={cn("absolute inset-0 border-2 rounded-[40px] transition-all duration-300", checked ? "border-[#5ec952]" : "border-[#ef4444]")}>
      <span className={cn("absolute bottom-[4px] left-[4px] h-[30px] w-[30px] rounded-full transition-all duration-300", checked ? "translate-x-[52px] bg-[#5ec952]" : "translate-x-0 bg-[#ef4444]")} />
      <span className={cn("absolute top-1/2 -translate-y-1/2 text-[12px] font-extrabold text-white uppercase transition-all duration-300", checked ? "left-[14px]" : "right-[14px]")}>{checked ? "ON" : "OFF"}</span>
    </span>
  </label>
);

const ScrollingPlaceholder = ({ statements, visible }: { statements: string[], visible: boolean }) => {
  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setIndex((prev) => (prev + 1) % statements.length), 5000);
    return () => clearInterval(timer);
  }, [statements.length]);

  useEffect(() => {
    if (textRef.current && containerRef.current) {
      setShouldScroll(textRef.current.offsetWidth > containerRef.current.offsetWidth - 20);
    }
  }, [index]);

  if (!visible) return null;

  return (
    <div ref={containerRef} className="absolute inset-y-0 left-10 right-4 pointer-events-none flex items-center overflow-hidden" style={{ clipPath: 'inset(0 0 0 0)' }}>
      <span ref={textRef} className={cn("text-[10px] uppercase font-bold tracking-widest text-[#3f3f46] font-sans whitespace-nowrap", shouldScroll ? "animate-placeholder-scroll" : "")}>
        {statements[index]}
      </span>
      <style>{`
        @keyframes placeholder-scroll { 
          0%, 25% { transform: translateX(0); } 
          75%, 100% { transform: translateX(calc(-100% + 200px)); } 
        } 
        .animate-placeholder-scroll { animation: placeholder-scroll 8s ease-in-out infinite alternate; }
      `}</style>
    </div>
  );
};

export default function QuestionSetSelection() {
  const { subjectId, subjectName, examType, mode } = useParams();
  const navigate = useNavigate();
  const isProctored = mode === 'proctored';

  // --- STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [timeLimit, setTimeLimit] = useState([20]); 
  const [noTimeLimit, setNoTimeLimit] = useState(false);
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);

  // FIX: Ensuring searchPlaceholders is defined in scope
  const searchPlaceholders = [
    'Filter results by level: "Easy", "Medium", or "Hard"...',
    'Enter a topic name to find specific modules...',
    'Search for specific question titles...',
    'Filter by category to narrow your archive search...'
  ];

  // --- DATA FETCHING ---
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });
  const userId = session?.user?.id;

  const { data: userStats } = useQuery({
    queryKey: ['proctored_user_stats', userId],
    queryFn: async () => {
      const { data: submissions } = await supabase
        .from('practice_submissions')
        .select('score, status')
        .eq('user_id', userId!)
        .eq('status', 'completed');
      
      const totalSolved = submissions?.length || 0;
      const totalPoints = submissions?.reduce((acc, curr) => acc + (curr.score || 0), 0) || 0;
      return { solved: totalSolved, points: totalPoints, percentile: '99.2th' };
    },
    enabled: !!userId,
  });

  const { data: leaderboardData = [] } = useQuery({
    queryKey: ['global_leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_practice_leaderboard', { p_timeframe: 'all_time', p_limit: 20 });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: fetchedData = [], isLoading } = useQuery({
    queryKey: ['selection_data', subjectId, examType, mode],
    queryFn: async () => {
      const currentExamType = decodeURIComponent(examType || '');
      if (isProctored) {
        const { data, error } = await supabase
          .from('iitm_exam_question_bank')
          .select('set_name, expected_time, title, sequence_number, description, exam_type')
          .eq('subject_id', subjectId)
          .ilike('exam_type', currentExamType);
        if (error) throw error;
        
        const setMap: Record<string, any> = {};
        data?.forEach(item => {
           if (item.set_name) {
             if (!setMap[item.set_name]) {
               setMap[item.set_name] = { 
                 totalTime: 0, title: item.title || item.set_name, name: item.set_name,
                 description: item.description || '', sequence_number: item.sequence_number ?? 9999 
               };
             }
             setMap[item.set_name].totalTime += (item.expected_time || 0);
           }
        });
        return Object.values(setMap).sort((a: any, b: any) => a.sequence_number - b.sequence_number);
      } else {
        const { data, error } = await supabase
          .from('iitm_assignments')
          .select('*')
          .eq('subject_id', subjectId)
          .ilike('exam_type', currentExamType)
          .order('title');
        if (error) throw error;
        return data || [];
      }
    }
  });

  const topics = useMemo(() => {
    if (isProctored) return [];
    const uniqueTopics = new Set(fetchedData.map((a: any) => a.category || 'General'));
    return Array.from(uniqueTopics).sort();
  }, [fetchedData, isProctored]);

  // FIX: Accurate Filter Logic for Practice Mode
  const filteredData = useMemo(() => {
    return (fetchedData as any[]).filter(item => {
      const title = (item.title || item.name || '').toLowerCase();
      const matchesSearch = title.includes(searchTerm.toLowerCase());
      const matchesTopic = isProctored ? true : (selectedTopic ? (item.category || 'General') === selectedTopic : true);
      return matchesSearch && matchesTopic;
    });
  }, [fetchedData, searchTerm, selectedTopic, isProctored]);

  const handleStart = async (targetId: string, isSetSelection = false) => {
    const isProfileComplete = await checkUserProfile();
    if (!isProfileComplete) return setShowProfileSheet(true);
    const params = new URLSearchParams({ iitm_subject: subjectId || '', name: subjectName || '', type: examType || '', timer: noTimeLimit ? '0' : timeLimit[0].toString(), mode: mode || 'learning' });
    if (isSetSelection) params.set('set_name', targetId);
    else params.set('q', targetId);
    navigate(`/${isProctored ? 'exam' : 'practice'}?${params.toString()}`);
  };

  const ProctoredSidebar = () => (
    <div className="flex flex-col h-full p-10">
      <div className="flex items-baseline gap-4 mb-10 border-b border-[#1a1a1c] pb-10">
        <span className="text-[72px] font-light leading-none tracking-[-4px] text-white">{userStats?.solved || 0}</span>
        <span className="font-['Playfair_Display'] italic text-2xl text-[#52525b]">Solved</span>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-10">
        <div className="bg-[#0c0c0e] border border-[#1a1a1c] p-5 rounded-sm">
          <span className="text-[20px] font-bold block mb-1 text-white">{userStats?.points.toLocaleString() || 0}</span>
          <span className="text-[9px] text-[#444] uppercase font-extrabold tracking-widest">Total XP</span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#1a1a1c]">
        <h3 className="text-[11px] uppercase tracking-[2px] text-[#666] font-bold italic">Top Rankings</h3>
        <button onClick={() => setIsLeaderboardModalOpen(true)} className="bg-transparent border border-[#333] text-[#888] text-[8px] px-2.5 py-1 rounded-sm uppercase font-extrabold hover:bg-white transition-all">Detail View</button>
      </div>

      <div className="divide-y divide-white/[0.02] flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {leaderboardData.slice(0, 10).map((entry: any, i: number) => (
          <div key={entry.user_id} className="flex justify-between py-3.5 items-center">
            <div className="flex items-center gap-4">
              <span className="font-mono text-[9px] text-[#333]">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-[13px] font-medium text-zinc-300 truncate w-36">{entry.full_name}</span>
            </div>
            <span className="font-mono text-[11px] text-zinc-500">{entry.total_score.toLocaleString()} PTS</span>
          </div>
        ))}
      </div>
    </div>
  );

  // --- PROCTORED VIEW ---
  if (isProctored) {
    return (
      <div className="h-screen bg-[#050505] text-white flex flex-col overflow-hidden font-sans">
        <ProfileSheet open={showProfileSheet} onOpenChange={setShowProfileSheet} />
        
        {/* --- HEADER --- */}
        <header className="px-6 py-4 md:px-12 md:py-5 border-b border-[#1a1a1c] bg-[#050505] z-30 shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 max-w-[1600px] mx-auto">
            <div className="flex items-center gap-6">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <ArrowLeft size={20} className="text-[#666] hover:text-white" />
              </button>
              <h1 className="font-['Playfair_Display'] text-2xl md:text-3xl italic font-bold tracking-tight uppercase">
                {decodeURIComponent(subjectName || '')} - {decodeURIComponent(examType || '')}
              </h1>
            </div>
            <div className="relative w-full md:w-[400px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3f3f46] z-30" />
              <Input 
                className="bg-[#0c0c0d] border-[#1a1a1c] pl-10 pr-4 rounded-sm text-white text-[13px] h-10 focus:border-[#444] transition-all"
                placeholder="Search set name or number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden max-w-[1600px] mx-auto w-full relative">
          <main className="flex-1 flex flex-col overflow-y-auto scrollbar-hide border-r border-[#1a1a1c] pt-8">
            <div className="px-6 md:px-12 space-y-3 pb-12">
              {isLoading ? (
                 <div className="flex flex-col items-center justify-center py-20 gap-4"><div className="font-extrabold text-2xl tracking-[10px] animate-pulse">CODÉVO</div></div>
              ) : filteredData.length === 0 ? (
                <div className="text-center py-20 text-[#3f3f46] border border-dashed border-[#1a1a1c] rounded-sm font-mono text-xs uppercase tracking-widest">Zero matches found</div>
              ) : filteredData.map((set) => (
                <div key={set.name} className="bg-[#0a0a0b] border border-[#1a1a1c] p-5 md:p-[20px_25px] flex flex-col md:flex-row items-center rounded-sm transition-all border-white/5 hover:border-[#333]">
                  <div className="w-10 h-10 bg-black border border-[#1a1a1c] flex items-center justify-center mr-0 md:mr-6 text-[#333] rounded-sm shrink-0 mb-4 md:mb-0">
                    <Lock width={18} height={18} strokeWidth={2.5}/>
                  </div>
                  <div className="flex-1 text-center md:text-left min-w-0">
                    <h3 className="text-[18px] font-bold tracking-tight text-zinc-100 truncate pr-4">{set.title}</h3>
                    {/* REDESIGNED BADGE: Transparent with glowing top border only */}
                    <div className="inline-flex items-center gap-2 bg-transparent border-t border-red-500 px-2 py-0.5 rounded-[2px] text-[8px] uppercase font-extrabold text-white mt-2 tracking-widest">
                      <span className="w-1 h-1 bg-white rounded-full" /> Secure Test
                    </div>
                  </div>
                  <div className="bg-white/[0.02] border border-[#1a1a1c] rounded-sm px-3 py-1.5 font-mono text-[12px] text-[#888] mx-0 md:mx-4 mb-4 md:mb-0 uppercase">Set {String(set.sequence_number || 1).padStart(2, '0')}</div>
                  <div className="bg-white/[0.02] border border-[#1a1a1c] rounded-sm px-3 py-1.5 font-mono text-[12px] text-[#888] mx-0 md:mx-4 mb-6 md:mb-0 uppercase shrink-0">{set.totalTime} MIN</div>
                  <button onClick={() => handleStart(set.name, true)} className="bg-white text-black px-8 py-3 text-[10px] font-extrabold uppercase tracking-[2px] transition-all hover:bg-[#e4e4e7]">Start Test</button>
                </div>
              ))}
            </div>
          </main>
          <aside className="hidden lg:flex w-[400px] bg-[#070708] border-l border-[#1a1a1c] flex-col overflow-y-auto scrollbar-hide">
            <ProctoredSidebar />
          </aside>
        </div>
      </div>
    );
  }

  // --- PRACTICE VIEW ---
  return (
    <div className="h-screen bg-[#050505] text-white flex flex-col overflow-hidden font-sans">
      <ProfileSheet open={showProfileSheet} onOpenChange={setShowProfileSheet} />
      
      {/* --- HEADER (Same as Proctored) --- */}
      <header className="px-6 py-4 md:px-12 md:py-5 border-b border-[#1a1a1c] bg-[#050505] z-30 shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <ArrowLeft size={20} className="text-[#666] hover:text-white" />
            </button>
            <h1 className="font-['Playfair_Display'] text-2xl md:text-3xl italic font-bold tracking-tight uppercase">
              {decodeURIComponent(subjectName || '')} - {decodeURIComponent(examType || '')}
            </h1>
          </div>
          <div className="relative w-full md:w-[400px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3f3f46] z-30" />
            <div className="relative flex items-center h-10 bg-[#0d0d0d] border border-[#1f1f23] rounded-sm overflow-hidden">
              <ScrollingPlaceholder statements={searchPlaceholders} visible={searchTerm === ''} />
              <Input 
                className="bg-transparent border-none text-white h-full w-full pl-10 pr-4 text-xs font-mono focus-visible:ring-0 z-20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden max-w-[1600px] mx-auto w-full relative">
        <aside className="hidden lg:flex w-[260px] border-r border-[#1f1f23] bg-[#080808] p-10 flex-col shrink-0">
          <nav className="flex flex-col gap-1 pr-2 overflow-y-auto custom-scrollbar">
            <button onClick={() => setSelectedTopic(null)} className={cn("flex items-center gap-3 py-3 text-[13px] font-medium transition-colors text-left", !selectedTopic ? "text-white" : "text-[#666] hover:text-white")}>All Problems</button>
            {topics.map((t: string) => <button key={t} onClick={() => setSelectedTopic(t)} className={cn("text-[13px] py-3 text-left transition-colors truncate", selectedTopic === t ? "text-white" : "text-[#666] hover:text-white")}># {t}</button>)}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto flex flex-col scrollbar-hide pt-8">
          <div className="px-6 md:px-12 space-y-3 pb-12">
            {isLoading ? (
               <div className="flex flex-col items-center justify-center py-20 gap-4"><div className="font-extrabold text-2xl tracking-[10px] animate-pulse">CODÉVO</div></div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-20 text-[#3f3f46] border border-dashed border-[#1a1a1c] rounded-sm font-mono text-xs uppercase tracking-widest">No problems in directory</div>
            ) : filteredData.map((assignment: any) => {
              const isLocked = assignment.is_unlocked === false;
              const isExpanded = expandedQuestion === assignment.id;
              return (
                <div key={assignment.id} className="relative mb-[15px]">
                  {isLocked && <PremiumLockOverlay />}
                  <div className={cn("bg-[#0d0d0d] border border-[#1f1f23] rounded-sm transition-all duration-300", isExpanded && "border-[#444]")}>
                    <div className={cn("flex flex-wrap md:flex-nowrap items-center p-5 md:p-[20px_25px] cursor-pointer gap-6", isLocked && "opacity-50 cursor-not-allowed")} onClick={() => !isLocked && setExpandedQuestion(isExpanded ? null : assignment.id)}>
                      <div className="w-10 h-10 bg-[#141414] border border-[#1f1f23] flex items-center justify-center text-[#555] rounded-sm shrink-0"><Code2 size={20} /></div>
                      <div className="flex-1 min-w-0"><h3 className="text-lg font-bold text-white mb-[8px] tracking-tight">{assignment.title}</h3><Badge variant="outline" className="text-[8px] uppercase tracking-widest text-[#666] border-white/5 bg-white/5">{assignment.category || 'General'}</Badge></div>
                      <div className="flex items-center gap-2.5 bg-white/[0.03] border border-[#1f1f23] px-3 py-1.5 rounded-sm shrink-0"><span className={cn("w-1.5 h-1.5 rounded-full", assignment.difficulty === 'Hard' ? "bg-[#ef4444] shadow-[0_0_8px_#ef4444]" : "bg-[#10b981] shadow-[0_0_8px_#10b981]")} /><span className="text-white text-[10px] font-extrabold uppercase tracking-widest">{assignment.difficulty || 'Easy'}</span></div>
                      <div className="bg-white/[0.03] border border-[#1f1f23] rounded-sm px-4 py-1.5 font-mono text-[14px] text-[#888] shrink-0 uppercase">{String(assignment.expected_time || 20).padStart(2, '0')} MIN</div>
                    </div>
                    <div className={cn("bg-[#090909] transition-all duration-400 ease-in-out px-5 md:px-[25px] overflow-hidden", isExpanded ? "max-h-[600px] border-t border-[#1f1f23] p-[30px_25px] opacity-100" : "max-h-0 py-0 opacity-0")}>
                      <div className="flex flex-col lg:flex-row justify-between items-end gap-10">
                        <div className="flex-1 w-full space-y-6">
                          <div className="flex items-center gap-[12px]"><span className="text-[11px] text-[#666] font-bold uppercase tracking-widest italic">Set Duration</span><div className={cn("flex items-center gap-[10px]", noTimeLimit && "opacity-30 pointer-events-none")}><input type="text" className="bg-black border border-[#1f1f23] text-white w-[60px] p-1.5 text-center font-mono rounded-sm text-[14px]" value={timeLimit[0]} readOnly /><span className="text-[11px] text-[#444] font-semibold uppercase tracking-widest">min</span></div></div>
                          <div className={cn("w-full transition-opacity duration-300", noTimeLimit && "opacity-30 pointer-events-none")}><Slider value={timeLimit} onValueChange={setTimeLimit} min={2} max={30} step={2} className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-white [&_[role=slider]]:shadow-none [&>.relative>.absolute]:bg-white py-4" /><div className="flex justify-between text-[8px] text-[#3f3f46] font-mono uppercase tracking-[1.5px] mt-4"><span>02 MIN</span><span>15 MIN</span><span>30 MIN (OVERRIDE)</span></div></div>
                        </div>
                        <div className="flex flex-col items-end gap-[15px] shrink-0 w-full md:w-auto">
                          <div className="flex flex-col gap-2 items-center"><span className="text-[#666] text-[9px] uppercase tracking-[2px] font-bold">Free Mode</span><ArchiveToggle checked={noTimeLimit} onChange={setNoTimeLimit} /></div>
                          <button onClick={() => handleStart(assignment.id, false)} className="w-full md:w-auto bg-white text-black px-10 py-3 text-[10px] font-extrabold uppercase tracking-[2px] rounded-[2px] hover:bg-[#e4e4e7] transition-all flex items-center justify-center gap-3">{noTimeLimit ? <InfinityIcon size={14} strokeWidth={3} /> : <Play size={14} fill="black" />}Start Practice</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* --- LEADERBOARD MODAL (In case accessible from practice) --- */}
      {isLeaderboardModalOpen && (
        <div className="fixed inset-0 bg-black z-[1000] flex flex-col p-12 md:p-[80px_100px] overflow-y-auto animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row justify-between items-end mb-[60px] pb-[30px] border-b border-[#111] gap-6">
            <div>
              <p className="uppercase tracking-[5px] text-[#444] text-[10px] mb-2.5 font-bold">Official Ranking Archive</p>
              <h2 className="font-['Playfair_Display'] text-[48px] italic font-bold text-white">Ranking Archive</h2>
            </div>
            <button onClick={() => setIsLeaderboardModalOpen(false)} className="bg-white text-black px-10 py-4 text-[11px] font-extrabold uppercase transition-all active:scale-95">Back to Tests</button>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#222]">
                <th className="p-5 text-[10px] uppercase tracking-[2px] text-[#444] font-bold">Rank</th>
                <th className="p-5 text-[10px] uppercase tracking-[2px] text-[#444] font-bold">Candidate</th>
                <th className="p-5 text-[10px] uppercase tracking-[2px] text-[#444] font-bold">Solved</th>
                <th className="p-5 text-[10px] uppercase tracking-[2px] text-[#444] font-bold">Streak</th>
                <th className="p-5 text-[10px] uppercase tracking-[2px] text-[#444] font-bold">Score</th>
                <th className="p-5 text-[10px] uppercase tracking-[2px] text-[#444] font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="font-mono text-sm divide-y divide-[#111]">
              {leaderboardData.map((row: any, i: number) => (
                <tr key={row.user_id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-5 text-[#333] group-hover:text-[#666]">{String(i + 1).padStart(2, '0')}</td>
                  <td className="p-5 text-zinc-100 font-sans font-medium">{row.full_name}</td>
                  <td className="p-5 text-zinc-400">{row.problems_solved} Problems</td>
                  <td className="p-5 text-zinc-400">{row.current_streak}D Streak</td>
                  <td className="p-5 text-zinc-400 font-bold">{row.total_score.toLocaleString()}</td>
                  <td className="p-5">
                    <span className={cn("px-2 py-1 rounded-sm text-[9px] font-extrabold uppercase", i < 3 ? "bg-[#10b9811a] text-[#10b981]" : "bg-[#222] text-[#888]")}>{i < 3 ? 'Elite' : 'Candidate'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
