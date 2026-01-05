import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ChevronUp, MessageSquare, Send, CornerDownRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DiscussionTabProps {
  problemId: string;
  userId: string | undefined;
}

/**
 * INDIVIDUAL CARD COMPONENT
 * Handles Upvoting, Expanding Thread, and Posting Replies
 */
function DiscussionCard({ disc, userId }: { disc: any, userId?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 1. Check if User Upvoted (Data Fetch)
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

  // 2. Fetch Replies (Only if expanded)
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

  // 3. Upvote Action
  const upvoteMutation = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      // Using the RPC function we assumed exists from previous steps, 
      // or fallback to manual toggle if RPC is missing in your specific migration
      const { error } = await supabase.rpc('toggle_discussion_upvote', {
        target_discussion_id: disc.id,
        target_user_id: userId
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problem_discussions'] });
      queryClient.invalidateQueries({ queryKey: ['has_upvoted', disc.id] });
    }
  });

  // 4. Reply Action
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
      // Update parent comment count implicitly by refreshing main list if needed, 
      // though typically UI updates immediately. 
      toast({ title: 'Sent', description: 'Correspondence added to the thread.' });
    }
  });

  return (
    <div className="bg-[#141414] border border-white/[0.08] rounded-[4px] p-8 flex gap-7 transition-all duration-300 hover:border-white/[0.15] group">
      
      {/* LEFT COLUMN: Endorsement/Upvote */}
      <div className="flex flex-col items-center gap-1 text-[#475569]">
        <button 
          onClick={(e) => { e.stopPropagation(); upvoteMutation.mutate(); }}
          className={cn(
            "bg-transparent border border-white/[0.08] p-1.5 rounded-[2px] cursor-pointer transition-colors hover:text-[#f8fafc] hover:border-[#94a3b8]",
            hasUpvoted ? "text-[#f8fafc] border-[#94a3b8]" : "text-[#475569]"
          )}
        >
          <ChevronUp className="w-3 h-3 stroke-[3px]" />
        </button>
        <span className="text-xs font-semibold font-sans mt-1">{disc.upvotes || 0}</span>
      </div>

      {/* RIGHT COLUMN: Content */}
      <div className="flex-1 min-w-0">
        
        {/* Meta Header */}
        <div className="flex justify-between text-[10px] uppercase tracking-[0.1em] text-[#475569] mb-3">
          <span>Category: <span className="text-[#94a3b8]">General</span></span>
          <span>{formatDistanceToNow(new Date(disc.created_at), { addSuffix: true })}</span>
        </div>

        {/* Title & Text */}
        <h3 className="font-serif text-xl italic text-[#f8fafc] mb-3 leading-[1.3]">
          {disc.title}
        </h3>
        <p className="text-[15px] leading-[1.7] text-[#94a3b8] mb-6 whitespace-pre-wrap">
          {disc.content}
        </p>

        {/* Footer */}
        <div className="flex justify-between items-center border-t border-white/[0.08] pt-4">
          <div className="flex items-center gap-2.5 text-[11px] font-semibold text-[#94a3b8]">
            <div className="w-5 h-5 border border-white/[0.08] flex items-center justify-center text-[9px] text-[#475569] bg-[#0c0c0c]">
              {disc.profiles?.full_name?.[0] || 'U'}
            </div>
            {disc.profiles?.full_name || 'Executive Member'}
          </div>
          
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[10px] uppercase tracking-[1px] text-[#475569] hover:text-[#f8fafc] transition-colors flex items-center gap-2"
          >
            {isExpanded ? 'Collapse' : `View Replies`}
          </button>
        </div>

        {/* THREADED REPLIES SECTION */}
        {isExpanded && (
          <div className="mt-6 pl-6 border-l border-white/[0.08] flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
            
            {/* List Replies */}
            {replies.map((reply: any) => (
              <div key={reply.id} className="bg-[#0a0a0a] p-4 border border-white/[0.08] rounded-[2px]">
                <div className="text-[9px] text-[#475569] uppercase mb-2 flex justify-between">
                  <span>{reply.profiles?.full_name || 'Unknown'}</span>
                  <span>{formatDistanceToNow(new Date(reply.created_at))} ago</span>
                </div>
                <p className="text-[13px] leading-[1.5] text-[#94a3b8]">
                  {reply.content}
                </p>
              </div>
            ))}

            {/* Reply Composer */}
            <div className="mt-2 flex gap-3">
              <input 
                type="text" 
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Draft a response..."
                className="flex-1 bg-[#0c0c0c] border border-white/[0.08] rounded-[2px] px-3 py-2 text-[13px] text-[#f8fafc] focus:outline-none focus:border-white/[0.2] placeholder:text-[#475569]"
                onKeyDown={(e) => e.key === 'Enter' && replyMutation.mutate()}
              />
              <button 
                onClick={() => replyMutation.mutate()}
                disabled={!replyContent.trim() || replyMutation.isPending}
                className="bg-[#f8fafc] text-[#080808] px-3 py-2 rounded-[2px] hover:bg-[#94a3b8] transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/**
 * MAIN TAB COMPONENT
 */
export function DiscussionTab({ problemId, userId }: DiscussionTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false); // Controls if the composer is in "write mode"
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Fetch Root Discussions
  const { data: discussions = [], isLoading } = useQuery({
    queryKey: ['problem_discussions', problemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('practice_discussions')
        .select(`*, profiles:user_id (full_name, avatar_url)`)
        .eq('problem_id', problemId)
        .is('parent_id', null)
        .order('created_at', { ascending: false }) // NEWEST FIRST
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!problemId
  });

  // Create Thread
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
      toast({ title: 'Published', description: 'Your correspondence has been broadcasted.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to transmit message.', variant: 'destructive' });
    }
  });

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#475569] py-12 bg-[#080808]">
        <MessageSquare className="w-8 h-8 mb-3 opacity-20" />
        <p className="font-serif italic text-sm">Authentication required for channel access.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#080808]">
        <Loader2 className="w-6 h-6 text-[#475569] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#080808] text-[#f8fafc] font-sans">
      <ScrollArea className="flex-1">
        <div className="p-8 max-w-[650px] mx-auto w-full flex flex-col gap-6">
          
          {/* NAVIGATION */}
          <div className="flex gap-8 border-b border-white/[0.08] pb-3 mb-2">
            <span className="text-[11px] uppercase tracking-[2px] text-[#475569] cursor-pointer hover:text-[#94a3b8] transition-colors">Briefing</span>
            <span className="text-[11px] uppercase tracking-[2px] text-[#475569] cursor-pointer hover:text-[#94a3b8] transition-colors">Information</span>
            <span className="text-[11px] uppercase tracking-[2px] text-[#f8fafc] font-semibold relative after:content-[''] after:absolute after:-bottom-[13px] after:left-0 after:w-full after:h-[1px] after:bg-[#f8fafc]">Conversations</span>
          </div>

          {/* COMPOSER BOX */}
          <div className="bg-[#0c0c0c] border border-white/[0.08] rounded-[4px] p-8 transition-colors hover:border-white/[0.15] group/composer">
            <div className="border-b border-white/[0.08] pb-3 mb-4">
              <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full bg-transparent border-none text-xl font-serif italic text-[#f8fafc] placeholder:text-[#475569] focus:outline-none"
              />
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your suggestions or questions here for the group."
              className="w-full bg-transparent border-none text-[14px] text-[#94a3b8] placeholder:text-[#475569] focus:outline-none resize-none min-h-[60px] leading-[1.6]"
            />
            {/* Show Post button only when user starts typing */}
            {(title || content) && (
              <div className="flex justify-end mt-4 pt-4 border-t border-white/[0.05] animate-in fade-in">
                <button 
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending}
                  className="text-[10px] uppercase tracking-[1px] bg-[#f8fafc] text-[#080808] px-5 py-2 rounded-[2px] hover:bg-[#94a3b8] transition-colors font-semibold"
                >
                  {createMutation.isPending ? 'Broadcasting...' : 'Publish'}
                </button>
              </div>
            )}
          </div>

          <h2 className="text-[10px] uppercase tracking-[3px] text-[#475569] mt-2 pl-1">Latest Topics</h2>

          {/* DISCUSSION LIST */}
          <div className="flex flex-col gap-4 pb-12">
            {discussions.length === 0 ? (
              <div className="text-center py-12 text-[#475569] font-serif italic border border-white/[0.05] rounded-[4px]">
                The channel is silent. Initiate a topic.
              </div>
            ) : (
              discussions.map((disc: any) => (
                <DiscussionCard key={disc.id} disc={disc} userId={userId} />
              ))
            )}
          </div>

        </div>
      </ScrollArea>
    </div>
  );
}
