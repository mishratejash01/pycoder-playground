import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'; 
import { Share2, Search, Code2, Database, Terminal, Globe, Cpu, ShieldCheck, Sparkles, GraduationCap, CornerDownRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const getSubjectIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('python')) return <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" className="w-8 h-8 opacity-80 group-hover:opacity-100 transition-opacity" alt="Python" />;
  if (n.includes('java')) return <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg" className="w-8 h-8 opacity-80 group-hover:opacity-100 transition-opacity" alt="Java" />;
  if (n.includes('database') || n.includes('sql')) return <Database className="w-8 h-8 text-blue-400 opacity-80 group-hover:opacity-100" />;
  if (n.includes('web') || n.includes('dev')) return <Globe className="w-8 h-8 text-cyan-400 opacity-80 group-hover:opacity-100" />;
  if (n.includes('system') || n.includes('linux')) return <Terminal className="w-8 h-8 text-gray-400 opacity-80 group-hover:opacity-100" />;
  if (n.includes('compute') || n.includes('machine')) return <Cpu className="w-8 h-8 text-purple-400 opacity-80 group-hover:opacity-100" />;
  return <Code2 className="w-8 h-8 text-primary opacity-80 group-hover:opacity-100" />;
};

const DegreeSelection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedDegree, setSelectedDegree] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModeOpen, setIsModeOpen] = useState(false);
  const [selectedExamData, setSelectedExamData] = useState<{id: string, name: string, type: string} | null>(null);

  // 1. Fetch Degrees
  const { data: degrees = [] } = useQuery({
    queryKey: ['iitm_degrees'],
    queryFn: async () => {
      // @ts-ignore
      const { data, error } = await supabase.from('iitm_degrees').select('*').order('name');
      if (error) {
        console.error('Error fetching degrees:', error);
        return [];
      }
      return data;
    }
  });

  useEffect(() => {
    if (degrees.length > 0 && !selectedDegree) {
      setSelectedDegree(degrees[0].id);
    }
  }, [degrees, selectedDegree]);

  // 2. Fetch Levels
  const { data: levels = [] } = useQuery({
    queryKey: ['iitm_levels', selectedDegree],
    queryFn: async () => {
      if (!selectedDegree) return [];
      
      const { data, error } = await supabase
        .from('iitm_levels')
        .select('*')
        .eq('degree_id', selectedDegree)
        .order('sequence');
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedDegree
  });

  // 3. Fetch Subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ['iitm_subjects', selectedDegree],
    queryFn: async () => {
      if (!selectedDegree) return [];

      const { data, error } = await supabase
        .from('iitm_subjects')
        .select('*, iitm_levels!inner(degree_id)')
        // @ts-ignore
        .eq('iitm_levels.degree_id', selectedDegree)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!selectedDegree
  });

  // Fetch Assignment Types Map
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

    if (mode === 'proctored') {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (window.innerWidth < 1024 || isMobileDevice) {
        toast({
          title: "Access Denied 🚫",
          description: "Proctored exams require a Laptop or Desktop PC. Please switch devices.",
          variant: "destructive",
          duration: 5000,
        });
        return;
      }
    }

    setIsModeOpen(false);
    navigate(`/degree/sets/${selectedExamData.id}/${encodeURIComponent(selectedExamData.name)}/${encodeURIComponent(selectedExamData.type)}/${mode}`);
  };

  const handleShare = (subjectName: string) => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link Copied", description: `Share link for ${subjectName} copied.` });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-primary/30">
      
      {/* Scrollable Header Section */}
      <div className="relative border-b border-white/5 bg-[#050505] pt-12 pb-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold font-neuropol tracking-wide text-white">
              ACADEMIC <span className="text-primary">INDEX</span>
            </h1>
            <p className="text-muted-foreground font-mono text-xs md:text-sm max-w-2xl mx-auto tracking-wider uppercase opacity-70">
              // Select curriculum stream to initialize environment
            </p>
          </div>

          {/* Degree Selector (Tabs) */}
          <div className="flex justify-center">
            {degrees.length > 0 && (
              <Tabs value={selectedDegree} onValueChange={setSelectedDegree} className="w-full max-w-md">
                <TabsList className="grid w-full grid-cols-2 bg-[#0c0c0e] border border-white/10 h-12 p-1 rounded-lg">
                  {degrees.map((degree: any) => (
                    <TabsTrigger 
                      key={degree.id} 
                      value={degree.id}
                      className="data-[state=active]:bg-white/10 data-[state=active]:text-white h-full text-xs font-mono uppercase tracking-wider transition-all"
                    >
                      <GraduationCap className="w-3 h-3 mr-2 opacity-70" />
                      {degree.name.replace('BS in ', '')}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
          </div>

          {/* Filters Bar - Technical Style */}
          <div className="bg-[#0a0a0a] border border-white/10 p-2 rounded-lg flex flex-col md:flex-row gap-2 items-center justify-between shadow-2xl">
            <div className="w-full md:w-1/3">
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="bg-transparent border-transparent text-gray-300 h-10 text-xs font-mono hover:bg-white/5 focus:ring-0">
                  <SelectValue placeholder="FILTER::LEVEL" />
                </SelectTrigger>
                <SelectContent className="bg-[#151515] border-white/10 text-white">
                  <SelectItem value="all" className="font-mono text-xs">ALL_LEVELS</SelectItem>
                  {levels.map((level: any) => (
                    <SelectItem key={level.id} value={level.id} className="font-mono text-xs">{level.name.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="h-4 w-px bg-white/10 hidden md:block" />

            <div className="w-full md:w-1/3 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input 
                placeholder="SEARCH_MODULES..." 
                className="pl-9 bg-transparent border-transparent text-white h-10 text-xs font-mono placeholder:text-muted-foreground/50 focus-visible:ring-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="h-4 w-px bg-white/10 hidden md:block" />

            <div className="w-full md:w-auto text-[10px] font-mono text-muted-foreground whitespace-nowrap px-4 py-2 md:py-0 text-center md:text-right">
              <span className="text-primary">{filteredSubjects.length}</span> MODULES FOUND
            </div>
          </div>
        </div>
      </div>

      {/* Subjects Grid - Wireframe Style */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.length === 0 ? (
            <div className="col-span-full text-center py-20 text-muted-foreground font-mono text-sm border border-dashed border-white/10 rounded-xl bg-white/5">
              // NO_DATA_FOUND
            </div>
          ) : (
            filteredSubjects.map((subject: any) => {
              const availableExams = Array.from(subjectExamMap[subject.id] || []).sort();
              const levelName = levels.find((l: any) => l.id === subject.level_id)?.name || 'Unknown';

              return (
                <div 
                  key={subject.id} 
                  className="group relative bg-[#080808] border border-white/5 p-6 transition-all duration-300 hover:border-primary/30 hover:bg-[#0a0a0a] hover:shadow-[0_0_40px_rgba(124,58,237,0.05)] flex flex-col min-h-[280px]"
                >
                  {/* Corner Markers */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 group-hover:border-primary transition-colors duration-500" />
                  <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/20 group-hover:border-primary transition-colors duration-500" />
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/20 group-hover:border-primary transition-colors duration-500" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 group-hover:border-primary transition-colors duration-500" />

                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="p-2.5 bg-white/5 border border-white/10 group-hover:border-primary/20 transition-colors">
                      {getSubjectIcon(subject.name)}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                       <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">ID: {subject.id.slice(0,4)}</span>
                       <Badge variant="outline" className="border-white/10 bg-transparent text-white/60 font-mono text-[10px] uppercase tracking-widest rounded-none">
                         {levelName}
                       </Badge>
                    </div>
                  </div>

                  {/* Title & Desc */}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2 font-neuropol tracking-wide group-hover:text-primary transition-colors line-clamp-1" title={subject.name}>
                      {subject.name}
                    </h3>
                    <p className="text-xs text-gray-500 font-mono leading-relaxed line-clamp-2">
                      Initialize workspace for {subject.name}. Access learning modules and proctored environments.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {availableExams.length > 0 ? (
                        availableExams.map((examType: any) => (
                          <button 
                            key={examType}
                            onClick={() => handleExamClick(subject.id, subject.name, examType)}
                            className="flex-1 bg-white/5 hover:bg-primary hover:text-white text-gray-400 border border-white/10 hover:border-primary/50 transition-all text-[10px] font-mono uppercase tracking-wider py-2 px-3 flex items-center justify-center gap-2 group/btn"
                          >
                            {examType} <CornerDownRight className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                          </button>
                        ))
                      ) : (
                        <div className="w-full text-center py-2 text-[10px] text-muted-foreground/40 font-mono border border-dashed border-white/5">
                          // NO_ACTIVE_EXAMS
                        </div>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => handleShare(subject.name)}
                      className="w-full flex items-center justify-center gap-2 text-[10px] text-muted-foreground hover:text-white transition-colors py-1"
                    >
                      <Share2 className="w-3 h-3" /> SHARE_MODULE_REF
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* --- MODE SELECTION DIALOG (Keeping existing logic, updating style slightly) --- */}
      <Dialog open={isModeOpen} onOpenChange={setIsModeOpen}>
        <DialogContent className="bg-[#050505] border-white/10 text-white max-w-[95vw] sm:max-w-4xl p-0 overflow-hidden gap-0 shadow-2xl">
          <div className="flex flex-col md:grid md:grid-cols-2 md:h-[500px]">
            {/* PRACTICE */}
            <div 
              className="relative group cursor-pointer border-b md:border-b-0 md:border-r border-white/10 bg-[#080808] hover:bg-[#0a0a0a] transition-colors flex flex-col"
              onClick={() => handleModeSelect('learning')}
            >
              <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/10 rounded-full blur-[50px] group-hover:bg-blue-500/20 transition-all duration-500" />
                 <img src="https://fxwmyjvzwcimlievpvjh.supabase.co/storage/v1/object/public/Assets/image-Picsart-AiImageEnhancer%20(1).png" alt="Practice" className="w-3/4 object-contain relative z-10 opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105 grayscale group-hover:grayscale-0" />
              </div>
              <div className="p-6 border-t border-white/5 relative z-20">
                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors font-neuropol">Practice Mode</h3>
                <p className="text-xs text-gray-500 font-mono">Sandbox environment. No restrictions.</p>
              </div>
            </div>

            {/* PROCTORED */}
            <div 
              className="relative group cursor-pointer bg-[#080808] hover:bg-[#0a0a0a] transition-colors flex flex-col"
              onClick={() => handleModeSelect('proctored')}
            >
              <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-red-500/10 rounded-full blur-[50px] group-hover:bg-red-500/20 transition-all duration-500" />
                 <img src="https://fxwmyjvzwcimlievpvjh.supabase.co/storage/v1/object/public/Assets/image-Picsart-AiImageEnhancer.png" alt="Exam" className="w-3/4 object-contain relative z-10 opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105 grayscale group-hover:grayscale-0" />
              </div>
              <div className="p-6 border-t border-white/5 relative z-20">
                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-red-400 transition-colors font-neuropol">Proctored Mode</h3>
                <p className="text-xs text-gray-500 font-mono">Strict environment. Monitored session.</p>
              </div>
            </div>
          </div>
          <div className="bg-[#050505] p-2 text-center text-[10px] font-mono text-muted-foreground border-t border-white/5 uppercase tracking-widest">
            Target: <span className="text-white">{selectedExamData?.name}</span> // Type: {selectedExamData?.type}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DegreeSelection;
