import { Database } from "@/integrations/supabase/types";

// The shape of the test case object inside your new DB's 'test_cases' JSON column
export type DBTestCase = {
  id?: string;
  input: string;
  expected_output: string;
  weight: number;
  is_public: boolean;
};

// The shape the frontend components expect (standardizing for your UI)
export type TestCase = {
  input: string;
  output: string;
  hidden: boolean;
};

export type ExamQuestion = Database['public']['Tables']['iitm_exam_question_bank']['Row'] & {
  test_cases: TestCase[]; // We will transform the DB JSON into this format
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
