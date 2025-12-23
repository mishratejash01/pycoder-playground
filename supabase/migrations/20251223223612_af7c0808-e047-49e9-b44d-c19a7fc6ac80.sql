-- Add time tracking column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_time_spent_minutes integer DEFAULT 0;

-- Create a function to get the public leaderboard
-- This is a SECURITY DEFINER function so it can aggregate data across users
CREATE OR REPLACE FUNCTION public.get_practice_leaderboard(
  p_timeframe text DEFAULT 'all_time',
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  username text,
  avatar_url text,
  problems_solved bigint,
  total_score numeric,
  total_submissions bigint,
  current_streak integer,
  longest_streak integer,
  time_spent_minutes integer,
  last_active timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_date timestamp with time zone;
  v_end_date timestamp with time zone;
BEGIN
  -- Calculate date range based on timeframe
  IF p_timeframe = 'this_month' THEN
    v_start_date := date_trunc('month', now());
    v_end_date := now();
  ELSIF p_timeframe = 'last_month' THEN
    v_start_date := date_trunc('month', now() - interval '1 month');
    v_end_date := date_trunc('month', now());
  ELSIF p_timeframe = 'this_week' THEN
    v_start_date := date_trunc('week', now());
    v_end_date := now();
  ELSE
    v_start_date := '1970-01-01'::timestamp with time zone;
    v_end_date := now();
  END IF;

  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      ps.user_id,
      COUNT(DISTINCT ps.problem_id) FILTER (WHERE ps.status = 'completed') as problems_solved,
      COALESCE(SUM(ps.score), 0) as total_score,
      COUNT(*) as total_submissions,
      MAX(ps.submitted_at) as last_active
    FROM practice_submissions ps
    WHERE ps.submitted_at >= v_start_date 
      AND ps.submitted_at < v_end_date
      AND ps.user_id IS NOT NULL
    GROUP BY ps.user_id
    HAVING COUNT(DISTINCT ps.problem_id) FILTER (WHERE ps.status = 'completed') > 0
  )
  SELECT 
    us.user_id,
    COALESCE(p.full_name, p.username, 'Anonymous')::text as full_name,
    p.username::text,
    p.avatar_url::text,
    us.problems_solved,
    us.total_score,
    us.total_submissions,
    COALESCE(st.current_streak, 0) as current_streak,
    COALESCE(st.longest_streak, 0) as longest_streak,
    COALESCE(p.total_time_spent_minutes, 0) as time_spent_minutes,
    us.last_active
  FROM user_stats us
  LEFT JOIN profiles p ON p.id = us.user_id
  LEFT JOIN practice_streaks st ON st.user_id = us.user_id
  ORDER BY us.problems_solved DESC, us.total_score DESC, us.total_submissions DESC
  LIMIT p_limit;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.get_practice_leaderboard TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_practice_leaderboard TO anon;

-- Create a function to update time spent (call this periodically from frontend)
CREATE OR REPLACE FUNCTION public.update_time_spent(p_minutes integer DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    UPDATE profiles 
    SET total_time_spent_minutes = COALESCE(total_time_spent_minutes, 0) + p_minutes,
        last_seen_at = now()
    WHERE id = auth.uid();
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_time_spent TO authenticated;