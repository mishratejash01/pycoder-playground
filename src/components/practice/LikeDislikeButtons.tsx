import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LikeDislikeButtonsProps {
  problemId: string;
  userId: string | undefined;
  likes: number;     // Keeping these for initial fallback
  dislikes: number;  // Keeping these for initial fallback
}

export function LikeDislikeButtons({ problemId, userId, likes: initialLikes, dislikes: initialDislikes }: LikeDislikeButtonsProps) {
  const queryClient = useQueryClient();

  // 1. Fetch User's Current Reaction
  const { data: userReaction } = useQuery({
    queryKey: ['reaction', problemId, userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('practice_reactions')
        .select('reaction_type')
        .eq('problem_id', problemId)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data?.reaction_type || null;
    },
    enabled: !!userId && !!problemId
  });

  // 2. Fetch Live Counts Directly from the Reactions Table
  // This bypasses the potentially stale 'practice_problems' columns
  const { data: reactionCounts } = useQuery({
    queryKey: ['reaction_counts', problemId],
    queryFn: async () => {
      const [likesResponse, dislikesResponse] = await Promise.all([
        supabase
          .from('practice_reactions')
          .select('*', { count: 'exact', head: true })
          .eq('problem_id', problemId)
          .eq('reaction_type', 'like'),
        supabase
          .from('practice_reactions')
          .select('*', { count: 'exact', head: true })
          .eq('problem_id', problemId)
          .eq('reaction_type', 'dislike')
      ]);
      
      return {
        likes: likesResponse.count || 0,
        dislikes: dislikesResponse.count || 0
      };
    },
    // Use the props as initial data while loading to prevent layout shift
    initialData: { likes: initialLikes, dislikes: initialDislikes },
    enabled: !!problemId
  });

  const reactMutation = useMutation({
    mutationFn: async (reactionType: 'like' | 'dislike') => {
      if (!userId) throw new Error('Not logged in');
      
      // If clicking the same reaction again, remove it (toggle off)
      if (userReaction === reactionType) {
        const { error } = await supabase
          .from('practice_reactions')
          .delete()
          .eq('problem_id', problemId)
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        // Otherwise insert/update the reaction
        const { error } = await supabase
          .from('practice_reactions')
          .upsert({
            problem_id: problemId,
            user_id: userId,
            reaction_type: reactionType
          }, {
            onConflict: 'user_id,problem_id'
          });
        if (error) throw error;
      }
    },
    onMutate: async (reactionType) => {
      // Optimistic Update for instant UI feedback
      await queryClient.cancelQueries({ queryKey: ['reaction', problemId, userId] });
      await queryClient.cancelQueries({ queryKey: ['reaction_counts', problemId] });

      const previousReaction = userReaction;
      
      // Update User Reaction State
      queryClient.setQueryData(['reaction', problemId, userId], (old: any) => 
        old === reactionType ? null : reactionType
      );

      // Update Counts State
      queryClient.setQueryData(['reaction_counts', problemId], (old: any) => {
        let newLikes = old?.likes || 0;
        let newDislikes = old?.dislikes || 0;

        // Remove old reaction from count
        if (previousReaction === 'like') newLikes--;
        if (previousReaction === 'dislike') newDislikes--;

        // Add new reaction to count (if not toggling off)
        if (previousReaction !== reactionType) {
          if (reactionType === 'like') newLikes++;
          if (reactionType === 'dislike') newDislikes++;
        }

        return { likes: newLikes, dislikes: newDislikes };
      });

      return { previousReaction };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reaction', problemId, userId] });
      queryClient.invalidateQueries({ queryKey: ['reaction_counts', problemId] });
      // Also refresh the parent problem query to keep everything in sync
      queryClient.invalidateQueries({ queryKey: ['practice_problem'] });
    },
    onError: (err, newTodo, context) => {
      // Rollback on error
      queryClient.setQueryData(['reaction', problemId, userId], context?.previousReaction);
      queryClient.invalidateQueries({ queryKey: ['reaction_counts', problemId] });
    }
  });

  return (
    <div className="flex items-center bg-[#1a1a1a] border border-white/[0.08] rounded-[2px] overflow-hidden h-[30px]">
      
      {/* Like Button */}
      <button
        onClick={() => userId && reactMutation.mutate('like')}
        disabled={!userId || reactMutation.isPending}
        className={cn(
          "flex items-center gap-2 px-3 h-full bg-transparent border-none text-[10px] font-semibold tracking-[0.02em] font-sans transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer outline-none",
          userReaction === 'like' 
            ? "text-[#f8fafc] bg-white/[0.06]" 
            : "text-[#94a3b8] hover:text-[#f8fafc] hover:bg-white/[0.03]"
        )}
      >
        <ThumbsUp 
          className={cn(
            "w-3 h-3 stroke-[2.2px]",
            userReaction === 'like' && "fill-white/10"
          )} 
        />
        <span className="tabular-nums">{reactionCounts?.likes || 0}</span>
      </button>

      {/* Divider */}
      <div className="w-[1px] h-[12px] bg-white/[0.08]" />

      {/* Dislike Button */}
      <button
        onClick={() => userId && reactMutation.mutate('dislike')}
        disabled={!userId || reactMutation.isPending}
        className={cn(
          "flex items-center gap-2 px-3 h-full bg-transparent border-none text-[10px] font-semibold tracking-[0.02em] font-sans transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer outline-none",
          userReaction === 'dislike' 
            ? "text-[#f8fafc] bg-white/[0.06]" 
            : "text-[#94a3b8] hover:text-[#f8fafc] hover:bg-white/[0.03]"
        )}
      >
        <ThumbsDown 
          className={cn(
            "w-3 h-3 stroke-[2.2px]",
            userReaction === 'dislike' && "fill-white/10"
          )} 
        />
        <span className="tabular-nums">{reactionCounts?.dislikes || 0}</span>
      </button>

    </div>
  );
}
