import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronUp, Send, Github, Linkedin, Mail, Twitter, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function HitMeUpWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 w-[350px] sm:w-[380px] bg-[#050505] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header / Profile Section */}
            <div className="p-6 border-b border-white/5 bg-[#0a0a0a]">
                <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white font-sans tracking-tight">Let's Connect</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">
                        Have a project in mind or just want to say hi?
                    </p>
                </div>

                {/* Profile Card */}
                <div className="mt-6 flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 p-[1.5px] shrink-0">
                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                            <span className="text-sm font-bold text-white">CV</span> 
                        </div>
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-sm">Team Codevo</h4>
                        <p className="text-[10px] text-blue-400 font-mono">@codevo_official</p>
                    </div>
                </div>

                {/* Social Actions */}
                <div className="flex gap-2 mt-4">
                    {[Github, Linkedin, Twitter, Mail].map((Icon, i) => (
                        <Button key={i} variant="outline" size="icon" className="w-8 h-8 rounded-full border-white/10 bg-white/5 hover:bg-white hover:text-black hover:border-transparent transition-all">
                            <Icon className="w-3.5 h-3.5" />
                        </Button>
                    ))}
                </div>
            </div>

            {/* Contact Form Section */}
            <div className="p-6 bg-black">
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Your Name</label>
                        <Input className="bg-[#111] border-white/10 focus:border-white/30 h-10 rounded-lg text-white placeholder:text-zinc-600 text-sm" placeholder="John Doe" />
                    </div>
                    
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
                        <Input className="bg-[#111] border-white/10 focus:border-white/30 h-10 rounded-lg text-white placeholder:text-zinc-600 text-sm" placeholder="john@example.com" />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Message</label>
                        <Textarea className="bg-[#111] border-white/10 focus:border-white/30 min-h-[100px] rounded-lg text-white resize-none placeholder:text-zinc-600 p-3 text-sm" placeholder="How can we help you today?" />
                    </div>

                    <Button className="w-full h-10 bg-white text-black hover:bg-zinc-200 font-bold rounded-lg text-xs tracking-wide mt-2 transition-transform active:scale-[0.98]">
                        Send Message <Send className="w-3 h-3 ml-2" />
                    </Button>
                </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-white text-black rounded-full shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:bg-zinc-200 transition-all duration-300 flex items-center justify-center group z-50"
        aria-label="Toggle widget"
      >
        <div className="relative w-6 h-6">
            <motion.div
                initial={false}
                animate={{ rotate: isOpen ? 180 : 0, opacity: isOpen ? 0 : 1 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center"
            >
                <ChevronUp className="w-6 h-6" />
            </motion.div>
            <motion.div
                initial={false}
                animate={{ rotate: isOpen ? 0 : -180, opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center"
            >
                <X className="w-6 h-6" />
            </motion.div>
        </div>
      </button>
    </div>
  );
}
