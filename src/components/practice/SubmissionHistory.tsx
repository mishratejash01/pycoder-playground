import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface SubmissionHistoryProps {
  problemId: string;
  userId: string | undefined;
  onSelectSubmission?: (code: string, language: string) => void;
}

export function SubmissionHistory({ problemId, userId, onSelectSubmission }: SubmissionHistoryProps) {
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['problem_submissions', problemId, userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('practice_submissions')
        .select('*')
        .eq('problem_id', problemId)
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId && !!problemId
  });

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#475569] py-8 bg-[#0c0c0c]">
        <p className="font-serif italic text-sm">Please authenticate to view archives.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3 p-4 bg-[#0c0c0c] h-full">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-[#1a1a1a] border border-white/[0.08] rounded-[4px] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0c0c0c] text-[#f8fafc] font-sans">
      
      {/* Registry Header */}
      <div className="flex justify-between items-center pb-5 mb-3 border-b border-white/[0.08] px-1 pt-2">
        <span className="font-serif italic text-[15px] text-[#94a3b8]">
          Submission History Archive
        </span>
        <span className="text-[10px] uppercase tracking-[0.15em] text-[#475569]">
          Recent {submissions.length} Logs
        </span>
      </div>

      {/* Scrollable Archive */}
      <ScrollArea className="flex-1 -mr-3 pr-3">
        <div className="space-y-2.5 pb-4">
          {submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#475569]">
              <p className="font-serif italic text-sm">No records found in the registry.</p>
            </div>
          ) : (
            submissions.map((sub, idx) => {
              const isVerified = sub.status === 'completed';
              
              return (
                <button
                  key={sub.id}
                  onClick={() => onSelectSubmission?.(sub.code || '', sub.language || 'python')}
                  className="w-full group flex items-center justify-between p-5 rounded-[4px] border border-white/[0.08] bg-[#1a1a1a] hover:bg-[#1f1f1f] hover:border-white/[0.15] hover:-translate-y-[2px] transition-all duration-300 ease-[cubic-bezier(0.165,0.84,0.44,1)] text-left"
                >
                  
                  {/* Left: Identification */}
                  <div className="flex flex-col gap-1">
                    <div className={cn(
                      "flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em]",
                      isVerified ? "text-white" : "text-[#475569]"
                    )}>
                      {/* Status Dot */}
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        isVerified 
                          ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]" 
                          : "border border-[#475569]"
                      )} />
                      
                      {isVerified ? "Verified" : "Revision Required"}
                      
                      {/* Language Pill */}
                      <span className="ml-3 px-2 py-0.5 border border-white/[0.08] rounded-[2px] text-[9px] text-[#475569] group-hover:border-white/20 transition-colors">
                        {sub.language?.toUpperCase() || 'PYTHON'}
                      </span>
                    </div>
                    
                    <span className="text-[10px] text-[#475569] pl-3.5">
                      {sub.submitted_at && formatDistanceToNow(new Date(sub.submitted_at), { addSuffix: true })}
                      {' '}&bull; #{sub.id.slice(0, 4)}
                    </span>
                  </div>

                  {/* Right: Performance Ledger */}
                  <div className="flex gap-8 text-right">
                    
                    {/* Latency */}
                    <div className="flex flex-col gap-0.5 min-w-[50px]">
                      <span className="text-[9px] uppercase tracking-[0.1em] text-[#475569]">Latency</span>
                      <span className="font-mono text-xs text-[#94a3b8]">
                        {sub.runtime_ms ? `${sub.runtime_ms}ms` : '--'}
                      </span>
                    </div>

                    {/* Memory */}
                    <div className="flex flex-col gap-0.5 min-w-[50px]">
                      <span className="text-[9px] uppercase tracking-[0.1em] text-[#475569]">Memory</span>
                      <span className="font-mono text-xs text-[#94a3b8]">
                        {sub.memory_kb ? `${Math.round(sub.memory_kb / 1024)}MB` : '--'}
                      </span>
                    </div>

                    {/* Validation */}
                    <div className="flex flex-col gap-0.5 min-w-[50px]">
                      <span className="text-[9px] uppercase tracking-[0.1em] text-[#475569]">Validation</span>
                      <span className={cn(
                        "font-mono text-xs",
                        isVerified ? "text-[#94a3b8]" : "text-[#475569]"
                      )}>
                        {sub.test_cases_passed ?? '-'}/{sub.test_cases_total ?? '-'}
                      </span>
                    </div>

                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
