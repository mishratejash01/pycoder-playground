import { Database } from "@/integrations/supabase/types";

export type TestCase = {
  input: string;
  output: string;
  hidden: boolean;
};

export type ExamQuestion = Database['public']['Tables']['iitm_exams_questions']['Row'] & {
  test_cases: TestCase[]; // Helper to parse the JSON
};

export type ExamSession = Database['public']['Tables']['iitm_exam_sessions']['Row'];

export interface ExamState {
  currentQuestionIndex: number;
  answers: Record<string, string>; // question_id -> code
  results: Record<string, { passed: boolean; score: number }>;
  isSubmitting: boolean;
  timeLeft: number;
  sessionId: string | null;
}
