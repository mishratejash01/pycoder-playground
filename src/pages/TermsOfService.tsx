import { ScrollArea } from '@/components/ui/scroll-area';
import { ShieldCheck, Scale, Gavel, AlertCircle } from 'lucide-react';
import { Header } from '@/components/Header';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const TermsOfService = () => {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans selection:bg-primary/20">
      <Header session={session} onLogout={() => supabase.auth.signOut()} />
      
      <div className="container mx-auto px-4 md:px-6 py-24 max-w-4xl">
        <div className="mb-12 border-b border-white/10 pb-8">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white">
              Terms of Service
            </h1>
            <p className="text-muted-foreground text-lg">
              Last Updated: December 14, 2025
            </p>
        </div>

        <div className="space-y-12 text-gray-300 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Scale className="w-6 h-6 text-primary" /> 1. Acceptance of Terms
            </h2>
            <p>
              By accessing and using the CodeVo platform ("Service"), you agree to be bound by these Terms of Service. 
              CodeVo provides an integrated development environment, exam proctoring systems, and educational resources. 
              If you disagree with any part of these terms, you may not access the Service.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary" /> 2. Academic Integrity & Proctoring
            </h2>
            <p>
              Our platform utilizes advanced proctoring mechanisms including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Real-time browser focus tracking and tab-switch detection.</li>
                <li>Audio and video environment monitoring during active exam sessions.</li>
                <li>Automated plagiarism detection on code submissions.</li>
            </ul>
            <div className="bg-red-950/20 border border-red-900/50 p-4 rounded-lg mt-4">
                <h4 className="text-red-400 font-bold mb-1 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Zero Tolerance Policy
                </h4>
                <p className="text-sm text-red-200/70">
                    Any attempt to bypass security measures, inject malicious code, or engage in academic dishonesty 
                    will result in immediate account termination and reporting to relevant educational institutions.
                </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Gavel className="w-6 h-6 text-primary" /> 3. Intellectual Property
            </h2>
            <p>
              The Service and its original content (excluding user-generated code submissions), features, and functionality 
              are and will remain the exclusive property of CodeVo and its licensors. The "CodeVo" name, logo, and 
              "Enterprise Exam Suite" branding are trademarks of CodeVo.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">4. User Responsibilities</h2>
            <p>
                You are responsible for safeguarding the password that you use to access the Service and for any activities 
                or actions under your password. You agree not to disclose your password to any third party.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">5. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of the State of California, United States, 
              without regard to its conflict of law provisions.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
