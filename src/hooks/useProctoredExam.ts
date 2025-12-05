import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { IitmExamSession, ExamType } from "@/types/exam";
import { useToast } from "@/hooks/use-toast";

export const useProctoredExam = () => {
  const { toast } = useToast();
  const [session, setSession] = useState<IitmExamSession | null>(null);

  // 1. Start Exam Session
  const startProctoredSession = async (
    userId: string,
    subjectId: string,
    examType: string,
    setName: string
  ) => {
    try {
      const { data, error } = await supabase
        .from("iitm_exam_sessions")
        .insert({
          user_id: userId,
          subject_id: subjectId,
          exam_type: examType,
          set_name: setName,
          status: "in_progress",
          start_time: new Date().toISOString(),
          total_score: 0,
          questions_attempted: 0,
          questions_correct: 0,
          violation_count: 0,
          violation_logs: []
        })
        .select()
        .single();

      if (error) throw error;
      setSession(data as IitmExamSession);
      return data;
    } catch (error: any) {
      console.error("Session Start Error:", error);
      toast({
        variant: "destructive",
        title: "Exam Error",
        description: "Could not initialize proctored session.",
      });
      return null;
    }
  };

  // 2. Log Violation
  const logProctoredViolation = async (violationType: string, message: string) => {
    if (!session) return;

    const newViolation = {
      time: new Date().toISOString(),
      type: violationType,
      message: message
    };

    const updatedLogs = [...(session.violation_logs || []), newViolation];
    const newCount = (session.violation_count || 0) + 1;

    // Optimistic update
    setSession({ ...session, violation_count: newCount, violation_logs: updatedLogs });

    // Background update
    const { error } = await supabase
      .from("iitm_exam_sessions")
      .update({
        violation_count: newCount,
        violation_logs: updatedLogs
      })
      .eq("id", session.id);

    if (error) console.error("Failed to log violation:", error);
  };

  // 3. End Exam Session
  const endProctoredSession = async (
    status: 'completed' | 'terminated',
    stats: { score: number; attempted: number; correct: number },
    duration: number
  ) => {
    if (!session) return;

    const { error } = await supabase
      .from("iitm_exam_sessions")
      .update({
        status: status,
        end_time: new Date().toISOString(),
        duration_seconds: duration,
        total_score: stats.score,
        questions_attempted: stats.attempted,
        questions_correct: stats.correct
      })
      .eq("id", session.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: "Failed to save exam results. Please contact support.",
      });
    }
  };

  return {
    session,
    startProctoredSession,
    logProctoredViolation,
    endProctoredSession
  };
};
