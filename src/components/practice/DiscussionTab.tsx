import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, MessageSquare, Send, ChevronUp, CornerDownRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DiscussionTabProps {
  problemId: string;
  userId: string | undefined;
}

// Sub-component for individual discussion cards to handle state independently
function DiscussionCard({ disc, userId, onReplySuccess }: { disc: any, userId?: string, onReplySuccess: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if current user has upvoted
  const { data: hasUpvoted } = useQuery({
    queryKey: ['has_upvoted', disc.id, userId],
    queryFn: async () => {
      if (!userId) return false;
      const { data } = await supabase
        .from('practice_discussion_upvotes')
        .select('id')
        .eq('discussion_id', disc.id)
        .eq('user_id', userId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!userId
  });

  // Fetch replies when expanded
  const { data: replies = [] } = useQuery({
    queryKey: ['discussion_replies', disc.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('practice_discussions')
        .select('*, profiles:user_id(full_name)')
        .eq('parent_id', disc.id)
        .order('created_at', { ascending: true });
      return data || [];
    },
    enabled: isExpanded
  });

  const upvoteMutation = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const { error } = await supabase.rpc('toggle_discussion_upvote', {
        target_discussion_id: disc.id,
        target_user_id: userId
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problem_discussions'] }); // Refresh counts
      queryClient.invalidateQueries({ queryKey: ['has_upvoted', disc.id] }); // Refresh status
    }
  });

  const replyMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Login required');
      const { error } = await supabase.from('practice_discussions').insert({
        problem_id: disc.problem_id,
        user_id: userId,
        parent_id: disc.id,
        content: replyContent,
        title: `Re: ${disc.title}`
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setReplyContent('');
      queryClient.invalidateQueries({ queryKey: ['discussion_replies', disc.id] });
      toast({ title: 'Reply Sent', description: 'Your response has been added to the thread.' });
    }
  });

  return (
    <div className="group bg-[#1c1c1c] border border-white/[0.08] p-6 rounded-[4px] transition-all duration-200 hover:border-white/[0.2]">
      <div className="flex gap-4">
        {/* Upvote Column */}
        <div className="flex flex-col items-center gap-1 text-[#475569]">
          <button 
            onClick={(e) => { e.stopPropagation(); upvoteMutation.mutate(); }}
            className={cn(
              "transition-colors p-1 rounded hover:bg-white/5",
              hasUpvoted ? "text-[#f2f2f2]" : "hover:text-[#f2f2f2]"
            )}
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <span className="text-[11px] font-mono font-medium">{disc.upvotes || 0}</span>
        </div>

        {/* Content Column */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-serif text-[18px] text-[#f2f2f2] leading-tight group-hover:text-white transition-colors">
              {disc.title}
            </h3>
            <span className="text-[10px] text-[#475569] whitespace-nowrap ml-4">
              {formatDistanceToNow(new Date(disc.created_at), { addSuffix: true })}
            </span>
          </div>

          <p className="text-[14px] text-[#808080] leading-[1.6] mb-4 whitespace-pre-wrap">
            {disc.content}
          </p>

          <div className="flex items-center justify-between border-t border-white/[0.05] pt-4 mt-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#808080]">
              <div className="w-[18px] h-[18px] bg-[#333] rounded-full flex items-center justify-center text-[8px] text-white">
                {disc.profiles?.full_name?.[0] || 'U'}
              </div>
              <span className="tracking-wide">
                {disc.profiles?.full_name || 'Anonymous'}
              </span>
            </div>

            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#475569] hover:text-[#94a3b8] transition-colors"
            >
              <MessageSquare className="w-3 h-3" />
              {isExpanded ? 'Hide Thread' : `${replies.length > 0 ? replies.length : ''} View Thread`}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Thread Section */}
      {isExpanded && (
        <div className="mt-6 pl-4 border-l border-white/[0.08] space-y-4 animate-in fade-in slide-in-from-top-2">
          
          {/* Existing Replies */}
          {replies.map((reply: any) => (
            <div key={reply.id} className="bg-[#141414] p-4 rounded-[2px] border border-white/[0.05]">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-bold text-[#808080] flex items-center gap-2">
                  <CornerDownRight className="w-3 h-3" />
                  {reply.profiles?.full_name}
                </span>
                <span className="text-[9px] text-[#444]">
                  {formatDistanceToNow(new Date(reply.created_at))} ago
                </span>
              </div>
              <p className="text-[13px] text-[#d1d1d1] leading-relaxed">
                {reply.content}
              </p>
            </div>
          ))}

          {/* Reply Input */}
          <div className="flex gap-3 pt-2">
            <div className="flex-1">
              <input 
                type="text" 
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..." 
                className="w-full bg-[#0c0c0c] border border-white/[0.1] rounded-[2px] px-3 py-2 text-sm text-[#f2f2f2] focus:outline-none focus:border-white/[0.3] placeholder:text-[#444]"
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && replyMutation.mutate()}
              />
            </div>
            <button 
              onClick={() => replyMutation.mutate()}
              disabled={!replyContent.trim() || replyMutation.isPending}
              className="bg-[#f2f2f2] text-black px-3 py-2 rounded-[2px] hover:bg-white transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function DiscussionTab({ problemId, userId }: DiscussionTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Main list query
  const { data: discussions = [], isLoading } = useQuery({
    queryKey: ['problem_discussions', problemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('practice_discussions')
        .select(`*, profiles:user_id (full_name, avatar_url)`)
        .eq('problem_id', problemId)
        .is('parent_id', null) // Only fetch root threads
        .order('created_at', { ascending: false }) // Newest first
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
      toast({ title: 'Posted!', description: 'Your discussion is live.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to post discussion', variant: 'destructive' });
    }
  });

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#808080] py-12 bg-[#0a0a0a]">
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
          
          {/* Main Composer */}
          <div className="bg-[#141414] border border-white/[0.08] rounded-[4px] p-6 transition-colors hover:border-white/[0.1]">
            {showForm ? (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <input 
                  type="text" 
                  placeholder="Topic Title..." 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-transparent border-none border-b border-white/[0.08] text-xl font-serif text-[#f2f2f2] placeholder:text-[#444] pb-3 mb-4 focus:outline-none focus:border-white/[0.2] transition-colors"
                />
                <textarea 
                  placeholder="Share your insights..." 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-transparent border-none resize-none min-h-[80px] text-[15px] text-[#f2f2f2] placeholder:text-[#444] focus:outline-none p-0 leading-relaxed custom-scrollbar"
                />
                <div className="flex justify-end gap-4 mt-4 pt-2">
                  <button 
                    onClick={() => setShowForm(false)}
                    className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[#666] hover:text-[#f2f2f2] transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => createMutation.mutate()}
                    disabled={!title.trim() || !content.trim() || createMutation.isPending}
                    className="px-6 py-2.5 bg-white text-black border border-white rounded-[2px] text-[11px] font-semibold uppercase tracking-[0.5px] hover:bg-transparent hover:text-white transition-all disabled:opacity-50"
                  >
                    {createMutation.isPending ? 'Posting...' : 'Post Discussion'}
                  </button>
                </div>
              </div>
            ) : (
              <div onClick={() => setShowForm(true)} className="cursor-pointer">
                <div className="border-b border-white/[0.08] pb-3 mb-4">
                  <span className="text-xl font-serif text-[#666]">Start a new discussion...</span>
                </div>
                <div className="text-[15px] text-[#444]">
                  Share your insights regarding this problem.
                </div>
              </div>
            )}
          </div>

          <h2 className="text-[11px] text-[#666] uppercase tracking-[2px] mt-4 ml-1">Latest Conversations</h2>

          {/* Thread List */}
          <div className="flex flex-col gap-3 pb-8">
            {discussions.length === 0 ? (
              <div className="text-center py-12 text-[#444] font-serif italic">
                No conversations yet. Be the first.
              </div>
            ) : (
              discussions.map((disc: any) => (
                <DiscussionCard 
                  key={disc.id} 
                  disc={disc} 
                  userId={userId} 
                  onReplySuccess={() => queryClient.invalidateQueries({ queryKey: ['problem_discussions'] })}
                />
              ))
            )}
          </div>

        </div>
      </ScrollArea>
    </div>
  );
}
