import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle2, ChevronRight, ChevronLeft, Trash2, Plus, Mail } from 'lucide-react';
import { toast } from 'sonner';

// --- VALIDATION SCHEMA ---
const formSchema = z.object({
  full_name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  mobile_number: z.string().min(10, "Valid mobile required"),
  college_org_name: z.string().min(2, "Required"),
  current_status: z.enum(['Student', 'Working Professional', 'Freelancer']),
  country_city: z.string().min(2, "Location required"),
  experience_level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  primary_languages: z.string().min(1, "Enter at least one language"),
  tech_stack_skills: z.string().optional(),
  github_link: z.string().url().optional().or(z.literal("")),
  linkedin_link: z.string().url().optional().or(z.literal("")),
  resume_url: z.string().url().optional().or(z.literal("")),
  participation_type: z.enum(['Solo', 'Team']),
  team_name: z.string().optional(),
  // Just a list of emails to invite
  team_members: z.array(z.object({
    email: z.string().email("Email required")
  })).max(5, "Max 5 invites allowed").optional(),
  motivation_answer: z.string().min(10, "Tell us a bit more!"),
  preferred_track: z.string().optional(),
  agreed_to_rules: z.boolean().refine(val => val === true, "You must agree to the rules"),
  agreed_to_privacy: z.boolean().refine(val => val === true, "You must agree to privacy policy"),
}).superRefine((data, ctx) => {
  if (data.participation_type === 'Team') {
    if (!data.team_name || data.team_name.length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Team Name is required", path: ["team_name"] });
    }
  }
});

type FormValues = z.infer<typeof formSchema>;

interface EventRegistrationModalProps {
  event: { id: string; title: string };
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  // If passed, user is accepting an invite
  inviteData?: { id: string; team_name: string; email: string } | null;
}

export function EventRegistrationModal({ event, isOpen, onOpenChange, inviteData }: EventRegistrationModalProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "", email: inviteData?.email || "", mobile_number: "", college_org_name: "", country_city: "",
      current_status: "Student", experience_level: "Beginner",
      primary_languages: "", tech_stack_skills: "",
      participation_type: inviteData ? "Team" : "Solo",
      team_name: inviteData?.team_name || "",
      team_members: [],
      agreed_to_rules: false, agreed_to_privacy: false,
      motivation_answer: ""
    },
    mode: "onChange" 
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "team_members"
  });

  const watchParticipation = form.watch("participation_type");

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();

    // 1. Create the Registration Record
    const registrationData = {
      event_id: event.id,
      user_id: session?.user?.id,
      ...values,
      primary_languages: values.primary_languages.split(',').map(s => s.trim()),
      tech_stack_skills: values.tech_stack_skills ? values.tech_stack_skills.split(',').map(s => s.trim()) : [],
      // We do NOT store the invite list in the registration table anymore
      team_members_data: [], 
    };
    delete (registrationData as any).team_members;

    const { error: regError } = await supabase.from('event_registrations').insert(registrationData);

    if (regError) {
      setIsSubmitting(false);
      if (regError.code === '23505') toast.error("You are already registered!");
      else toast.error("Registration failed. Please try again.");
      return;
    }

    // 2. If Leader: Create Invites in `team_invites` table
    if (values.participation_type === 'Team' && values.team_members && values.team_members.length > 0 && !inviteData) {
      const invites = values.team_members.map(m => ({
        event_id: event.id,
        sender_id: session?.user?.id,
        team_name: values.team_name,
        invitee_email: m.email,
        status: 'pending'
      }));
      
      const { error: inviteError } = await supabase.from('team_invites').insert(invites);
      
      if (inviteError) {
        console.error("Invite Error:", inviteError);
        toast.warning("Registration succeeded, but some invites failed to send.");
      }
    }

    // 3. If Accepting: Update the existing invite status
    if (inviteData) {
      await supabase
        .from('team_invites')
        .update({ status: 'accepted' })
        .eq('id', inviteData.id);
    }

    setIsSubmitting(false);
    setIsSuccess(true);
    toast.success("Welcome aboard!");
  }

  const nextStep = async () => {
    const isValid = await form.trigger(); // Trigger validation for current fields
    if (isValid) setStep(s => Math.min(s + 1, totalSteps));
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-[#0c0c0e] border border-white/10 text-white p-0 gap-0">
        
        {/* Header */}
        <div className="bg-[#151518] p-6 border-b border-white/5 sticky top-0 z-20">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex justify-between items-center">
              <span>{inviteData ? `Join Team: ${inviteData.team_name}` : event.title}</span>
              {!isSuccess && <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-1 rounded">Step {step}/{totalSteps}</span>}
            </DialogTitle>
          </DialogHeader>
          {!isSuccess && (
            <div className="w-full bg-white/5 h-1 mt-4 rounded-full overflow-hidden">
              <div 
                className="bg-purple-600 h-full transition-all duration-300 ease-out" 
                style={{ width: `${(step / totalSteps) * 100}%` }} 
              />
            </div>
          )}
        </div>

        <div className="p-6">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-10 text-center animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 text-green-500 border border-green-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Success!</h3>
              <p className="text-gray-400 mb-8 max-w-sm">
                {inviteData 
                 ? "You have officially joined the team." 
                 : "Registration complete! Your team invites have been sent."}
              </p>
              <Button onClick={() => onOpenChange(false)} className="w-full bg-white text-black hover:bg-gray-200 font-bold">
                Return to Dashboard
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* --- STEPS (Simplified for brevity, same logic as before) --- */}
                {step === 1 && (
                  <div className="space-y-4 animate-in slide-in-from-right-4">
                    <FormField control={form.control} name="full_name" render={({ field }) => (
                        <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input className="bg-white/5 border-white/10" {...field}/></FormControl><FormMessage/></FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>Email</FormLabel><FormControl><Input className="bg-white/5 border-white/10" {...field} disabled={!!inviteData} /></FormControl><FormMessage/></FormItem>
                    )} />
                    {/* Add other Step 1 fields (Phone, City, etc.) here */}
                    <FormField control={form.control} name="mobile_number" render={({ field }) => (
                        <FormItem><FormLabel>Mobile</FormLabel><FormControl><Input className="bg-white/5 border-white/10" {...field}/></FormControl><FormMessage/></FormItem>
                    )} />
                     <FormField control={form.control} name="college_org_name" render={({ field }) => (
                        <FormItem><FormLabel>College/Org</FormLabel><FormControl><Input className="bg-white/5 border-white/10" {...field}/></FormControl><FormMessage/></FormItem>
                    )} />
                    <FormField control={form.control} name="country_city" render={({ field }) => (
                        <FormItem><FormLabel>City</FormLabel><FormControl><Input className="bg-white/5 border-white/10" {...field}/></FormControl><FormMessage/></FormItem>
                    )} />
                    <FormField control={form.control} name="current_status" render={({ field }) => (
                      <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="bg-white/5 border-white/10"><SelectValue/></SelectTrigger></FormControl><SelectContent className="bg-[#151518] text-white"><SelectItem value="Student">Student</SelectItem><SelectItem value="Working Professional">Working Professional</SelectItem><SelectItem value="Freelancer">Freelancer</SelectItem></SelectContent></Select><FormMessage/></FormItem>
                    )} />
                  </div>
                )}

                {step === 2 && (
                    <div className="space-y-4 animate-in slide-in-from-right-4">
                        <FormField control={form.control} name="experience_level" render={({ field }) => (
                        <FormItem><FormLabel>Experience</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="bg-white/5 border-white/10"><SelectValue/></SelectTrigger></FormControl><SelectContent className="bg-[#151518] text-white"><SelectItem value="Beginner">Beginner</SelectItem><SelectItem value="Intermediate">Intermediate</SelectItem><SelectItem value="Advanced">Advanced</SelectItem></SelectContent></Select><FormMessage/></FormItem>
                        )} />
                        <FormField control={form.control} name="primary_languages" render={({ field }) => (
                            <FormItem><FormLabel>Languages</FormLabel><FormControl><Input className="bg-white/5 border-white/10" {...field}/></FormControl><FormMessage/></FormItem>
                        )} />
                    </div>
                )}

                {step === 3 && (
                  <div className="space-y-6 animate-in slide-in-from-right-4">
                    <FormField control={form.control} name="participation_type" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Participation Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!inviteData}>
                          <FormControl><SelectTrigger className="bg-white/5 border-white/10 h-12"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent className="bg-[#151518] text-white border-white/10">
                            <SelectItem value="Solo">Solo</SelectItem>
                            <SelectItem value="Team">Team</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />

                    {watchParticipation === 'Team' && (
                      <div className="space-y-4 pl-4 border-l-2 border-purple-500/30">
                        <FormField control={form.control} name="team_name" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Team Name</FormLabel>
                            <FormControl><Input className="bg-white/5 border-white/10" {...field} disabled={!!inviteData} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />

                        {/* ONLY Show "Add Member" if NOT accepting an invite */}
                        {!inviteData && (
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <FormLabel>Invite Members (Max 5)</FormLabel>
                              {fields.length < 5 && (
                                <Button type="button" variant="outline" size="sm" onClick={() => append({ email: "" })} className="h-7 text-xs border-white/20">
                                  <Plus className="w-3 h-3 mr-1" /> Add
                                </Button>
                              )}
                            </div>
                            {fields.map((field, index) => (
                              <div key={field.id} className="flex gap-2 items-center">
                                <Mail className="w-4 h-4 text-gray-500" />
                                <FormField control={form.control} name={`team_members.${index}.email`} render={({ field }) => (
                                  <FormItem className="flex-1"><FormControl><Input placeholder="email@example.com" className="bg-white/5 border-white/10 h-9 text-sm" {...field} /></FormControl></FormItem>
                                )} />
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-8 w-8 text-red-400">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {step === 4 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                        <FormField control={form.control} name="motivation_answer" render={({ field }) => (
                        <FormItem><FormLabel>Motivation</FormLabel><FormControl><Textarea className="bg-white/5 border-white/10" {...field}/></FormControl><FormMessage/></FormItem>
                        )} />
                         <div className="space-y-4 pt-4 border-t border-white/10">
                            <FormField control={form.control} name="agreed_to_rules" render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Agree to Rules</FormLabel></div></FormItem>
                            )} />
                             <FormField control={form.control} name="agreed_to_privacy" render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Consent to Privacy</FormLabel></div></FormItem>
                            )} />
                        </div>
                    </div>
                )}

                <div className="flex justify-between pt-6 border-t border-white/5">
                  {step > 1 ? <Button type="button" variant="outline" onClick={prevStep} className="border-white/10 hover:bg-white/5 text-white">Previous</Button> : <div />}
                  {step < totalSteps ? <Button type="button" onClick={nextStep} className="bg-white text-black font-bold">Next</Button> : <Button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700 text-white font-bold">{isSubmitting ? <Loader2 className="animate-spin" /> : (inviteData ? "Accept & Join" : "Complete Registration")}</Button>}
                </div>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
