import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { MapPin, Globe, Shield, Code2, Users, ArrowRight, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

const About = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    navigate('/');
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-primary/30 font-sans overflow-x-hidden">
      <Header session={session} onLogout={handleLogout} />

      <main className="pt-24 pb-16">
        {/* --- HERO SECTION --- */}
        <section className="relative px-6 md:px-12 lg:px-24 py-12 md:py-20 max-w-7xl mx-auto">
          {/* Background Gradient Blob */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
          
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="relative z-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-medium tracking-wider mb-6">
              <Globe className="w-3 h-3" />
              <span>GLOBAL HEADQUARTERS: USA</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Forging the <br />
              <span className="font-neuropol text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
                Future of Code
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl leading-relaxed">
              CodeVo is an advanced development ecosystem built for the modern engineer. 
              Born in the United States, we are redefining how the world learns, compiles, and ships software.
            </p>
          </motion.div>
        </section>

        {/* --- STATS / LOCATIONS --- */}
        <section className="border-y border-white/5 bg-[#0c0c0e]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 grid grid-cols-1 md:grid-cols-3 gap-12">
            
            <motion.div 
              initial={{ opacity: 0 }} 
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex flex-col gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Based in USA</h3>
                <p className="text-sm text-gray-400">
                  Headquartered in the epicenter of tech innovation, compliant with global standards.
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }} 
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="flex flex-col gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">100K+ Developers</h3>
                <p className="text-sm text-gray-400">
                  A thriving community of engineers building the next generation of applications.
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }} 
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="flex flex-col gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Enterprise Grade</h3>
                <p className="text-sm text-gray-400">
                  Secure, scalable infrastructure trusted by top institutions and companies.
                </p>
              </div>
            </motion.div>

          </div>
        </section>

        {/* --- STORY / MISSION --- */}
        <section className="max-w-7xl mx-auto px-6 md:px-12 py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            <div className="space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold font-neuropol">
                Our Mission
              </h2>
              <div className="space-y-6 text-gray-300 leading-relaxed">
                <p>
                  At CodeVo, we believe that coding is the closest thing we have to a superpower. 
                  However, the tools used to teach and practice this skill have remained stagnant for decades.
                </p>
                <p>
                  We founded CodeVo in the US with a singular obsession: <b>latency</b>. We wanted to remove 
                  the friction between thought and execution. Whether you are compiling C++ or training a 
                  Python model, our infrastructure ensures that your browser feels like a local machine.
                </p>
                <p>
                  Today, we serve a global audience, bridging the gap between academic theory and 
                  industrial reality.
                </p>
              </div>
              
              <div className="pt-4">
                <Button 
                  onClick={() => navigate('/auth')} 
                  className="h-12 px-8 bg-white text-black hover:bg-gray-200 font-bold rounded-xl"
                >
                  Join the Movement <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* Visual Block */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 blur-3xl -z-10 rounded-full" />
              <div className="relative aspect-square rounded-3xl overflow-hidden border border-white/10 bg-[#0c0c0e] shadow-2xl">
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px]" />
                 
                 {/* Abstract Map Graphic */}
                 <div className="absolute inset-0 flex items-center justify-center opacity-40">
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/2/2c/US_map_blank.svg" 
                      alt="USA Map" 
                      className="w-3/4 h-3/4 object-contain invert opacity-50 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
                    />
                 </div>

                 {/* Location Pin */}
                 <div className="absolute top-1/3 left-1/4 flex flex-col items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping absolute" />
                    <div className="w-3 h-3 bg-blue-500 rounded-full relative z-10 border border-black shadow-[0_0_15px_#3b82f6]" />
                    <div className="mt-2 px-3 py-1 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg text-[10px] font-mono text-white">
                      US-EAST-1
                    </div>
                 </div>
              </div>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
};

export default About;
