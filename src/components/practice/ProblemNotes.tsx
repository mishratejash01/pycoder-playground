import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SquarePen, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ProblemNotesProps {
  problemId: string;
  userId: string | undefined;
}

export function ProblemNotes({ problemId, userId }: ProblemNotesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Fetch existing note
  const { data: note } = useQuery({
    queryKey: ['problem_note', problemId, userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('practice_notes')
        .select('*')
        .eq('problem_id', problemId)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId && !!problemId
  });

  // Initialize content once when data is loaded
  useEffect(() => {
    if (note?.content && !isInitialized) {
      setContent(note.content);
      setIsInitialized(true);
    }
  }, [note, isInitialized]);

  const saveMutation = useMutation({
    mutationFn: async (newContent: string) => {
      if (!userId) throw new Error('Not logged in');
      
      const { error } = await supabase
        .from('practice_notes')
        .upsert({
          user_id: userId,
          problem_id: problemId,
          content: newContent,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,problem_id'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      setSaveStatus('saved');
      // Quietly invalidate to keep data fresh without overwriting local state
      queryClient.invalidateQueries({ queryKey: ['problem_note', problemId, userId] });
      
      setTimeout(() => {
        setSaveStatus((prev) => prev === 'saved' ? 'idle' : prev);
      }, 2000);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to save note', variant: 'destructive' });
      setSaveStatus('idle');
    }
  });

  // Debounced auto-save
  useEffect(() => {
    // Skip if not logged in or content hasn't changed from server version (and we are initialized)
    if (!userId || (isInitialized && content === note?.content)) return;
    
    // Don't trigger save for empty content if it was already empty
    if (!content && !note?.content) return;

    setSaveStatus('saving');
    
    const timeout = setTimeout(() => {
      saveMutation.mutate(content);
    }, 1000);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, userId]); // Removed 'saveMutation' and 'note' to prevent infinite loops

  if (!userId) {
    return (
      <div className="w-full bg-[#141414] border border-white/[0.08] rounded-[4px] p-8 text-center">
        <p className="font-serif italic text-[#94a3b8] text-sm">Please identify yourself to access private observations.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#141414] border border-white/[0.08] rounded-[4px] p-6 shadow-2xl font-sans">
      
      {/* Header */}
      <header className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2.5 text-[#94a3b8]">
          <SquarePen className="w-3.5 h-3.5 opacity-80" />
          <span className="font-serif italic text-sm tracking-wide text-[#94a3b8]">Private Observations</span>
        </div>

        {/* Status Indicator */}
        <div className={cn(
          "flex items-center gap-2 text-[10px] uppercase tracking-widest transition-opacity duration-500",
          saveStatus === 'idle' ? "opacity-0" : "opacity-100"
        )}>
          {saveStatus === 'saving' && (
            <>
              <div className="flex gap-[3px]">
                <div className="w-[2px] h-[2px] bg-current rounded-full animate-pulse text-[#475569]" />
                <div className="w-[2px] h-[2px] bg-current rounded-full animate-pulse delay-75 text-[#475569]" />
                <div className="w-[2px] h-[2px] bg-current rounded-full animate-pulse delay-150 text-[#475569]" />
              </div>
              <span className="text-[#475569] font-medium">Syncing</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <Check className="w-2.5 h-2.5 text-emerald-500" />
              <span className="text-emerald-500 font-medium">Archived</span>
            </>
          )}
        </div>
      </header>

      {/* Note Input Wrapper */}
      <div className="relative bg-[#0e0e0e] border border-white/[0.08] rounded-[2px] transition-all duration-300 focus-within:border-white/20 focus-within:shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        
        {/* Lined Paper Effect Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-10 mt-[1.5em]" 
          style={{
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
            backgroundSize: '100% 1.7em'
          }} 
        />
        
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Transcribe your approach, insights, or structural logic here..."
          className="w-full min-h-[180px] bg-transparent border-none p-5 text-[#94a3b8] font-sans text-sm leading-[1.7] resize-none outline-none placeholder:text-[#475569] placeholder:italic placeholder:font-serif scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
          spellCheck={false}
        />
      </div>

    </div>
  );
}
