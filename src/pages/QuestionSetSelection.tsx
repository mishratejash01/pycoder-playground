import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ArrowLeft, Search, Layers, Filter, Clock, Play, 
  Infinity as InfinityIcon, ChevronRight, FileCode2, Lock,
  FileText, Timer
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
  
  // Timer Configuration State (Only for Practice)
  const [timeLimit, setTimeLimit] = useState([20]); // Default 20 mins
  const [noTimeLimit, setNoTimeLimit] = useState(false);
  
  const [showProfileSheet, setShowProfileSheet] = useState(false);

  // --- DATA FETCHING ---
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['iitm_assignments_list', subjectId, examType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('iitm_assignments')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('exam_type', decodeURIComponent(examType || ''))
        .order('title');
      
      if (error) throw error;
      return data || [];
    }
  });

  // --- DERIVED DATA: PROCTORED SETS ---
  const examSets = useMemo(() => {
    if (!isProctored) return [];
    const grouped: Record<string, typeof assignments> = {};
    assignments.forEach(a => {
      const sName = a.set_name || 'Standard Set';
      if (!grouped[sName]) grouped[sName] = [];
      grouped[sName].push(a);
    });
    // Sort sets alphabetically
    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  }, [assignments, isProctored]);

  // --- DERIVED DATA: PRACTICE TOPICS ---
  const topics = useMemo(() => {
    const uniqueTopics = new Set(assignments.map(a => a.category || 'General'));
    return Array.from(uniqueTopics).sort();
  }, [assignments]);

  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTopic = selectedTopic ? (a.category || 'General') === selectedTopic : true;
    return matchesSearch && matchesTopic;
  });

  // --- HANDLERS ---
  const handleStartPractice = async (assignmentId: string) => {
    const isProfileComplete = await checkUserProfile();
    if (!isProfileComplete) {
      setShowProfileSheet(true);
      return;
    }

    const params = new URLSearchParams({
      iitm_subject: subjectId || '',
      name: subjectName || '',
      type: examType || '',
      q: assignmentId, 
      timer: noTimeLimit ? '0' : timeLimit[0].toString(),
      mode: 'learning'
    });

    navigate(`/practice?${params.toString()}`);
  };

  const handleStartExamSet = async (setName: string) => {
    const isProfileComplete = await checkUserProfile();
    if (!isProfileComplete) {
      setShowProfileSheet(true);
      return;
    }

    // Proctored Exam: Pass set_name to load the entire block
    const params = new URLSearchParams({
      iitm_subject: subjectId || '',
      name: subjectName || '',
      type: examType || '',
      set_name: setName,
      mode: 'proctored'
    });

    navigate(`/exam?${params.toString()}`);
  };

  const handleManualTimeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val >= 0) {
      setTimeLimit([val]);
    }
  };

  // ------------------------------------------------
  // RENDER: PROCTORED MODE (Exam Sets Grid)
  // ------------------------------------------------
  if (isProctored) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex flex-col font-sans selection:bg-primary/20 relative">
        <ProfileSheet open={showProfileSheet} onOpenChange={setShowProfileSheet} />
        
        {/* Proctored Header */}
        <div className="h-20 border-b border-white/10 bg-[#0c0c0e] px-6 md:px-10 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
           <div className="flex items-center gap-4">
             <Button variant="ghost" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-white -ml-2">
               <ArrowLeft className="w-5 h-5 mr-2" /> Back
             </Button>
             <div className="h-6 w-px bg-white/10 mx-2 hidden md:block" />
             <div>
               <h1 className="text-lg font-bold text-white tracking-wide font-neuropol hidden md:block">{decodeURIComponent(subjectName || '')}</h1>
               <div className="flex items-center gap-2 text-xs text-muted-foreground">
                 <Badge variant="outline" className="border-red-500/30 text-red-400 bg-red-500/10 px-2 py-0 h-5 uppercase tracking-wider">Proctored Exam</Badge>
                 <span className="font-mono text-white/50">{decodeURIComponent(examType || '')}</span>
               </div>
             </div>
           </div>
        </div>

        {/* Proctored Content */}
        <div className="flex-1 p-6 md:p-12 overflow-y-auto">
           <div className="max-w-6xl mx-auto">
              <div className="mb-10 space-y-2">
                <h2 className="text-3xl md:text-4xl font-bold text-white">Select Question Set</h2>
                <p className="text-gray-400 max-w-2xl">
                  Choose a specific exam set to begin your assessment. Each set contains a mix of question categories. Ensure you are ready for a secure environment.
                </p>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1,2,3].map(i => <div key={i} className="h-64 bg-white/5 rounded-xl animate-pulse border border-white/5" />)}
                </div>
              ) : examSets.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-white/5">
                  <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No exam sets available for this subject yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {examSets.map(([setName, questions]) => {
                      const totalTime = questions.reduce((acc,q) => acc + (q.expected_time || 0), 0);
                      const categories = Array.from(new Set(questions.map(q => q.category || 'General')));
                      
                      return (
                        <Card 
                          key={setName} 
                          className="bg-[#121212] border-white/10 hover:border-red-500/50 transition-all duration-300 cursor-pointer group hover:shadow-[0_0_30px_rgba(239,68,68,0.15)] flex flex-col overflow-hidden"
                          onClick={() => handleStartExamSet(setName)}
                        >
                           <CardHeader className="pb-3 border-b border-white/5 bg-white/[0.02]">
                              <div className="flex justify-between items-start">
                                <CardTitle className="text-xl text-white group-hover:text-red-400 transition-colors tracking-tight">{setName}</CardTitle>
                                <Lock className="w-5 h-5 text-muted-foreground group-hover:text-red-500 transition-colors" />
                              </div>
                           </CardHeader>
                           <CardContent className="space-y-6 flex-1 flex flex-col p-6">
                              
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1">
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Total Questions</span>
                                    <span className="text-2xl font-bold text-white flex items-center gap-2 font-mono">
                                      <FileText className="w-4 h-4 text-gray-500" /> {questions.length}
                                    </span>
                                 </div>
                                 <div className="space-y-1">
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Est. Duration</span>
                                    <span className="text-2xl font-bold text-white flex items-center gap-2 font-mono">
                                      <Timer className="w-4 h-4 text-gray-500" /> {totalTime}<span className="text-sm font-sans font-normal text-muted-foreground">min</span>
                                    </span>
                                 </div>
                              </div>
                              
                              <div className="space-y-2 flex-1">
                                 <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Includes Categories</span>
                                 <div className="flex flex-wrap gap-2">
                                    {categories.slice(0, 3).map(cat => (
                                      <Badge key={cat} variant="secondary" className="text-[10px] bg-white/5 text-gray-400 border border-white/10 px-2">{cat}</Badge>
                                    ))}
                                    {categories.length > 3 && <Badge variant="secondary" className="text-[10px] bg-white/5 text-gray-400 border border-white/10 px-2">+{categories.length - 3} More</Badge>}
                                 </div>
                              </div>

                              <Button className="w-full bg-red-600/10 text-red-500 border border-red-500/20 hover:bg-red-600 hover:text-white mt-auto group-hover:shadow-lg transition-all h-11">
                                 Start Assessment <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                              </Button>
                           </CardContent>
                        </Card>
                      );
                   })}
                </div>
              )}
           </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------
  // RENDER: PRACTICE MODE (Topic Sidebar + List)
  // ------------------------------------------------
  return (
    <div className="h-screen bg-[#09090b] text-white flex overflow-hidden font-sans">
      <ProfileSheet open={showProfileSheet} onOpenChange={setShowProfileSheet} />

      {/* LEFT SIDEBAR (TOPICS) */}
      <div className="w-64 flex-shrink-0 border-r border-white/10 bg-[#0c0c0e] flex flex-col">
        <div className="p-6 pb-4 border-b border-white/5">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-white pl-0 mb-6 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          
          <h2 className="flex items-center gap-2 text-sm font-bold tracking-widest text-white/60 uppercase mb-4">
            <Layers className="w-4 h-4 text-primary" />
            Modules
          </h2>
          
          <Button
            variant="ghost"
            onClick={() => setSelectedTopic(null)}
            className={cn(
              "w-full justify-start text-sm h-10 rounded-lg font-medium transition-all mb-2",
              selectedTopic === null 
                ? "bg-primary/10 text-primary border border-primary/20" 
                : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Filter className="w-4 h-4 mr-3" />
            All Modules
          </Button>
        </div>

        <ScrollArea className="flex-1 px-4 py-4">
          <div className="space-y-1">
            {topics.map((topic) => (
              <Button
                key={topic}
                variant="ghost"
                onClick={() => setSelectedTopic(topic)}
                className={cn(
                  "w-full justify-start text-sm h-9 px-3 rounded-md transition-all truncate",
                  selectedTopic === topic
                    ? "text-white bg-white/10 font-medium" 
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                # {topic}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* RIGHT CONTENT (QUESTIONS) */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#09090b] relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] pointer-events-none" />

        <div className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-[#0c0c0e]/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center gap-4">
             <h1 className="text-lg font-bold font-neuropol text-white tracking-wide">
               {decodeURIComponent(subjectName || '')}
             </h1>
             <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10">
               Practice Mode
             </Badge>
          </div>

          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search problems..." 
              className="pl-9 bg-[#1a1a1c] border-white/10 text-white h-9 focus:ring-primary/50 rounded-full text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1 p-8 z-10">
          <div className="max-w-[95%] mx-auto space-y-4">
            <div className="text-xs text-muted-foreground mb-4 font-mono uppercase tracking-wider">
              Available Problems ({filteredAssignments.length})
            </div>

            {isLoading ? (
              [1,2,3].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)
            ) : filteredAssignments.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground border border-dashed border-white/10 rounded-xl">
                No problems found in this category.
              </div>
            ) : (
              filteredAssignments.map((assignment) => (
                <div key={assignment.id} className="group">
                  <Collapsible 
                    open={expandedQuestion === assignment.id} 
                    onOpenChange={(isOpen) => {
                      setExpandedQuestion(isOpen ? assignment.id : null);
                      if (isOpen) {
                         setTimeLimit([assignment.expected_time || 20]); 
                         setNoTimeLimit(false);
                      }
                    }}
                    className={cn(
                      "bg-[#121212] border border-white/10 rounded-xl transition-all duration-300 overflow-hidden",
                      expandedQuestion === assignment.id ? "border-primary/50 shadow-[0_0_30px_rgba(124,58,237,0.1)] ring-1 ring-primary/20" : "hover:border-white/20"
                    )}
                  >
                    <CollapsibleTrigger className="w-full text-left">
                      <div className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-5">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center border transition-colors",
                            expandedQuestion === assignment.id ? "bg-primary/20 border-primary/50 text-primary" : "bg-white/5 border-white/10 text-muted-foreground"
                          )}>
                            <FileCode2 className="w-5 h-5"/>
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-gray-200 group-hover:text-white transition-colors">
                              {assignment.title}
                            </h3>
                            <div className="flex items-center gap-3 mt-1.5">
                               <Badge variant="outline" className="text-[10px] py-0 h-4 border-white/10 text-muted-foreground bg-black/40">
                                 {assignment.category || 'General'}
                               </Badge>
                               <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                 <Clock className="w-3 h-3" /> ~{assignment.expected_time || 20} min
                               </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className={cn("transition-transform duration-300", expandedQuestion === assignment.id ? "rotate-90 text-primary" : "text-muted-foreground")}>
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="border-t border-white/10 bg-[#08080a] p-6 animate-in slide-in-from-top-2">
                          <div className="flex flex-col lg:flex-row gap-8 items-center justify-between">
                            <div className="flex-1 w-full space-y-6">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-primary" /> 
                                    Set Duration
                                  </label>
                                  <div className={cn("flex items-center gap-3 transition-opacity", noTimeLimit && "opacity-30 pointer-events-none")}>
                                    <Input 
                                      type="number" 
                                      value={timeLimit[0]} 
                                      onChange={handleManualTimeInput}
                                      className="w-24 h-10 bg-black/40 border-white/10 text-center font-mono font-bold text-lg text-white focus:border-primary/50 pr-2"
                                      placeholder="Min"
                                    />
                                    <span className="text-sm font-medium text-muted-foreground">min</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 hover:border-white/10 transition-colors">
                                  <span className={cn("text-xs font-medium cursor-pointer", noTimeLimit ? "text-white" : "text-muted-foreground")}>Free Mode</span>
                                  <Switch checked={noTimeLimit} onCheckedChange={setNoTimeLimit} className="data-[state=checked]:bg-primary scale-75" />
                                </div>
                              </div>

                              <div className={cn("space-y-3 transition-opacity duration-200 px-1", noTimeLimit && "opacity-30 pointer-events-none")}>
                                <Slider 
                                  value={[Math.min(timeLimit[0], 30)]} 
                                  onValueChange={(vals) => setTimeLimit(vals)} 
                                  min={2} 
                                  max={30} 
                                  step={2} 
                                  className="[&>.relative>.absolute]:bg-primary cursor-pointer py-2"
                                />
                                <div className="flex justify-between text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                                  <span>2 min</span>
                                  <span>15 min</span>
                                  <span>30 min (Max Slider)</span>
                                </div>
                              </div>
                            </div>

                            <div className="w-full lg:w-auto min-w-[200px]">
                               <Button 
                                 onClick={() => handleStartPractice(assignment.id)}
                                 className="w-full h-12 bg-white text-black hover:bg-gray-200 font-bold text-base shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all hover:scale-[1.02] rounded-xl"
                               >
                                 {noTimeLimit ? <InfinityIcon className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2 fill-current" />}
                                 Start Practice
                               </Button>
                            </div>
                          </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
