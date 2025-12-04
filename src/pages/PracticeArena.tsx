import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, ChevronRight, Zap, Filter, ArrowLeft, Layers, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PracticeArena() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);

  // 1. Fetch Topics
  const { data: topics = [] } = useQuery({
    queryKey: ['practice_topics'],
    queryFn: async () => {
      const { data, error } = await supabase.from('practice_topics').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  // 2. Fetch Problems
  const { data: problems = [], isLoading } = useQuery({
    queryKey: ['practice_problems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('practice_problems')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Filter Logic
  const filteredProblems = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = !filterDifficulty || p.difficulty === filterDifficulty;
    // Smart Topic Matching: Check if the problem's tags array includes the selected topic Name
    const matchesTopic = !selectedTopic || (p.tags && p.tags.includes(selectedTopic));
    
    return matchesSearch && matchesDifficulty && matchesTopic;
  });

  const getDifficultyColor = (diff: string) => {
    switch(diff) {
      case 'Easy': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'Medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'Hard': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-primary/20 flex flex-col">
      
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0c0c0e] sticky top-0 z-50 backdrop-blur-md bg-[#0c0c0e]/80 shrink-0">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-muted-foreground hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold font-neuropol tracking-wide">
              Practice<span className="text-primary">Arena</span>
            </h1>
          </div>
          
          {/* Top Filters (Search & Difficulty) */}
          <div className="flex items-center gap-4">
             <div className="relative group hidden md:block w-64">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-500" />
                <div className="relative flex items-center bg-[#0c0c0e] rounded-lg border border-white/10 px-2 h-9">
                  <Search className="w-4 h-4 text-muted-foreground ml-1" />
                  <Input 
                    placeholder="Search problems..." 
                    className="border-none bg-transparent focus-visible:ring-0 h-full text-sm text-white placeholder:text-muted-foreground/50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
             </div>
             
             <div className="flex gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
                {['Easy', 'Medium', 'Hard'].map(diff => (
                  <Button 
                    key={diff}
                    variant="ghost" 
                    size="sm"
                    onClick={() => setFilterDifficulty(filterDifficulty === diff ? null : diff)}
                    className={cn(
                      "h-7 text-xs px-2 hover:bg-white/10 transition-all", 
                      filterDifficulty === diff && "bg-white/10 text-primary font-bold shadow-sm"
                    )}
                  >
                    {diff}
                  </Button>
                ))}
             </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left Sidebar: Topics */}
        <div className="hidden md:block col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4" /> Topics
            </h3>
            {selectedTopic && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedTopic(null)} className="h-6 text-[10px] text-red-400 hover:text-red-300 px-2">
                Clear
              </Button>
            )}
          </div>
          
          <ScrollArea className="h-[calc(100vh-10rem)] pr-3">
            <div className="space-y-1">
              <Button
                variant="ghost"
                onClick={() => setSelectedTopic(null)}
                className={cn(
                  "w-full justify-start text-sm h-9",
                  selectedTopic === null ? "bg-primary/20 text-primary font-medium" : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Filter className="w-4 h-4 mr-2" /> All Topics
              </Button>
              
              {topics.map((topic: any) => (
                <Button
                  key={topic.id}
                  variant="ghost"
                  onClick={() => setSelectedTopic(topic.name)}
                  className={cn(
                    "w-full justify-start text-sm h-9",
                    selectedTopic === topic.name ? "bg-primary/20 text-primary font-medium" : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Hash className="w-3 h-3 mr-2 opacity-50" />
                  {topic.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right Content: Problem List */}
        <div className="col-span-1 md:col-span-3 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1,2,3,4].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse border border-white/5" />)}
            </div>
          ) : filteredProblems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-xl bg-white/5 mt-10">
              <Filter className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">No problems found matching filters.</p>
              <Button variant="link" onClick={() => {setSearchTerm(''); setFilterDifficulty(null); setSelectedTopic(null);}} className="text-primary mt-2">Reset All Filters</Button>
            </div>
          ) : (
            <>
              <div className="text-xs text-muted-foreground font-mono mb-2">Showing {filteredProblems.length} problems</div>
              {filteredProblems.map((problem) => (
                <Card 
                  key={problem.id} 
                  className="bg-[#0c0c0e] border-white/10 hover:border-primary/40 transition-all cursor-pointer group relative overflow-hidden"
                  onClick={() => navigate(`/practice-arena/${problem.slug}`)}
                >
                  <CardContent className="p-5 flex items-center justify-between relative z-10">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors">{problem.title}</h3>
                        <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider font-bold h-5 px-1.5", getDifficultyColor(problem.difficulty))}>
                          {problem.difficulty}
                        </Badge>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {problem.tags && problem.tags.map((tag: string) => (
                          <span key={tag} className="text-[10px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded border border-white/5 transition-colors">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-primary group-hover:text-black group-hover:border-primary transition-all duration-300">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
