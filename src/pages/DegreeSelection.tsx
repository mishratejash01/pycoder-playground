import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Share2, Search, BookOpen, Code2, Database, Terminal, Globe, Cpu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Icon mapping based on subject name keywords
const getSubjectIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('python')) return <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" className="w-10 h-10" alt="Python" />;
  if (n.includes('java')) return <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg" className="w-10 h-10" alt="Java" />;
  if (n.includes('database') || n.includes('sql')) return <Database className="w-10 h-10 text-blue-400" />;
  if (n.includes('web') || n.includes('dev')) return <Globe className="w-10 h-10 text-cyan-400" />;
  if (n.includes('system') || n.includes('linux')) return <Terminal className="w-10 h-10 text-gray-400" />;
  if (n.includes('compute') || n.includes('machine')) return <Cpu className="w-10 h-10 text-purple-400" />;
  return <Code2 className="w-10 h-10 text-primary" />;
};

const DegreeSelection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Filters
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch Levels
  const { data: levels = [] } = useQuery({
    queryKey: ['iitm_levels'],
    queryFn: async () => {
      const { data, error } = await supabase.from('iitm_levels').select('*').order('sequence');
      if (error) throw error;
      return data;
    }
  });

  // 2. Fetch Subjects with their Level ID
  const { data: subjects = [] } = useQuery({
    queryKey: ['iitm_subjects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('iitm_subjects').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  // 3. Fetch Available Exam Types (Assignments) per Subject
  const { data: subjectExamMap = {} } = useQuery({
    queryKey: ['iitm_assignment_types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('iitm_assignments')
        .select('subject_id, exam_type');
      
      if (error) throw error;

      // Group distinct exam types by subject_id
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

  // Derived State: Filtered Subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter(subject => {
      const matchesLevel = selectedLevel === 'all' || subject.level_id === selectedLevel;
      const matchesSearch = subject.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesLevel && matchesSearch;
    });
  }, [subjects, selectedLevel, searchQuery]);

  const handleShare = (subjectName: string) => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied",
      description: `Share link for ${subjectName} copied to clipboard.`
    });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white pt-24 pb-12 px-4 md:px-8">
      
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto mb-12 text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold font-neuropol tracking-wide text-white">
          Explore Your Curriculum
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          Select your level and subject to access practice environments and proctored exams.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="max-w-7xl mx-auto mb-10 sticky top-24 z-30">
        <div className="bg-[#0c0c0e]/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Level Filter */}
          <div className="w-full md:w-1/3">
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="bg-black/40 border-white/10 text-white h-11">
                <SelectValue placeholder="Filter by Level" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1c] border-white/10 text-white">
                <SelectItem value="all">All Levels</SelectItem>
                {levels.map(level => (
                  <SelectItem key={level.id} value={level.id}>{level.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Input */}
          <div className="w-full md:w-1/3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search subjects (e.g. Python, Stats)..." 
              className="pl-10 bg-black/40 border-white/10 text-white h-11 focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Results Count */}
          <div className="w-full md:w-auto text-sm text-muted-foreground whitespace-nowrap px-2">
            Showing <span className="text-primary font-bold">{filteredSubjects.length}</span> subjects
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubjects.map((subject) => {
          const availableExams = Array.from(subjectExamMap[subject.id] || []).sort();
          const levelName = levels.find(l => l.id === subject.level_id)?.name || 'Unknown Level';

          return (
            <Card key={subject.id} className="bg-[#0c0c0e] border-white/10 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 flex flex-col overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <CardHeader className="flex-row gap-4 items-start space-y-0 pb-3">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                  {getSubjectIcon(subject.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <Badge variant="outline" className="mb-2 text-xs border-white/10 text-muted-foreground bg-white/5">
                    {levelName}
                  </Badge>
                  <CardTitle className="text-xl font-bold truncate text-white" title={subject.name}>
                    {subject.name}
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                <CardDescription className="text-muted-foreground/80 line-clamp-3">
                  Master {subject.name} through hands-on coding assignments and proctored exam simulations designed for the {levelName}.
                </CardDescription>
              </CardContent>

              <CardFooter className="flex flex-col gap-3 pt-0">
                <div className="w-full h-px bg-white/5 mb-2" />
                
                <div className="w-full flex gap-2 flex-wrap">
                  {availableExams.length > 0 ? (
                    availableExams.map((examType) => (
                      <Button 
                        key={examType}
                        size="sm"
                        className="flex-1 bg-white/5 hover:bg-primary hover:text-white text-muted-foreground border border-white/10 transition-all text-xs"
                        onClick={() => navigate(`/degree/mode/${subject.id}/${encodeURIComponent(subject.name)}/${encodeURIComponent(examType)}`)}
                      >
                        {examType}
                      </Button>
                    ))
                  ) : (
                    <div className="w-full text-center py-2 text-xs text-muted-foreground/50 italic border border-dashed border-white/10 rounded">
                      No active exams
                    </div>
                  )}
                </div>

                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-xs text-muted-foreground hover:text-white h-8"
                  onClick={() => handleShare(subject.name)}
                >
                  <Share2 className="w-3 h-3 mr-2" /> Share Subject
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {filteredSubjects.length === 0 && (
        <div className="text-center py-20">
          <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-white/5 mb-4">
            <BookOpen className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-medium text-white">No subjects found</h3>
          <p className="text-muted-foreground mt-2">Try adjusting your filters or search query.</p>
          <Button 
            variant="link" 
            onClick={() => { setSelectedLevel('all'); setSearchQuery(''); }}
            className="mt-4 text-primary"
          >
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default DegreeSelection;
