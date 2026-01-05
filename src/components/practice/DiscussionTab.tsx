import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DiscussionTabProps {
  problemId: string;
  userId: string | undefined;
}

export function DiscussionTab({ problemId, userId }: DiscussionTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const { data: discussions = [], isLoading } = useQuery({
    queryKey: ['problem_discussions', problemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('practice_discussions')
        .select(`
          *,
          profiles:user_id (full_name, avatar_url)
        `)
        .eq('problem_id', problemId)
        .is('parent_id', null)
        .order('created_at', { ascending: false }) // Ensure newest posts are shown first
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!problemId
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Not logged in');
      const { error } = await supabase.from('practice_discussions').insert({
        problem_id: problemId,
        user_id: userId,
        title,
        content
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problem_discussions', problemId] });
      setTitle('');
      setContent('');
      setShowForm(false);
      toast({ title: 'Posted!', description: 'Your discussion has been created.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to post discussion', variant: 'destructive' });
    }
  });

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#808080] py-12 bg-[#0a0a0a]">
        <MessageSquare className="w-8 h-8 mb-3 opacity-20" />
        <p className="font-serif italic text-sm">Login to participate in the hub.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0a0a0a]">
        <Loader2 className="w-6 h-6 text-[#808080] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-[#f2f2f2] font-sans">
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-[580px] mx-auto w-full flex flex-col gap-6">
          
          {/* Post Creator (Composer) */}
          <div className="bg-[#141414] border border-white/[0.08] rounded-[4px] p-6 transition-colors hover:border-white/[0.1]">
            {showForm ? (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <input 
                  type="text" 
                  placeholder="Give your post a title..." 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-transparent border-none border-b border-white/[0.08] text-xl font-serif text-[#f2f2f2] placeholder:text-[#808080] pb-3 mb-4 focus:outline-none focus:border-white/[0.2] transition-colors"
                />
                <textarea 
                  placeholder="Share your thoughts with the community..." 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-transparent border-none resize-none min-h-[80px] text-[15px] text-[#f2f2f2] placeholder:text-[#808080] focus:outline-none p-0 leading-relaxed custom-scrollbar"
                />
                <div className="flex justify-end gap-4 mt-4 pt-2">
                  <button 
                    onClick={() => setShowForm(false)}
                    className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[#808080] hover:text-[#f2f2f2] transition-colors bg-transparent border-none cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => createMutation.mutate()}
                    disabled={!title.trim() || !content.trim() || createMutation.isPending}
                    className="px-6 py-2.5 bg-white text-black border border-white rounded-[2px] text-[11px] font-semibold uppercase tracking-[0.5px] hover:bg-transparent hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-black cursor-pointer"
                  >
                    {createMutation.isPending ? 'Posting...' : 'Post Discussion'}
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => setShowForm(true)}
                className="cursor-pointer"
              >
                <div className="border-b border-white/[0.08] pb-3 mb-4">
                  <span className="text-xl font-serif text-[#808080]">Start a new discussion...</span>
                </div>
                <div className="text-[15px] text-[#808080]/50">
                  Share your insights regarding this problem.
                </div>
              </div>
            )}
          </div>

          <h2 className="text-[11px] text-[#808080] uppercase tracking-[2px] mt-4 ml-1">Latest Conversations</h2>

          {/* Discussion List */}
          <div className="flex flex-col gap-3 pb-8">
            {discussions.length === 0 ? (
              <div className="text-center py-12 text-[#808080] font-serif italic">
                No conversations yet. Be the first to start one.
              </div>
            ) : (
              discussions.map((disc: any) => (
                <div
                  key={disc.id}
                  className="group bg-[#1c1c1c] border border-white/[0.08] p-6 rounded-[4px] cursor-pointer transition-all duration-200 hover:-translate-y-[2px] hover:border-white/[0.2]"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-[#808080]">
                      <div className="w-[5px] h-[5px] bg-[#444] rounded-full" />
                      <span className="text-[#808080] group-hover:text-[#f2f2f2] transition-colors">
                        {disc.profiles?.full_name || 'Anonymous'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#f2f2f2] font-semibold text-[11px]">
                      <span>▲</span> {disc.upvotes || 0}
                    </div>
                  </div>

                  <h3 className="font-serif text-[19px] text-[#f2f2f2] mb-2 leading-tight">
                    {disc.title}
                  </h3>
                  
                  <p className="text-[14px] text-[#808080] leading-[1.6] line-clamp-2">
                    {disc.content}
                  </p>

                  <div className="mt-4 flex gap-5 text-[11px] text-[#808080]">
                    <span>View Thread</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(disc.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </ScrollArea>
    </div>
  );
}
