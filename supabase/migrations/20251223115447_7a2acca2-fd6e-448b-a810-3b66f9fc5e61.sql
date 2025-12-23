-- Add verdict and feedback columns to practice_submissions
ALTER TABLE practice_submissions 
ADD COLUMN IF NOT EXISTS verdict text,
ADD COLUMN IF NOT EXISTS failed_test_index integer,
ADD COLUMN IF NOT EXISTS error_type text,
ADD COLUMN IF NOT EXISTS feedback_message text,
ADD COLUMN IF NOT EXISTS execution_time_ms integer;

-- Create benchmarks table for percentile calculations
CREATE TABLE IF NOT EXISTS practice_execution_benchmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id uuid REFERENCES practice_problems(id) ON DELETE CASCADE,
  language text NOT NULL,
  runtime_ms_p50 integer DEFAULT 0,
  runtime_ms_p90 integer DEFAULT 0,
  runtime_ms_p99 integer DEFAULT 0,
  memory_kb_p50 integer DEFAULT 0,
  memory_kb_p90 integer DEFAULT 0,
  memory_kb_p99 integer DEFAULT 0,
  total_submissions integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(problem_id, language)
);

-- Enable RLS
ALTER TABLE practice_execution_benchmarks ENABLE ROW LEVEL SECURITY;

-- Public read access for benchmarks
CREATE POLICY "Public read benchmarks" ON practice_execution_benchmarks
FOR SELECT USING (true);

-- Create function to calculate runtime percentile
CREATE OR REPLACE FUNCTION calculate_runtime_percentile(
  p_problem_id uuid,
  p_language text,
  p_runtime_ms integer
) RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT ROUND(
        (COUNT(*) FILTER (WHERE runtime_ms > p_runtime_ms)::numeric / NULLIF(COUNT(*), 0)::numeric) * 100
      )::integer
      FROM practice_submissions
      WHERE problem_id = p_problem_id 
        AND language = p_language 
        AND status = 'completed'
        AND runtime_ms IS NOT NULL
    ), 
    50
  );
$$;

-- Create function to calculate memory percentile  
CREATE OR REPLACE FUNCTION calculate_memory_percentile(
  p_problem_id uuid,
  p_language text,
  p_memory_kb integer
) RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT ROUND(
        (COUNT(*) FILTER (WHERE memory_kb > p_memory_kb)::numeric / NULLIF(COUNT(*), 0)::numeric) * 100
      )::integer
      FROM practice_submissions
      WHERE problem_id = p_problem_id 
        AND language = p_language 
        AND status = 'completed'
        AND memory_kb IS NOT NULL
    ), 
    50
  );
$$;