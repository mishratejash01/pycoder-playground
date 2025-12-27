import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { Loader2, CheckCircle2, ChevronRight, ChevronLeft, User, Video, Shield, Mail, Phone, Building, MapPin, Lock, MonitorPlay } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface WebinarEvent {
  id: string;
  title: string;
  custom_questions: { id: string; question: string; required: boolean; type: 'text' | 'textarea' | 'select'; options?: string[] }[];
  is_paid: boolean;
  registration_fee: number;
  currency: string;
}

interface WebinarRegistrationModalProps {
  event: WebinarEvent;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  full_name: z.string().min(2, "Name is required").max(100),
  email: z.string().email("Invalid email").max(255),
  mobile_number: z.string().min(10, "Valid mobile required").max(20),
  college_org_name: z.string().min(2, "Required").max(200),
  current_status: z.enum(['Student', 'Working Professional', 'Freelancer', 'Founder']),
  country_city: z.string().min(2, "Location required").max(100),
  timezone: z.string().min(1, "Please select your timezone"),
  how_did_you_hear: z.string().optional(),
  topics_of_interest: z.string().min(5, "Please share what interests you").max(300),
  questions_for_speaker: z.string().optional(),
  custom_answers: z.record(z.string()).optional(),
  agreed_to_rules: z.boolean().refine(val => val === true, "You must agree to the terms"),
  agreed_to_privacy: z.boolean().refine(val => val === true, "You must agree to privacy policy"),
});

type FormValues = z.infer<typeof formSchema>;

const STEP_ICONS = [User, Video, Shield];
const STEP_TITLES = ["Personal Info", "Webinar Details", "Confirm"];

export function WebinarRegistrationModal({ event, isOpen, onOpenChange }: WebinarRegistrationModalProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const customQuestions = Array.isArray(event.custom_questions) ? event.custom_questions : [];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "", email: "", mobile_number: "", college_org_name: "", country_city: "",
      current_status: "Student", timezone: "Asia/Kolkata",
      how_did_you_hear: "", topics_of_interest: "", questions_for_speaker: "",
      custom_answers: {},
      agreed_to_rules: false, agreed_to_privacy: false,
    },
    mode: "onChange"
  });

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
          form.setValue('full_name', profile.full_name || '');
          form.setValue('mobile_number', profile.contact_no || '');
          form.setValue('college_org_name', profile.institute_name || '');
          form.setValue('country_city', profile.country || '');
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

    const registrationData = {
      event_id: event.id,
      user_id: session.user.id,
      full_name: values.full_name.trim(),
      email: values.email.trim().toLowerCase(),
      mobile_number: values.mobile_number.trim(),
      college_org_name: values.college_org_name.trim(),
      current_status: values.current_status,
      country_city: values.country_city.trim(),
      motivation_answer: `Timezone: ${values.timezone}\n\nTopics of Interest: ${values.topics_of_interest}\n\nQuestions for Speaker: ${values.questions_for_speaker || 'None'}\n\nHow they heard: ${values.how_did_you_hear || 'Not specified'}`,
      custom_answers: values.custom_answers || {},
      agreed_to_rules: values.agreed_to_rules,
      agreed_to_privacy: values.agreed_to_privacy,
      participation_type: 'Solo',
      team_role: 'Attendee',
      payment_status: event.is_paid ? 'pending' : 'exempt',
      status: event.is_paid ? 'pending_payment' : 'confirmed',
    };

    const { error } = await supabase
      .from('event_registrations')
      .insert(registrationData as any);

    if (error) {
      if (error.code === '23505') toast.error("You're already registered for this webinar!");
      else toast.error("Registration failed. Please try again.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setIsSuccess(true);
    toast.success("Webinar registration successful!");
  }

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormValues)[] = [];
    if (step === 1) fieldsToValidate = ['full_name', 'email', 'mobile_number', 'college_org_name', 'country_city', 'current_status'];
    if (step === 2) fieldsToValidate = ['timezone', 'topics_of_interest'];

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setStep(s => Math.min(s + 1, totalSteps));
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto bg-gradient-to-b from-zinc-900 to-black border border-violet-500/20 text-white p-0 gap-0">
        
        <div className="bg-gradient-to-r from-violet-900/30 to-purple-900/20 p-6 border-b border-white/5 sticky top-0 z-20 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                <MonitorPlay className="w-5 h-5" />
              </div>
              <div>
                <span className="block">{event.title}</span>
                <span className="text-xs font-normal text-violet-400">Webinar Registration</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {!isSuccess && (
            <div className="mt-6">
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
                        isActive ? "bg-violet-500 border-violet-400 shadow-lg shadow-violet-500/30" :
                        isCompleted ? "bg-green-500/20 border-green-500 text-green-400" :
                        "bg-zinc-800 border-zinc-700 text-zinc-500"
                      )}>
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <StepIcon className="w-4 h-4" />}
                      </div>
                      <span className={cn(
                        "text-[10px] mt-2 font-medium uppercase tracking-wide",
                        isActive ? "text-violet-400" : isCompleted ? "text-green-400" : "text-zinc-600"
                      )}>{title}</span>
                    </div>
                  );
                })}
              </div>
              
              <div className="w-full bg-zinc-800 h-1 mt-4 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-violet-500 to-purple-500 h-full transition-all duration-500" 
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
              <h3 className="text-3xl font-bold text-white mb-2">You're Registered! 📺</h3>
              <p className="text-zinc-400 mb-4 max-w-md">
                Registration for <strong className="text-white">{event.title}</strong> is {event.is_paid ? 'pending payment' : 'confirmed'}.
              </p>
              <p className="text-sm text-violet-400 mb-6">We'll send you a reminder and joining link before the webinar!</p>
              {event.is_paid && (
                <Button className="w-full mb-3 bg-gradient-to-r from-violet-500 to-purple-500 hover:opacity-90 font-bold">
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
                
                {step === 1 && (
                  <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="w-5 h-5 text-violet-400" />
                      <h3 className="text-lg font-semibold">Personal Information</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="full_name" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><User className="w-3 h-3" /> Full Name</FormLabel>
                          <FormControl><Input className="bg-zinc-800/50 border-zinc-700 focus:border-violet-500" placeholder="John Doe" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><Mail className="w-3 h-3" /> Email</FormLabel>
                          <FormControl><Input className="bg-zinc-800/50 border-zinc-700 focus:border-violet-500" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="mobile_number" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><Phone className="w-3 h-3" /> Mobile Number</FormLabel>
                          <FormControl><Input placeholder="+91 9876543210" className="bg-zinc-800/50 border-zinc-700 focus:border-violet-500" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="country_city" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><MapPin className="w-3 h-3" /> City, Country</FormLabel>
                          <FormControl><Input placeholder="New Delhi, India" className="bg-zinc-800/50 border-zinc-700 focus:border-violet-500" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <FormField control={form.control} name="college_org_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Building className="w-3 h-3" /> College / Organization</FormLabel>
                        <FormControl><Input placeholder="IIT Madras" className="bg-zinc-800/50 border-zinc-700 focus:border-violet-500" {...field} /></FormControl>
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

                {step === 2 && (
                  <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-2 mb-4">
                      <Video className="w-5 h-5 text-violet-400" />
                      <h3 className="text-lg font-semibold">Webinar Details</h3>
                    </div>

                    <FormField control={form.control} name="timezone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Timezone</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-zinc-800/50 border-zinc-700">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-zinc-900 text-white border-zinc-700">
                            <SelectItem value="Asia/Kolkata">🇮🇳 India (IST)</SelectItem>
                            <SelectItem value="America/New_York">🇺🇸 US East (EST)</SelectItem>
                            <SelectItem value="America/Los_Angeles">🇺🇸 US West (PST)</SelectItem>
                            <SelectItem value="Europe/London">🇬🇧 UK (GMT)</SelectItem>
                            <SelectItem value="Europe/Berlin">🇪🇺 Central Europe (CET)</SelectItem>
                            <SelectItem value="Asia/Singapore">🇸🇬 Singapore (SGT)</SelectItem>
                            <SelectItem value="Australia/Sydney">🇦🇺 Sydney (AEDT)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="topics_of_interest" render={({ field }) => (
                      <FormItem>
                        <FormLabel>What topics interest you most?</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="What specific topics or questions do you want the webinar to cover?" 
                            className="bg-zinc-800/50 border-zinc-700 min-h-[100px] focus:border-violet-500" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="questions_for_speaker" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Questions for the speaker (optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any specific questions you'd like answered during the Q&A?" 
                            className="bg-zinc-800/50 border-zinc-700 min-h-[80px] focus:border-violet-500" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="how_did_you_hear" render={({ field }) => (
                      <FormItem>
                        <FormLabel>How did you hear about this webinar? (optional)</FormLabel>
                        <Select onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="bg-zinc-800/50 border-zinc-700">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-zinc-900 text-white border-zinc-700">
                            <SelectItem value="social_media">Social Media</SelectItem>
                            <SelectItem value="email">Email Newsletter</SelectItem>
                            <SelectItem value="friend">Friend / Colleague</SelectItem>
                            <SelectItem value="search">Google Search</SelectItem>
                            <SelectItem value="community">Community / Discord</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

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
                                    <SelectValue placeholder="Select..." />
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="w-5 h-5 text-violet-400" />
                      <h3 className="text-lg font-semibold">Confirm Registration</h3>
                    </div>

                    <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700 space-y-3">
                      <h4 className="font-medium text-white">Registration Summary</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-zinc-500">Name:</span>
                        <span className="text-white">{form.getValues('full_name')}</span>
                        <span className="text-zinc-500">Email:</span>
                        <span className="text-white">{form.getValues('email')}</span>
                        <span className="text-zinc-500">Timezone:</span>
                        <span className="text-white">{form.getValues('timezone')}</span>
                      </div>
                    </div>

                    <FormField control={form.control} name="agreed_to_rules" render={({ field }) => (
                      <FormItem className="flex items-start gap-3 p-4 bg-zinc-800/30 rounded-lg border border-zinc-700">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-1 border-zinc-600" />
                        </FormControl>
                        <div className="flex-1">
                          <FormLabel className="text-sm font-medium cursor-pointer">
                            I agree to the webinar terms and code of conduct
                          </FormLabel>
                        </div>
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="agreed_to_privacy" render={({ field }) => (
                      <FormItem className="flex items-start gap-3 p-4 bg-zinc-800/30 rounded-lg border border-zinc-700">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-1 border-zinc-600" />
                        </FormControl>
                        <div className="flex-1">
                          <FormLabel className="text-sm font-medium cursor-pointer">
                            I agree to the privacy policy and data handling terms
                          </FormLabel>
                        </div>
                      </FormItem>
                    )} />
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t border-zinc-800">
                  {step > 1 ? (
                    <Button type="button" variant="ghost" onClick={prevStep} className="text-zinc-400 hover:text-white">
                      <ChevronLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                  ) : <div />}
                  
                  {step < totalSteps ? (
                    <Button type="button" onClick={nextStep} className="bg-gradient-to-r from-violet-500 to-purple-500 hover:opacity-90">
                      Continue <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-violet-500 to-purple-500 hover:opacity-90">
                      {isSubmitting ? <><Loader2 className="animate-spin w-4 h-4 mr-2" /> Registering...</> : 'Complete Registration'}
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
