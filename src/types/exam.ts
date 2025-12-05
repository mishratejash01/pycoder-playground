export type ExamType = 'PRACTICE' | 'OPPE 1' | 'OPPE 2' | 'QUIZ 1' | 'QUIZ 2' | 'END_TERM';

// Matches iitm_exams_questions table
export interface IitmExamQuestion {
  id: string;
  subject_id: string;
  title: string;
  description: string;
  instructions: string;
  exam_type: ExamType;
  set_name: string;
  category: string;
  max_score: number;
  expected_time: number;
  deadline?: string;
  starter_code: string;
  test_cases_config: any; // JSON for public test cases
  private_test_cases?: any; // JSON for hidden test cases
  created_at: string;
  updated_at: string;
}

// Matches iitm_exam_sessions table
export interface IitmExamSession {
  id: string;
  user_id: string;
  subject_id: string;
  exam_type: ExamType;
  set_name: string;
  status: 'started' | 'in_progress' | 'completed' | 'terminated';
  total_score: number;
  questions_attempted: number;
  questions_correct: number;
  start_time: string;
  end_time?: string;
  duration_seconds: number;
  violation_count: number;
  violation_logs: any[]; // JSON array of violation events
  created_at: string;
}
