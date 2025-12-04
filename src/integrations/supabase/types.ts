export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      // --- EXISTING TABLES ---
      assignments: {
        Row: {
          category: string | null
          created_at: string | null
          deadline: string | null
          description: string
          expected_time: number | null
          id: string
          instructions: string | null
          max_score: number | null
          starter_code: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          deadline?: string | null
          description: string
          expected_time?: number | null
          id?: string
          instructions?: string | null
          max_score?: number | null
          starter_code?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string
          expected_time?: number | null
          id?: string
          instructions?: string | null
          max_score?: number | null
          starter_code?: string | null
          title?: string
          updated_at?: string | null
        }
      }
      // ... (Keep your other existing tables: exam_sessions, profiles, submissions, etc. intact) ...
      
      // --- NEW PRACTICE ARENA TABLES ---
      practice_problems: {
        Row: {
          id: string
          slug: string
          title: string
          description: string
          difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert'
          tags: string[] | null
          starter_templates: Json
          likes: number
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          description: string
          difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Expert'
          tags?: string[] | null
          starter_templates?: Json
          likes?: number
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          description?: string
          difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Expert'
          tags?: string[] | null
          starter_templates?: Json
          likes?: number
          created_at?: string
        }
      }
      practice_test_cases: {
        Row: {
          id: string
          problem_id: string
          input: string
          expected_output: string
          is_public: boolean
          explanation: string | null
          created_at: string
        }
        Insert: {
          id?: string
          problem_id: string
          input: string
          expected_output: string
          is_public?: boolean
          explanation?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          problem_id?: string
          input?: string
          expected_output?: string
          is_public?: boolean
          explanation?: string | null
          created_at?: string
        }
      }
      practice_submissions: {
        Row: {
          id: string
          problem_id: string
          user_id: string
          language: string
          code: string
          status: string
          runtime_ms: number | null
          passed_cases: number
          total_cases: number
          submitted_at: string
        }
        Insert: {
          id?: string
          problem_id: string
          user_id: string
          language: string
          code: string
          status: string
          runtime_ms?: number | null
          passed_cases?: number
          total_cases?: number
          submitted_at?: string
        }
        Update: {
          id?: string
          problem_id?: string
          user_id?: string
          language?: string
          code?: string
          status?: string
          runtime_ms?: number | null
          passed_cases?: number
          total_cases?: number
          submitted_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      difficulty_level: 'Easy' | 'Medium' | 'Hard' | 'Expert'
    }
  }
}
