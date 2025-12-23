import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, ChevronRight, ChevronLeft, Trash2, Plus, Users, User, Zap, Code, Mail, Phone, Building, MapPin, Github, Linkedin, FileText, Trophy, Sparkles, Send, Shield, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface HackathonEvent {
  id: string;
  title: string;
  min_team_size: number;
  max_team_size: number;
  allow_solo: boolean;
  tracks: string[];
  custom_questions: { id: string; question: string; required: boolean; type: 'text' | 'textarea' | 'select'; options?: string[] }[];
  is_paid: boolean;
  registration_fee: number;
  currency: string;
  rules_document_url?: string;
}

interface HackathonRegistrationModalProps {
  event: HackathonEvent;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  // Step 1: Personal Info
  full_name: z.string().min(2, "Name is required").max(100),
  email: z.string().email("Invalid email").max(255),
  mobile_number: z.string().min(10, "Valid mobile required").max(20),
  college_org_name: z.string().min(2, "Required").max(200),
  current_status: z.enum(['Student', 'Working Professional', 'Freelancer', 'Founder']),
  country_city: z.string().min(2, "Location required").max(100),
  
  // Step 2: Technical Profile
  experience_level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
  primary_languages: z.string().min(1, "Enter at least one language"),
  tech_stack_skills: z.string().optional(),
  github_link: z.string().url().optional().or(z.literal("")),
  linkedin_link: z.string().url().optional().or(z.literal("")),
  resume_url: z.string().url().optional().or(z.literal("")),
  portfolio_url: z.string().url().optional().or(z.literal("")),
  prior_experience: z.boolean().default(false),

  // Step 3: Participation
  participation_type: z.enum(['Solo', 'Team']),
  team_name: z.string().optional(),
  team_members: z.array(z.object({
    name: z.string().min(1, "Name required"),
    email: z.string().email("Email required"),
    mobile: z.string().optional(),
    role: z.string().default("Member")
  })).optional(),

  // Step 4: Hackathon Specifics
  preferred_track: z.string().optional(),
  motivation_answer: z.string().min(20, "Please provide more details").max(1000),
  custom_answers: z.record(z.string()).optional(),

  // Step 5: Agreements
  agreed_to_rules: z.boolean().refine(val => val === true, "You must agree to the rules"),
  agreed_to_privacy: z.boolean().refine(val => val === true, "You must agree to privacy policy"),
}).superRefine((data, ctx) => {
  if (data.participation_type === 'Team') {
    if (!data.team_name || data.team_name.length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Team Name is required", path: ["team_name"] });
    }
    if (!data.team_members || data.team_members.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Add at least one team member", path: ["team_members"] });
    }
  }
});

type FormValues = z.infer<typeof formSchema>;

const STEP_ICONS = [User, Code, Users, Zap, Shield];
const STEP_TITLES = ["Personal Info", "Technical Profile", "Team Setup", "Hackathon Details", "Agreement"];

export function HackathonRegistrationModal({ event, isOpen, onOpenChange }: HackathonRegistrationModalProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  const tracks = Array.isArray(event.tracks) ? event.tracks : [];
  const customQuestions = Array.isArray(event.custom_questions) ? event.custom_questions : [];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "", email: "", mobile_number: "", college_org_name: "", country_city: "",
      current_status: "Student", experience_level: "Beginner",
      primary_languages: "", tech_stack_skills: "", prior_experience: false,
      participation_type: event.allow_solo ? "Solo" : "Team",
      team_name: "", team_members: [],
      preferred_track: tracks[0] || "",
      motivation_answer: "", custom_answers: {},
      agreed_to_rules: false, agreed_to_privacy: false,
    },
    mode: "onChange"
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "team_members"
  });

  const watchParticipation = form.watch("participation_type");

  // Pre-fill from user profile
  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        form.setValue('email', session.user.email || '');
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (profile) {
          setUserProfile(profile);
          form.setValue('full_name', profile.full_name || '');
          form.setValue('mobile_number', profile.contact_no || '');
          form.setValue('college_org_name', profile.institute_name || '');
          form.setValue('country_city', profile.country || '');
          form.setValue('github_link', profile.github_handle ? `https://github.com/${profile.github_handle}` : '');
          form.setValue('linkedin_link', profile.linkedin_url || '');
          form.setValue('portfolio_url', profile.portfolio_url || '');
          form.setValue('experience_level', (profile.experience_level as any) || 'Beginner');
        }
      }
    }
    if (isOpen) loadProfile();
  }, [isOpen, form]);

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      toast.error("Please login to register");
      setIsSubmitting(false);
      return;
    }

    // Prepare registration data
    const registrationData = {
      event_id: event.id,
      user_id: session.user.id,
      full_name: values.full_name.trim(),
      email: values.email.trim().toLowerCase(),
      mobile_number: values.mobile_number.trim(),
      college_org_name: values.college_org_name.trim(),
      current_status: values.current_status,
      country_city: values.country_city.trim(),
      experience_level: values.experience_level,
      primary_languages: values.primary_languages.split(',').map(s => s.trim()),
      tech_stack_skills: values.tech_stack_skills ? values.tech_stack_skills.split(',').map(s => s.trim()) : [],
      github_link: values.github_link || null,
      linkedin_link: values.linkedin_link || null,
      resume_url: values.resume_url || null,
      prior_experience: values.prior_experience,
      participation_type: values.participation_type,
      team_name: values.participation_type === 'Team' ? values.team_name : null,
      team_members_data: values.participation_type === 'Team' ? values.team_members : [],
      team_role: 'Leader',
      preferred_track: values.preferred_track || null,
      motivation_answer: values.motivation_answer.trim(),
      custom_answers: values.custom_answers || {},
      agreed_to_rules: values.agreed_to_rules,
      agreed_to_privacy: values.agreed_to_privacy,
      payment_status: event.is_paid ? 'pending' : 'exempt',
      status: event.is_paid ? 'pending_payment' : 'confirmed',
    };

    const { data: registration, error } = await supabase
      .from('event_registrations')
      .insert(registrationData as any)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') toast.error("You're already registered for this hackathon!");
      else toast.error("Registration failed. Please try again.");
      setIsSubmitting(false);
      return;
    }

    // Create team invitations if team registration
    if (values.participation_type === 'Team' && values.team_members && values.team_members.length > 0) {
      const invitations = values.team_members.map(member => ({
        registration_id: registration.id,
        event_id: event.id,
        team_name: values.team_name!,
        inviter_user_id: session.user.id,
        inviter_name: values.full_name,
        inviter_email: values.email,
        invitee_email: member.email.toLowerCase(),
        invitee_mobile: member.mobile || null,
        invitee_name: member.name,
        role: member.role || 'Member',
        status: 'pending',
        token: crypto.randomUUID(),
      }));

      const { error: inviteError } = await supabase
        .from('team_invitations')
        .insert(invitations);

      if (inviteError) {
        console.error('Failed to create invitations:', inviteError);
        toast.warning("Registered, but some invites may not have been sent");
      }
    }

    setIsSubmitting(false);
    setIsSuccess(true);
    toast.success("Registration successful!");
  }

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormValues)[] = [];
    if (step === 1) fieldsToValidate = ['full_name', 'email', 'mobile_number', 'college_org_name', 'country_city', 'current_status'];
    if (step === 2) fieldsToValidate = ['primary_languages', 'experience_level'];
    if (step === 3) fieldsToValidate = watchParticipation === 'Team' ? ['participation_type', 'team_name', 'team_members'] : ['participation_type'];
    if (step === 4) fieldsToValidate = ['motivation_answer'];

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setStep(s => Math.min(s + 1, totalSteps));
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const canAddMoreMembers = fields.length < (event.max_team_size - 1);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-gradient-to-b from-zinc-900 to-black border border-purple-500/20 text-white p-0 gap-0">
        
        {/* Header with Progress */}
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/20 p-6 border-b border-white/5 sticky top-0 z-20 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <span className="block">{event.title}</span>
                <span className="text-xs font-normal text-purple-400">Hackathon Registration</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {!isSuccess && (
            <div className="mt-6">
              {/* Step Indicators */}
              <div className="flex justify-between items-center">
                {STEP_TITLES.map((title, index) => {
                  const StepIcon = STEP_ICONS[index];
                  const stepNum = index + 1;
                  const isActive = step === stepNum;
                  const isCompleted = step > stepNum;
                  
                  return (
                    <div key={title} className="flex flex-col items-center flex-1">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                        isActive ? "bg-purple-500 border-purple-400 shadow-lg shadow-purple-500/30" :
                        isCompleted ? "bg-green-500/20 border-green-500 text-green-400" :
                        "bg-zinc-800 border-zinc-700 text-zinc-500"
                      )}>
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <StepIcon className="w-4 h-4" />}
                      </div>
                      <span className={cn(
                        "text-[10px] mt-2 font-medium uppercase tracking-wide hidden md:block",
                        isActive ? "text-purple-400" : isCompleted ? "text-green-400" : "text-zinc-600"
                      )}>{title}</span>
                    </div>
                  );
                })}
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-zinc-800 h-1 mt-4 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-500" 
                  style={{ width: `${(step / totalSteps) * 100}%` }} 
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 md:p-8">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-10 text-center animate-in zoom-in duration-300">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-green-500/30">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">You're In! 🎉</h3>
              <p className="text-zinc-400 mb-4 max-w-md">
                Registration for <strong className="text-white">{event.title}</strong> is {event.is_paid ? 'pending payment' : 'confirmed'}.
              </p>
              {watchParticipation === 'Team' && fields.length > 0 && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 mb-6 text-sm">
                  <p className="text-purple-400">
                    <Send className="w-4 h-4 inline mr-2" />
                    Team invitations have been sent to your members!
                  </p>
                </div>
              )}
              {event.is_paid && (
                <Button className="w-full mb-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 font-bold">
                  <Lock className="w-4 h-4 mr-2" /> Complete Payment - {event.currency} {event.registration_fee}
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full border-zinc-700 hover:bg-zinc-800">
                Return to Event Page
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* STEP 1: Personal Info */}
                {step === 1 && (
                  <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="w-5 h-5 text-purple-400" />
                      <h3 className="text-lg font-semibold">Personal Information</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="full_name" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><User className="w-3 h-3" /> Full Name</FormLabel>
                          <FormControl><Input className="bg-zinc-800/50 border-zinc-700 focus:border-purple-500" placeholder="John Doe" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><Mail className="w-3 h-3" /> Email</FormLabel>
                          <FormControl><Input className="bg-zinc-800/50 border-zinc-700 focus:border-purple-500" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="mobile_number" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><Phone className="w-3 h-3" /> Mobile Number</FormLabel>
                          <FormControl><Input placeholder="+91 9876543210" className="bg-zinc-800/50 border-zinc-700 focus:border-purple-500" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="country_city" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><MapPin className="w-3 h-3" /> City, Country</FormLabel>
                          <FormControl><Input placeholder="New Delhi, India" className="bg-zinc-800/50 border-zinc-700 focus:border-purple-500" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <FormField control={form.control} name="college_org_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Building className="w-3 h-3" /> College / Organization</FormLabel>
                        <FormControl><Input placeholder="IIT Madras" className="bg-zinc-800/50 border-zinc-700 focus:border-purple-500" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="current_status" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-zinc-800/50 border-zinc-700">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-zinc-900 text-white border-zinc-700">
                            <SelectItem value="Student">🎓 Student</SelectItem>
                            <SelectItem value="Working Professional">💼 Working Professional</SelectItem>
                            <SelectItem value="Freelancer">🚀 Freelancer</SelectItem>
                            <SelectItem value="Founder">🏢 Founder / Entrepreneur</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                )}

                {/* STEP 2: Technical Profile */}
                {step === 2 && (
                  <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-2 mb-4">
                      <Code className="w-5 h-5 text-purple-400" />
                      <h3 className="text-lg font-semibold">Technical Profile</h3>
                    </div>

                    <FormField control={form.control} name="experience_level" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coding Experience Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-zinc-800/50 border-zinc-700">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-zinc-900 text-white border-zinc-700">
                            <SelectItem value="Beginner">🌱 Beginner (0-1 years)</SelectItem>
                            <SelectItem value="Intermediate">📈 Intermediate (1-3 years)</SelectItem>
                            <SelectItem value="Advanced">⚡ Advanced (3-5 years)</SelectItem>
                            <SelectItem value="Expert">🏆 Expert (5+ years)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="primary_languages" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Languages</FormLabel>
                          <FormControl><Input placeholder="Python, JavaScript, Go" className="bg-zinc-800/50 border-zinc-700 focus:border-purple-500" {...field} /></FormControl>
                          <FormDescription className="text-xs text-zinc-500">Comma separated</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="tech_stack_skills" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tech Stack / Skills</FormLabel>
                          <FormControl><Input placeholder="React, Node.js, AWS" className="bg-zinc-800/50 border-zinc-700 focus:border-purple-500" {...field} /></FormControl>
                          <FormDescription className="text-xs text-zinc-500">Comma separated</FormDescription>
                        </FormItem>
                      )} />
                    </div>

                    <div className="space-y-3 pt-2">
                      <FormLabel className="text-zinc-400 uppercase text-xs tracking-wider">Social Profiles</FormLabel>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <FormField control={form.control} name="github_link" render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <Input placeholder="GitHub Profile URL" className="bg-zinc-800/50 border-zinc-700 pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="linkedin_link" render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <Input placeholder="LinkedIn Profile URL" className="bg-zinc-800/50 border-zinc-700 pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="resume_url" render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <Input placeholder="Resume URL (Drive/Dropbox)" className="bg-zinc-800/50 border-zinc-700 pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="portfolio_url" render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <Input placeholder="Portfolio Website" className="bg-zinc-800/50 border-zinc-700 pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </div>

                    <FormField control={form.control} name="prior_experience" render={({ field }) => (
                      <FormItem className="flex items-center gap-3 space-y-0 bg-zinc-800/30 p-4 rounded-xl border border-zinc-700">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} className="border-zinc-600" />
                        </FormControl>
                        <div>
                          <FormLabel className="text-sm font-medium">Prior Hackathon Experience</FormLabel>
                          <FormDescription className="text-xs text-zinc-500">Have you participated in hackathons before?</FormDescription>
                        </div>
                      </FormItem>
                    )} />
                  </div>
                )}

                {/* STEP 3: Team Setup */}
                {step === 3 && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-5 h-5 text-purple-400" />
                      <h3 className="text-lg font-semibold">Team Setup</h3>
                    </div>

                    <div className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-700 mb-4">
                      <p className="text-xs text-zinc-400">
                        Team size: <strong className="text-white">{event.min_team_size} - {event.max_team_size} members</strong>
                        {event.allow_solo && <span className="ml-2">(Solo participation allowed)</span>}
                      </p>
                    </div>

                    <FormField control={form.control} name="participation_type" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Participation Type</FormLabel>
                        <div className="grid grid-cols-2 gap-4">
                          {event.allow_solo && (
                            <div
                              onClick={() => field.onChange("Solo")}
                              className={cn(
                                "p-4 rounded-xl border-2 cursor-pointer transition-all",
                                field.value === "Solo" 
                                  ? "border-purple-500 bg-purple-500/10" 
                                  : "border-zinc-700 hover:border-zinc-500"
                              )}
                            >
                              <User className="w-8 h-8 text-purple-400 mb-2" />
                              <h4 className="font-semibold">Solo</h4>
                              <p className="text-xs text-zinc-500">Participate alone</p>
                            </div>
                          )}
                          <div
                            onClick={() => field.onChange("Team")}
                            className={cn(
                              "p-4 rounded-xl border-2 cursor-pointer transition-all",
                              field.value === "Team" 
                                ? "border-purple-500 bg-purple-500/10" 
                                : "border-zinc-700 hover:border-zinc-500",
                              !event.allow_solo && "col-span-2"
                            )}
                          >
                            <Users className="w-8 h-8 text-purple-400 mb-2" />
                            <h4 className="font-semibold">Team</h4>
                            <p className="text-xs text-zinc-500">Build with others</p>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {watchParticipation === 'Team' && (
                      <div className="space-y-4 pt-4 border-t border-zinc-800">
                        <FormField control={form.control} name="team_name" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Team Name</FormLabel>
                            <FormControl><Input placeholder="e.g. Code Ninjas" className="bg-zinc-800/50 border-zinc-700 focus:border-purple-500" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <FormLabel>Invite Team Members</FormLabel>
                            {canAddMoreMembers && (
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={() => append({ name: "", email: "", mobile: "", role: "Member" })} 
                                className="h-8 text-xs border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                              >
                                <Plus className="w-3 h-3 mr-1" /> Add Member
                              </Button>
                            )}
                          </div>
                          
                          <p className="text-xs text-zinc-500">
                            Team members will receive an email invitation to complete their registration.
                          </p>

                          {fields.length === 0 && (
                            <div className="text-center py-8 border border-dashed border-zinc-700 rounded-xl">
                              <Users className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                              <p className="text-sm text-zinc-500">No team members added yet</p>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => append({ name: "", email: "", mobile: "", role: "Member" })}
                                className="mt-2 text-purple-400"
                              >
                                <Plus className="w-4 h-4 mr-1" /> Add your first member
                              </Button>
                            </div>
                          )}

                          {fields.map((field, index) => (
                            <div key={field.id} className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700 space-y-3">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                                  Member {index + 1}
                                </Badge>
                                <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} className="h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <FormField control={form.control} name={`team_members.${index}.name`} render={({ field }) => (
                                  <FormItem>
                                    <FormControl><Input placeholder="Full Name" className="bg-zinc-900 border-zinc-600" {...field} /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                                <FormField control={form.control} name={`team_members.${index}.email`} render={({ field }) => (
                                  <FormItem>
                                    <FormControl><Input placeholder="Email Address" type="email" className="bg-zinc-900 border-zinc-600" {...field} /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                                <FormField control={form.control} name={`team_members.${index}.mobile`} render={({ field }) => (
                                  <FormItem>
                                    <FormControl><Input placeholder="Mobile (Optional)" className="bg-zinc-900 border-zinc-600" {...field} /></FormControl>
                                  </FormItem>
                                )} />
                                <FormField control={form.control} name={`team_members.${index}.role`} render={({ field }) => (
                                  <FormItem>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger className="bg-zinc-900 border-zinc-600">
                                          <SelectValue placeholder="Role" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent className="bg-zinc-900 text-white border-zinc-700">
                                        <SelectItem value="Member">Team Member</SelectItem>
                                        <SelectItem value="Developer">Developer</SelectItem>
                                        <SelectItem value="Designer">Designer</SelectItem>
                                        <SelectItem value="PM">Project Manager</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormItem>
                                )} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 4: Hackathon Details */}
                {step === 4 && (
                  <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="w-5 h-5 text-purple-400" />
                      <h3 className="text-lg font-semibold">Hackathon Details</h3>
                    </div>

                    {tracks.length > 0 && (
                      <FormField control={form.control} name="preferred_track" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Track</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-zinc-800/50 border-zinc-700">
                                <SelectValue placeholder="Select a track" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-zinc-900 text-white border-zinc-700">
                              {tracks.map((track: string) => (
                                <SelectItem key={track} value={track}>{track}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}

                    <FormField control={form.control} name="motivation_answer" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Why do you want to participate in this hackathon?</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Share your motivation, what you hope to build, and what makes you excited about this hackathon..." 
                            className="bg-zinc-800/50 border-zinc-700 min-h-[120px] focus:border-purple-500" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-zinc-500">
                          Min 20 characters. This helps organizers understand participants better.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Dynamic Custom Questions from Backend */}
                    {customQuestions.map((q: any) => (
                      <FormField 
                        key={q.id} 
                        control={form.control} 
                        name={`custom_answers.${q.id}`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{q.question} {q.required && <span className="text-red-400">*</span>}</FormLabel>
                            <FormControl>
                              {q.type === 'textarea' ? (
                                <Textarea className="bg-zinc-800/50 border-zinc-700" {...field} />
                              ) : q.type === 'select' && q.options ? (
                                <Select onValueChange={field.onChange}>
                                  <SelectTrigger className="bg-zinc-800/50 border-zinc-700">
                                    <SelectValue placeholder="Select an option" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-zinc-900 text-white border-zinc-700">
                                    {q.options.map((opt: string) => (
                                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input className="bg-zinc-800/50 border-zinc-700" {...field} />
                              )}
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                )}

                {/* STEP 5: Agreement & Payment */}
                {step === 5 && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="w-5 h-5 text-purple-400" />
                      <h3 className="text-lg font-semibold">Agreement & {event.is_paid ? 'Payment' : 'Submit'}</h3>
                    </div>

                    {event.is_paid && (
                      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-6 rounded-xl border border-purple-500/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-zinc-400">Registration Fee</p>
                            <p className="text-3xl font-bold text-white">{event.currency} {event.registration_fee}</p>
                          </div>
                          <Lock className="w-10 h-10 text-purple-400" />
                        </div>
                        <p className="text-xs text-zinc-500 mt-2">Payment will be processed after form submission</p>
                      </div>
                    )}

                    <div className="space-y-4">
                      <FormField control={form.control} name="agreed_to_rules" render={({ field }) => (
                        <FormItem className="flex items-start gap-3 space-y-0 bg-zinc-800/30 p-4 rounded-xl border border-zinc-700">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} className="border-zinc-600 mt-0.5" />
                          </FormControl>
                          <div className="space-y-1">
                            <FormLabel className="text-sm font-medium">
                              I agree to the <a href={event.rules_document_url || "#"} target="_blank" className="text-purple-400 underline">Hackathon Rules & Code of Conduct</a>
                            </FormLabel>
                            <FormDescription className="text-xs text-zinc-500">
                              You must follow all rules and guidelines set by the organizers.
                            </FormDescription>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="agreed_to_privacy" render={({ field }) => (
                        <FormItem className="flex items-start gap-3 space-y-0 bg-zinc-800/30 p-4 rounded-xl border border-zinc-700">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} className="border-zinc-600 mt-0.5" />
                          </FormControl>
                          <div className="space-y-1">
                            <FormLabel className="text-sm font-medium">
                              I agree to the <a href="/privacy-policy" target="_blank" className="text-purple-400 underline">Privacy Policy</a>
                            </FormLabel>
                            <FormDescription className="text-xs text-zinc-500">
                              Your data will be shared with event organizers for communication purposes.
                            </FormDescription>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 border-t border-zinc-800">
                  {step > 1 ? (
                    <Button type="button" variant="outline" onClick={prevStep} className="border-zinc-700 hover:bg-zinc-800">
                      <ChevronLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                  ) : <div />}

                  {step < totalSteps ? (
                    <Button type="button" onClick={nextStep} className="bg-purple-500 hover:bg-purple-600">
                      Continue <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 min-w-[140px]">
                      {isSubmitting ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                      ) : event.is_paid ? (
                        <><Lock className="w-4 h-4 mr-2" /> Register & Pay</>
                      ) : (
                        <><CheckCircle2 className="w-4 h-4 mr-2" /> Complete Registration</>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}