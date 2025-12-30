import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, Search, Code2, Clock, Play, 
  Infinity as InfinityIcon, Layers, Lock 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { checkUserProfile, ProfileSheet } from '@/components/ProfileCompletion';

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

  // --- DATA FETCHING ---
  const { data: fetchedData = [], isLoading } = useQuery({
    queryKey: ['selection_data', subjectId, examType, mode],
    queryFn: async () => {
      const currentExamType = decodeURIComponent(examType || '');

      if (isProctored) {
        // PROCTORED MODE: Fetch sets from iitm_exam_question_bank
        const { data, error } = await supabase
          .from('iitm_exam_question_bank')
          .select('set_name, expected_time, title, sequence_number, description')
          .eq('subject_id', subjectId) 
          .ilike('exam_type', currentExamType); 
        
        if (error) throw error;
        
        const setMap: Record<string, { totalTime: number; title: string; sequence_number: number; description: string }> = {};
        data?.forEach(item => {
           if (item.set_name) {
             if (!setMap[item.set_name]) {
               setMap[item.set_name] = { 
                 totalTime: 0, 
                 title: item.title || item.set_name,
                 description: item.description || '',
                 sequence_number: item.sequence_number ?? 9999 
               };
             }
             setMap[item.set_name].totalTime += (item.expected_time || 0);
           }
        });

        return Object.entries(setMap).map(([name, val]) => ({ 
          name, 
          ...val
        })).sort((a, b) => a.sequence_number - b.sequence_number);
      } else {
        // PRACTICE MODE: Fetch assignments from iitm_assignments
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

  // --- FILTERING LOGIC ---
  const topics = useMemo(() => {
    if (isProctored) return [];
    const uniqueTopics = new Set(fetchedData.map((a: any) => a.category || 'General'));
    return Array.from(uniqueTopics).sort();
  }, [fetchedData, isProctored]);

  const filteredData = useMemo(() => {
    return (fetchedData as any[]).filter(item => {
      const title = item.title || item.name || '';
      const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTopic = isProctored ? true : (selectedTopic ? (item.category || 'General') === selectedTopic : true);
      return matchesSearch && matchesTopic;
    });
  }, [fetchedData, searchTerm, selectedTopic, isProctored]);

  // --- HANDLERS ---
  const handleStart = async (targetId: string, isSetSelection = false) => {
    const isProfileComplete = await checkUserProfile();
    if (!isProfileComplete) {
      setShowProfileSheet(true);
      return;
    }

    const params = new URLSearchParams({
      iitm_subject: subjectId || '',
      name: subjectName || '',
      type: examType || '',
      timer: noTimeLimit ? '0' : timeLimit[0].toString(),
      mode: mode || 'learning'
    });

    if (isSetSelection) {
      params.set('set_name', targetId);
      navigate(`/exam?${params.toString()}`);
    } else {
      params.set('q', targetId);
      navigate(`/practice?${params.toString()}`);
    }
  };

  return (
    <div className="h-screen bg-[#050505] text-white flex overflow-hidden font-sans">
      <ProfileSheet open={showProfileSheet} onOpenChange={setShowProfileSheet} />

      {/* --- SIDEBAR --- */}
      <aside className="w-[260px] border-r border-[#1f1f23] bg-[#080808] p-10 flex flex-col shrink-0">
        <span className="font-extrabold text-[22px] tracking-tight mb-[50px] block cursor-pointer" onClick={() => navigate('/')}>
          CODÉVO
        </span>
        <nav className="flex flex-col gap-1 overflow-y-auto pr-2">
          <button 
            onClick={() => setSelectedTopic(null)}
            className={cn(
              "flex items-center gap-3 py-3 text-[13px] font-medium transition-colors text-left",
              selectedTopic === null ? "text-white" : "text-[#666666] hover:text-white"
            )}
          >
            All Problems
          </button>
          {!isProctored && topics.map((topic: string) => (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              className={cn(
                "flex items-center gap-3 py-3 text-[13px] font-medium transition-colors text-left truncate",
                selectedTopic === topic ? "text-white" : "text-[#666666] hover:text-white"
              )}
            >
              {topic}
            </button>
          ))}
        </nav>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        <header className="px-[60px] py-10 border-b border-[#1f1f23] flex items-center justify-between sticky top-0 bg-[#050505]/80 backdrop-blur-md z-20">
          <div>
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#666666] hover:text-white transition-all mb-2"
            >
              <ArrowLeft className="w-3 h-3" />
              Return
            </button>
            <h1 className="text-[28px] font-bold tracking-tight">{decodeURIComponent(subjectName || '')}</h1>
          </div>

          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3f3f46]" />
            <Input 
              placeholder="Query database..." 
              className="pl-9 bg-[#0d0d0d] border-[#1f1f23] text-white h-10 rounded-md text-xs placeholder:text-[#3f3f46] font-mono"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        <div className="px-[60px] py-10 max-w-[1200px] w-full mx-auto">
          {isLoading ? (
            <div className="text-center py-20 text-[#666666] font-mono text-xs uppercase tracking-widest animate-pulse">
              Initializing archive...
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-20 text-[#3f3f46] border border-dashed border-[#1f1f23] rounded-sm">
              No matching records found in the archive.
            </div>
          ) : filteredData.map((item) => {
            const isExpanded = expandedQuestion === (item.id || item.name);
            const isLocked = item.is_unlocked === false;

            return (
              <div 
                key={item.id || item.name} 
                className={cn(
                  "bg-[#0d0d0d] border border-[#1f1f23] mb-[15px] rounded-sm transition-all duration-200 overflow-hidden",
                  isExpanded && "border-[#444]"
                )}
              >
                {/* --- CARD HEADER --- */}
                <div 
                  className={cn(
                    "flex items-center px-[30px] py-6 cursor-pointer select-none",
                    isLocked && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => !isLocked && setExpandedQuestion(isExpanded ? null : (item.id || item.name))}
                >
                  <div className="w-12 h-12 bg-[#141414] border border-[#1f1f23] flex items-center justify-center mr-[25px] text-[#555] rounded-sm shrink-0">
                    {isProctored ? <Layers size={22} /> : <Code2 size={22} />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[22px] font-bold text-white mb-2.5 leading-none truncate pr-4">
                      {item.title || item.name}
                    </h3>
                    <div className="inline-flex bg-white/[0.03] border border-[#1f1f23] px-3 py-1 rounded-md text-[10px] text-[#666666] uppercase font-bold tracking-wider">
                      {isProctored ? decodeURIComponent(examType || '') : (item.category || 'General')}
                    </div>
                  </div>

                  <div className="level-badge flex items-center gap-[10px] bg-white/[0.03] border border-[#1f1f23] px-4 py-[7px] rounded-md mr-5 shrink-0">
                    <span className={cn(
                      "w-[7px] h-[7px] rounded-full",
                      item.difficulty === 'Hard' || isProctored ? "bg-[#ef4444] shadow-[0_0_10px_#ef4444]" : "bg-[#10b981] shadow-[0_0_10px_#10b981]"
                    )} />
                    <span className="text-white text-[11px] font-extrabold uppercase">
                      {isProctored ? 'Secure' : (item.difficulty || 'Easy')}
                    </span>
                  </div>

                  <div className="bg-white/[0.03] border border-[#1f1f23] rounded-md px-[15px] py-[7px] font-mono text-[17px] text-[#ccc] shrink-0">
                    {item.expected_time || item.totalTime || 10} MIN
                  </div>
                </div>

                {/* --- EXPANDED AREA --- */}
                <div className={cn(
                  "bg-[#090909] transition-all duration-300 ease-in-out px-[30px] overflow-hidden border-t border-[#1f1f23]",
                  isExpanded ? "max-h-[400px] py-10 opacity-100" : "max-h-0 py-0 opacity-0 border-none"
                )}>
                  <div className="flex flex-col md:flex-row justify-between items-end gap-[40px] md:gap-[60px]">
                    <div className="flex-1 w-full">
                      <div className="flex items-center gap-3 mb-[25px]">
                        <span className="text-[11px] text-[#666666] font-bold uppercase">Set Duration</span>
                        <div className="flex items-center gap-2.5">
                          <input 
                            type="text" 
                            className="bg-black border border-[#1f1f23] text-white w-[65px] p-2.5 text-center font-mono rounded-sm text-base focus:outline-none focus:border-[#444]"
                            value={timeLimit[0]}
                            onChange={(e) => setTimeLimit([parseInt(e.target.value) || 0])}
                            disabled={noTimeLimit}
                          />
                          <span className="text-xs text-[#444] font-semibold">min</span>
                        </div>
                      </div>
                      
                      <div className={cn("w-full mt-2.5 px-1", noTimeLimit && "opacity-30")}>
                        <Slider 
                          value={timeLimit} 
                          onValueChange={setTimeLimit} 
                          min={2} 
                          max={30} 
                          step={2} 
                          className="py-3"
                          disabled={noTimeLimit}
                        />
                        <div className="flex justify-between text-[9px] text-[#3f3f46] font-mono uppercase mt-3">
                          <span>02 MIN</span>
                          <span>15 MIN</span>
                          <span>30 MIN (MAX)</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-5 shrink-0 w-full md:w-auto">
                      <div className="flex items-center gap-3 text-[11px] text-[#666666] font-bold uppercase">
                        <span>Free Mode</span>
                        <Switch 
                          checked={noTimeLimit} 
                          onCheckedChange={setNoTimeLimit} 
                          className="data-[state=checked]:bg-white"
                        />
                      </div>
                      <button 
                        onClick={() => handleStart(item.id || item.name, isProctored)}
                        className="w-full md:w-auto bg-white text-black px-[50px] py-4 text-[11px] font-extrabold uppercase tracking-[2px] rounded-sm hover:bg-[#e0e0e0] transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.1)] active:scale-95"
                      >
                        {noTimeLimit ? <InfinityIcon size={14} /> : (isProctored ? <Lock size={14} /> : <Play size={14} fill="black" />)}
                        {isProctored ? 'Start Proctored' : 'Start Practice'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
