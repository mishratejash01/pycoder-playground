import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ExamQuestion, ExamState, DBTestCase, TestCase } from "@/types/exam";
import { useNavigate } from "react-router-dom";

export const useProctoredExam = (examType: string, subjectId: string) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [examState, setExamState] = useState<ExamState>({
    currentQuestionIndex: 0,
    answers: {},
    results: {},
    isSubmitting: false,
    timeLeft: 0,
    sessionId: null,
  });

  // Fetch Questions
  useEffect(() => {
    const fetchExamData = async () => {
      try {
        setLoading(true);
        
        // Fetch from the NEW table: iitm_exam_question_bank
        const { data: questionsData, error: questionsError } = await supabase
          .from("iitm_exam_question_bank")
          .select("*")
          .eq("exam_type", examType)
          .eq("subject_id", subjectId);

        if (questionsError) throw questionsError;

        if (!questionsData || questionsData.length === 0) {
            toast({
                title: "No Exam Found",
                description: "No questions found for this exam type.",
                variant: "destructive",
            });
            setLoading(false);
            return;
        }

        // Parse and Transform Test Cases
        const parsedQuestions: ExamQuestion[] = questionsData.map((q) => {
          let rawTestCases: DBTestCase[] = [];
          
          if (typeof q.test_cases === 'string') {
            try {
              rawTestCases = JSON.parse(q.test_cases);
            } catch (e) {
              console.error("Failed to parse test_cases JSON", e);
            }
          } else if (Array.isArray(q.test_cases)) {
            rawTestCases = q.test_cases as unknown as DBTestCase[];
          }

          // Transform DB format (is_public, expected_output) to UI format (hidden, output)
          const formattedTestCases: TestCase[] = rawTestCases.map(tc => ({
            input: tc.input,
            output: tc.expected_output, // Map expected_output -> output
            hidden: !tc.is_public       // Map is_public -> hidden (inverse)
          }));

          return {
            ...q,
            test_cases: formattedTestCases
          };
        });

        setQuestions(parsedQuestions);
        
        // Calculate total time (sum of expected_time for all questions, default to 60 mins if 0)
        const totalTime = parsedQuestions.reduce((acc, q) => acc + (q.expected_time || 0), 0) * 60;
        setExamState(prev => ({ ...prev, timeLeft: totalTime || 3600 }));

      } catch (error: any) {
        console.error("Error fetching exam:", error);
        toast({
          title: "Error",
          description: "Failed to load exam questions.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (examType && subjectId) {
      fetchExamData();
    }
  }, [examType, subjectId, toast]);

  // Start Exam Session
  const startExam = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Check if session already exists
      const { data: existingSession } = await supabase
        .from("iitm_exam_sessions")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("exam_type", examType)
        .eq("subject_id", subjectId)
        .maybeSingle();

      if (existingSession) {
         if (existingSession.status === 'completed') {
             toast({ title: "Exam Completed", description: "You have already completed this exam." });
             navigate("/dashboard"); 
             return;
         }
         // Resume session
         setExamState(prev => ({ ...prev, sessionId: existingSession.id }));
         return;
      }

      // Create new session
      const { data: session, error } = await supabase
        .from("iitm_exam_sessions")
        .insert({
          user_id: user.id,
          subject_id: subjectId,
          exam_type: examType,
          status: "in_progress",
          start_time: new Date().toISOString(),
          violation_count: 0,
          total_score: 0,
          questions_attempted: 0,
          questions_correct: 0
        })
        .select()
        .single();

      if (error) throw error;
      setExamState(prev => ({ ...prev, sessionId: session.id }));

    } catch (error) {
      console.error("Error starting session:", error);
      toast({
        title: "Error",
        description: "Could not start exam session.",
        variant: "destructive",
      });
    }
  }, [examType, subjectId, navigate, toast]);

  // Submit Exam
  const submitExam = async () => {
    if (!examState.sessionId) return;

    setExamState(prev => ({ ...prev, isSubmitting: true }));

    try {
      let totalScore = 0;
      let correctCount = 0;
      let attemptedCount = Object.keys(examState.answers).length;

      // Calculate score based on results
      questions.forEach(q => {
          const result = examState.results[q.id];
          if (result?.passed) {
              totalScore += q.max_score;
              correctCount++;
          }
      });

      const { error } = await supabase
        .from("iitm_exam_sessions")
        .update({
          status: "completed",
          end_time: new Date().toISOString(),
          total_score: totalScore,
          questions_attempted: attemptedCount,
          questions_correct: correctCount,
        })
        .eq("id", examState.sessionId);

      if (error) throw error;

      toast({
        title: "Exam Submitted",
        description: `Your score: ${totalScore}`,
      });
      
      navigate("/dashboard");

    } catch (error) {
      console.error("Error submitting exam:", error);
      toast({
        title: "Error",
        description: "Failed to submit exam.",
        variant: "destructive",
      });
    } finally {
      setExamState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleAnswerChange = (code: string) => {
    const currentQ = questions[examState.currentQuestionIndex];
    if (!currentQ) return;
    
    setExamState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [currentQ.id]: code },
    }));
  };

  // Mock Runner - Replace with actual execution logic
  const runCode = async (code: string) => {
      const currentQ = questions[examState.currentQuestionIndex];
      // Note: In a real implementation, you would send 'code' and 'currentQ.test_cases' 
      // to your backend/execution engine here.
      
      // Simulating a success for UI demonstration
      setExamState(prev => ({
          ...prev,
          results: {
              ...prev.results,
              [currentQ.id]: { passed: true, score: currentQ.max_score }
          }
      }));
      return { success: true, output: "Code execution simulation: Passed" };
  };

  return {
    loading,
    questions,
    examState,
    setExamState,
    startExam,
    submitExam,
    handleAnswerChange,
    runCode
  };
};
