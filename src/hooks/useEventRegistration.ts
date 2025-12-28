import { useState } from "react";
import { useToast } from "@/hooks/use-toast"; // Adjust path if using sonner or other
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export type RegistrationData = {
  eventId: string;
  userId: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  collegeOrgName: string;
  currentStatus: string;
  countryCity: string;
  experienceLevel: string;
  githubLink?: string;
  linkedinLink?: string;
  resumeUrl?: string;
  participationType: "Individual" | "Team";
  teamName?: string;
  teamRole?: "Leader" | "Member";
  motivationAnswer?: string;
  priorExperience?: string;
  preferredTrack?: string;
  agreedToRules: boolean;
  agreedToPrivacy: boolean;
  customAnswers?: Record<string, any>;
};

export const useEventRegistration = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const checkExistingRegistration = async (eventId: string, userId: string) => {
    const { data, error } = await supabase
      .from("event_registrations")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error checking registration:", error);
      return false;
    }
    return !!data;
  };

  const checkTeamExists = async (eventId: string, teamName: string) => {
    // We look for a "Leader" with this team name for this event
    const { data, error } = await supabase
      .from("event_registrations")
      .select("id, team_members_data")
      .eq("event_id", eventId)
      .eq("team_name", teamName)
      .eq("team_role", "Leader") // The team logic relies on a Leader existing
      .maybeSingle();

    if (error) {
      console.error("Error checking team:", error);
      throw new Error("Failed to verify team existence.");
    }
    return data;
  };

  const registerForEvent = async (data: RegistrationData) => {
    setIsRegistering(true);
    console.log("Starting registration with data:", data);

    try {
      // 1. Check if user is already registered
      const isAlreadyRegistered = await checkExistingRegistration(
        data.eventId,
        data.userId
      );

      if (isAlreadyRegistered) {
        toast({
          title: "Already Registered",
          description: "You are already registered for this event.",
          variant: "destructive",
        });
        return false;
      }

      // 2. Handle Team Join Logic specifically
      if (
        data.participationType === "Team" &&
        data.teamRole === "Member" &&
        data.teamName
      ) {
        console.log("Attempting to join team:", data.teamName);
        const existingTeam = await checkTeamExists(data.eventId, data.teamName);

        if (!existingTeam) {
          toast({
            title: "Team Not Found",
            description: `The team "${data.teamName}" does not exist. Please check the name or create a new team.`,
            variant: "destructive",
          });
          setIsRegistering(false);
          return false;
        }

        // Optional: Check if team is full based on team_members_data length
        // const currentMembers = existingTeam.team_members_data as any[] || [];
        // if (currentMembers.length >= MAX_MEMBERS) { ... }
      }

      // 3. Prepare the payload
      // Note: We default team_members_data to an empty array for new registrations
      // For members, we don't necessarily update the Leader's row here immediately unless we use the RPC.
      // We will simply insert the Member's record. The 'team_name' links them.
      
      const payload = {
        event_id: data.eventId,
        user_id: data.userId,
        full_name: data.fullName,
        email: data.email,
        mobile_number: data.mobileNumber,
        college_org_name: data.collegeOrgName,
        current_status: data.currentStatus,
        country_city: data.countryCity,
        experience_level: data.experienceLevel,
        github_link: data.githubLink,
        linkedin_link: data.linkedinLink,
        resume_url: data.resumeUrl,
        participation_type: data.participationType,
        team_name: data.teamName,
        team_role: data.teamRole, // 'Leader' or 'Member'
        motivation_answer: data.motivationAnswer,
        prior_experience: data.priorExperience,
        preferred_track: data.preferredTrack,
        agreed_to_rules: data.agreedToRules,
        agreed_to_privacy: data.agreedToPrivacy,
        status: "confirmed", // Default status
        payment_status: "exempt", // Default for free events
        custom_answers: data.customAnswers || {},
        team_members_data: [], // Initialize as empty JSON array
      };

      console.log("Sending payload to Supabase:", payload);

      const { error } = await supabase
        .from("event_registrations")
        .insert([payload]);

      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }

      // 4. (Optional) If we joined a team, we might want to trigger a notification 
      // or update the leader's view, but the simple INSERT with team_name is usually enough 
      // if your backend/dashboard queries by team_name.

      toast({
        title: "Registration Successful!",
        description: "You have successfully joined the assembly.",
      });

      // Navigate to dashboard or success page
      navigate("/dashboard");
      return true;

    } catch (error: any) {
      console.error("Registration failed:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsRegistering(false);
    }
  };

  return {
    registerForEvent,
    isRegistering,
  };
};
