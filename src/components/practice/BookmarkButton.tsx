import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface BookmarkButtonProps {
  problemId: string;
  userId: string | undefined;
  variant?: 'icon' | 'full';
}

export function BookmarkButton({ problemId, userId, variant = 'icon' }: BookmarkButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: isBookmarked } = useQuery({
    queryKey: ['bookmark', problemId, userId],
    queryFn: async () => {
      if (!userId) return false;
      const { data, error } = await supabase
        .from('practice_bookmarks')
        .select('id')
        .eq('problem_id', problemId)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return !!data;
    },
    enabled: !!userId && !!problemId
  });

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Not logged in');
      
      if (isBookmarked) {
        const { error } = await supabase
          .from('practice_bookmarks')
          .delete()
          .eq('problem_id', problemId)
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('practice_bookmarks')
          .insert({ problem_id: problemId, user_id: userId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmark', problemId, userId] });
      queryClient.invalidateQueries({ queryKey: ['user_bookmarks', userId] });
      toast({
        title: isBookmarked ? 'Removed from bookmarks' : 'Bookmarked!',
        description: isBookmarked ? 'Problem removed from your list' : 'Problem saved to your bookmarks',
        className: "bg-[#0A0A0C] border-[#1A1A1C] text-white"
      });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update bookmark', variant: 'destructive' });
    }
  });

  if (!userId) return null;

  // --- STRICT DESIGN STYLES ---

  // Common transition and basic reset styles
  const baseStyles = "flex items-center justify-center transition-all duration-200 border cursor-pointer outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  
  // Icon Variant Styles (36x36px)
  const iconBase = "w-[36px] h-[36px]";
  const iconInactive = "bg-transparent border-[#1A1A1C] text-[#666666] hover:bg-[#0A0A0C] hover:border-[#333333] hover:text-white";
  const iconActive = "bg-[#1A1A1C] border-[#444] text-white";

  // Full Variant Styles (Height 36px, Padding 20px, Font 10px Bold Uppercase)
  const fullBase = "h-[36px] px-[20px] text-[10px] font-bold uppercase tracking-[0.15em] gap-[10px]";
  const fullInactive = "bg-transparent border-[#1A1A1C] text-[#666666] hover:text-white hover:border-[#333333]";
  const fullActive = "bg-white text-[#050505] border-white hover:bg-white/90";

  if (variant === 'icon') {
    return (
      <button
        onClick={() => toggleMutation.mutate()}
        disabled={toggleMutation.isPending}
        className={cn(
          baseStyles,
          iconBase,
          isBookmarked ? iconActive : iconInactive
        )}
        title={isBookmarked ? "Remove Bookmark" : "Save Bookmark"}
      >
        <Bookmark 
          className={cn("w-[14px] h-[14px]", isBookmarked && "fill-current")} 
          strokeWidth={2.5} 
        />
      </button>
    );
  }

  return (
    <button
      onClick={() => toggleMutation.mutate()}
      disabled={toggleMutation.isPending}
      className={cn(
        baseStyles,
        fullBase,
        isBookmarked ? fullActive : fullInactive
      )}
    >
      <Bookmark 
        className={cn("w-[14px] h-[14px]", isBookmarked && "fill-current")} 
        strokeWidth={2.5} 
      />
      {isBookmarked ? 'Bookmarked' : 'Bookmark'}
    </button>
  );
}
