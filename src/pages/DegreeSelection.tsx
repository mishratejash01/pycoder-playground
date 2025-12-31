import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Share2, Search, Code2, Database, Terminal, Globe, Cpu, ShieldCheck, Sparkles, Lock, ChevronRight, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const getSubjectIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('python')) return <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" className="w-6 h-6" alt="Python" />;
  if (n.includes('java')) return <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg" className="w-6 h-6" alt="Java" />;
  if (n.includes('database') || n.includes('sql')) return <Database className="w-6 h-6 text-blue-400" />;
  if (n.includes('web') || n.includes('dev')) return <Globe className="w-6 h-6 text-cyan-400" />;
  if (n.includes('system') || n.includes('linux')) return <Terminal className="w-6 h-6 text-gray-400" />;
  if (n.includes('compute') || n.includes('machine')) return <Cpu className="w-6 h-6 text-purple-400" />;
  return <Code2 className="w-6 h-6 text-primary" />;
};

const DegreeSelection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedDegree, setSelectedDegree] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModeOpen, setIsModeOpen] = useState(false);
  const [selectedExamData, setSelectedExamData] = useState<{id: string, name: string, type: string} | null>(null);

  const { data: degrees = [] } = useQuery({
    queryKey: ['iitm_degrees'],
    queryFn: async () => {
      const { data, error } = await supabase.from('iitm_degrees').select('*').order('name');
      if (error) return [];
      return data;
    }
  });

  useEffect(() => {
    if (degrees.length > 0 && !selectedDegree) {
      setSelectedDegree(degrees[0].id);
    }
  }, [degrees, selectedDegree]);

  const { data: levels = [] } = useQuery({
    queryKey: ['iitm_levels', selectedDegree],
    queryFn: async () => {
      if (!selectedDegree) return [];
      const { data, error } = await supabase.from('iitm_levels').select('*').eq('degree_id', selectedDegree).order('sequence');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedDegree
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['iitm_subjects', selectedDegree],
    queryFn: async () => {
      if (!selectedDegree) return [];
      const { data, error } = await supabase.from('iitm_subjects').select('*, iitm_levels!inner(degree_id)').eq('iitm_levels.degree_id', selectedDegree).order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedDegree
  });

  const { data: subjectExamMap = {} } = useQuery({
    queryKey: ['iitm_assignment_types'],
    queryFn: async () => {
      const { data } = await supabase.from('iitm_assignments').select('subject_id, exam_type');
      const mapping: Record<string, Set<string>> = {};
      data?.forEach(item => {
        if (item.subject_id && item.exam_type) {
          if (!mapping[item.subject_id]) mapping[item.subject_id] = new Set();
          mapping[item.subject_id].add(item.exam_type);
        }
      });
      return mapping;
    }
  });

  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject: any) => {
      const matchesLevel = selectedLevel === 'all' || subject.level_id === selectedLevel;
      const matchesSearch = subject.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesLevel && matchesSearch;
    });
  }, [subjects, selectedLevel, searchQuery]);

  const handleExamClick = (subjectId: string, subjectName: string, examType: string) => {
    setSelectedExamData({ id: subjectId, name: subjectName, type: examType });
    setIsModeOpen(true);
  };

  const handleModeSelect = (mode: 'learning' | 'proctored') => {
    if (!selectedExamData) return;
    if (mode === 'proctored' && window.innerWidth < 1024) {
      toast({
        title: "Access Denied 🚫",
        description: "Proctored exams require a Laptop or Desktop PC.",
        variant: "destructive",
      });
      return;
    }
    setIsModeOpen(false);
    navigate(`/degree/sets/${selectedExamData.id}/${encodeURIComponent(selectedExamData.name)}/${encodeURIComponent(selectedExamData.type)}/${mode}`);
  };

  const handleShare = (subjectName: string) => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link Copied", description: `Share link for ${subjectName} copied.` });
  };

  return (
    // Changed bg-[#09090b] to bg-black for full black background
    <div className="min-h-screen bg-black font-sans selection:bg-orange-500/30 relative overflow-x-hidden">
      
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
      />
      
      <div className="fixed right-0 top-0 h-screen w-1/3 overflow-hidden opacity-[0.02] pointer-events-none z-0">
          <span className="font-serif text-[20vw] leading-none text-white absolute -right-20 -top-20 rotate-12 select-none">IITM</span>
      </div>

      <div className="relative z-10 w-full flex flex-col min-h-screen">
        
        {/* Changed bg-[#09090b]/80 to bg-black/80 and removed max-w/mx-auto to stay full width */}
        <div className="border-b border-white/10 bg-black/80 backdrop-blur-xl w-full">
            <div className="w-full px-4 md:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-10 min-h-[200px]">
                    
                    <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-white/10 py-8 lg:pr-12 flex flex-col justify-between">
                        <button 
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-white/40 hover:text-white hover:translate-x-[-4px] transition-all w-fit"
                        >
                            <ArrowLeft className="w-3 h-3" />
                            Return
                        </button>

                        <div className="mt-6">
                            <div className="w-12 h-1 bg-orange-600 mb-6" />
                            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[0.95] text-white tracking-tight">
                                Curriculum <br />
                                <span className="text-white/40 italic">Explorer</span>
                            </h1>
                        </div>
                    </div>

                    <div className="lg:col-span-7 flex flex-col">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2">
                            {degrees.map((degree: any, index: number) => {
                                const isActive = selectedDegree === degree.id;
                                return (
                                    <button
                                        key={degree.id}
                                        onClick={() => setSelectedDegree(degree.id)}
                                        className={cn(
                                            "relative group text-left p-8 lg:p-12 border-b md:border-b-0 border-white/10 transition-all duration-300 ease-out",
                                            "md:border-r last:border-r-0 hover:bg-white/[0.02]",
                                            isActive ? "bg-white/[0.03]" : "opacity-60 hover:opacity-100"
                                        )}
                                    >
                                        {isActive && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-600" />
                                        )}
                                        <div className="flex flex-col h-full justify-between gap-6 md:gap-8">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-mono text-xs text-orange-500/80 uppercase tracking-widest border border-orange-500/20 px-1.5 py-0.5 rounded-sm">
                                                        0{index + 1}
                                                    </span>
                                                </div>
                                                <h3 className={cn(
                                                    "font-serif text-2xl md:text-3xl transition-colors",
                                                    isActive ? "text-white" : "text-white/60 group-hover:text-white"
                                                )}>
                                                    {degree.name.replace("BS in ", "")}
                                                </h3>
                                            </div>
                                            <div className="flex items-center justify-between mt-auto">
                                                <span className="text-[10px] md:text-xs font-mono text-white/40 uppercase tracking-wider group-hover:text-white/60 transition-colors">
                                                    View Modules
                                                </span>
                                                <div className={cn("w-8 h-8 rounded-full border border-white/10 flex items-center justify-center transition-all duration-300", isActive ? "bg-white text-black border-white" : "text-white/20 group-hover:border-white/40")}>
                                                     <ChevronRight className={cn("w-4 h-4 transition-transform", isActive && "translate-x-0.5")} />
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/10 flex flex-col md:flex-row">
                    <div className="w-full md:w-[30%] border-b md:border-b-0 md:border-r border-white/10 p-4 md:p-6 flex items-center gap-4 bg-white/[0.02]">
                        <Search className="w-4 h-4 text-white/40" />
                        <span className="font-mono text-xs uppercase tracking-widest text-white/40">
                            Query_Database
                        </span>
                    </div>
                    
                    <div className="flex-1 flex flex-col md:flex-row relative">
                        <input 
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for subjects, codes, or keywords..."
                            className="flex-1 bg-transparent p-4 md:px-8 text-sm md:text-base font-mono text-white placeholder:text-white/20 focus:outline-none focus:bg-white/[0.02] transition-colors h-14 md:h-auto"
                        />
                        
                        <div className="h-14 md:h-full border-t md:border-t-0 md:border-l border-white/10 flex items-center bg-white/[0.01]">
                            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                                <SelectTrigger className="h-full border-none bg-transparent rounded-none px-6 gap-3 focus:ring-0 text-xs font-mono uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/[0.02] w-full md:w-[220px] justify-between">
                                    <SelectValue placeholder="FILTER: ALL" />
                                </SelectTrigger>
                                <SelectContent className="bg-black border-white/10 text-white rounded-none min-w-[200px]">
                                    <SelectItem value="all" className="font-mono text-xs uppercase focus:bg-white/10 focus:text-white cursor-pointer">Filter: All Levels</SelectItem>
                                    {levels.map((level: any) => (
                                        <SelectItem key={level.id} value={level.id} className="font-mono text-xs uppercase focus:bg-white/10 focus:text-white cursor-pointer">
                                            {level.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Removed max-w-[1600px] and mx-auto to allow expansion on zoom out */}
        <div className="flex-1 p-4 md:p-12 pb-32 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredSubjects.length === 0 ? (
                <div className="col-span-full py-24 text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
                  <Search className="w-6 h-6 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">No matching modules found</p>
                </div>
              ) : (
                filteredSubjects.map((subject: any) => {
                  const availableExams = Array.from(subjectExamMap[subject.id] || []).sort();
                  const levelName = levels.find((l: any) => l.id === subject.level_id)?.name || 'Unknown Level';
                  const isLocked = subject.is_unlocked === false; 

                  return (
                    <div key={subject.id} className="relative group">
                      <div className={cn(
                        "absolute -inset-0.5 bg-gradient-to-r rounded-3xl blur opacity-20 group-hover:opacity-40 transition",
                        isLocked ? "from-zinc-800 to-zinc-900" : "from-zinc-700 to-zinc-800"
                      )} />
                      
                      <div className="relative w-full bg-black rounded-2xl border border-[#27272a]/60 p-7 shadow-2xl flex flex-col gap-7 transition-all hover:-translate-y-1">
                        <div className="absolute top-7 right-7">
                          <div className={cn("w-2 h-2 rounded-full shadow-[0_0_8px]", isLocked ? "bg-red-500 shadow-red-500/80" : "bg-emerald-500 shadow-emerald-500/80")} />
                        </div>

                        <div className={cn("flex flex-row items-start gap-5", isLocked && "opacity-50")}>
                          <div className="shrink-0 w-14 h-14 rounded-2xl bg-[#18181b] border border-[#27272a] flex items-center justify-center">
                             {getSubjectIcon(subject.name)}
                          </div>
                          <div className="flex flex-col gap-1 w-full pt-1">
                            <h3 className="text-lg font-bold text-[#f4f4f5] leading-tight line-clamp-1">{subject.name}</h3>
                            <p className="text-xs text-[#71717a] line-clamp-2 leading-relaxed">Resources for {subject.name}.</p>
                          </div>
                        </div>

                        <div className={cn("flex flex-wrap gap-2", isLocked && "opacity-40 grayscale")}>
                          <Badge variant="outline" className="rounded-md border-[#27272a] bg-[#18181b]/50 text-[#a1a1aa] font-normal">{levelName}</Badge>
                        </div>

                        <div className="flex flex-col gap-3 pt-1">
                          <div className="flex justify-between items-center pb-1">
                             <span className="text-[10px] font-bold uppercase tracking-wider text-[#52525b]">Modules</span>
                             <div className="h-px w-1/2 bg-[#18181b]" />
                          </div>

                          {isLocked ? (
                            <div className="w-full h-16 rounded-xl border border-dashed border-[#27272a] bg-[#18181b]/20 flex items-center justify-center gap-3">
                                 <Lock className="w-3 h-3 text-[#52525b]" />
                                 <span className="text-xs font-medium text-[#71717a]">Locked</span>
                            </div>
                          ) : availableExams.length > 0 ? (
                            <div className="flex flex-col gap-2">
                              {availableExams.map((examType: any) => (
                                <button
                                  key={examType}
                                  onClick={() => handleExamClick(subject.id, subject.name, examType)}
                                  className="w-full h-14 rounded-xl border border-[#27272a] bg-[#18181b]/40 flex items-center px-4 justify-between hover:bg-[#18181b]/60 transition-all group/btn"
                                >
                                  <span className="text-sm font-medium text-[#d4d4d8] group-hover/btn:text-white">{examType}</span>
                                  <ChevronRight className="w-4 h-4 text-[#71717a]" />
                                </button>
                              ))}
                            </div>
                          ) : (
                             <div className="w-full h-14 rounded-xl border border-dashed border-[#27272a] bg-[#18181b]/20 flex items-center justify-center text-xs text-[#52525b]">No exams</div>
                          )}
                        </div>

                        <button 
                          onClick={() => !isLocked && handleShare(subject.name)}
                          disabled={isLocked}
                          className="flex items-center gap-3 hover:opacity-80 transition-opacity w-full justify-center pt-2"
                        >
                          <Share2 className="w-4 h-4 text-[#71717a]" />
                          <span className="text-xs font-medium text-[#71717a]">Share</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
        </div>
      </div>

      <Dialog open={isModeOpen} onOpenChange={setIsModeOpen}>
        <DialogContent className="bg-[#0c0c0e] border-white/10 text-white max-w-[95vw] sm:max-w-4xl p-0 overflow-hidden rounded-2xl">
          <div className="flex flex-col md:grid md:grid-cols-2 h-[80vh] md:h-[550px]">
            <div className="relative group cursor-pointer border-b md:border-b-0 md:border-r border-white/10 flex flex-col" onClick={() => handleModeSelect('learning')}>
              <div className="flex-1 flex items-center justify-center p-8 relative">
                 <img src="https://fxwmyjvzwcimlievpvjh.supabase.co/storage/v1/object/public/Assets/image-Picsart-AiImageEnhancer%20(1).png" className="w-full h-full object-contain opacity-80 group-hover:scale-105 transition-all" />
              </div>
              <div className="p-8 bg-[#0c0c0e] border-t border-white/5">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  <h3 className="text-xl font-bold">Practice Mode</h3>
                </div>
                <p className="text-gray-400 text-sm">Experiment freely without timers.</p>
              </div>
            </div>
            <div className="relative group cursor-pointer flex flex-col" onClick={() => handleModeSelect('proctored')}>
              <div className="flex-1 flex items-center justify-center p-8 relative">
                <img src="https://fxwmyjvzwcimlievpvjh.supabase.co/storage/v1/object/public/Assets/image-Picsart-AiImageEnhancer.png" className="w-full h-full object-contain opacity-80 group-hover:scale-105 transition-all" />
              </div>
              <div className="p-8 bg-[#0c0c0e] border-t border-white/5">
                <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck className="w-5 h-5 text-red-400" />
                  <h3 className="text-xl font-bold">Proctored Mode</h3>
                </div>
                <p className="text-gray-400 text-sm">Strict monitoring and time limits.</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DegreeSelection;
