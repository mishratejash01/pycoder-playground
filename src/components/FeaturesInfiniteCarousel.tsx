import { 
  Trophy, 
  Flame, 
  Terminal, 
  Target, 
  BookOpen, 
  UserCircle, 
  ArrowUpRight 
} from "lucide-react"

// Define the feature data
const features = [
  {
    title: "SEAL Leaderboards: Expert Evaluations",
    label: "Leaderboards",
    icon: Trophy,
    status: "active"
  },
  {
    title: "Maintain Streak: Keep Your Code Alive",
    label: "Consistency",
    icon: Flame,
    status: "active"
  },
  {
    title: "Online Compiler: Instant Execution",
    label: "IDE",
    icon: Terminal,
    status: "active"
  },
  {
    title: "Competitions: Win Rewards & Honor",
    label: "Challenges",
    icon: Target,
    status: "active"
  },
  {
    title: "Tech Blog: Community Tutorials",
    label: "Insights",
    icon: BookOpen,
    status: "coming_soon"
  },
  {
    title: "Profile Card: Showcase Stats",
    label: "Identity",
    icon: UserCircle,
    status: "active"
  }
];

export function FeaturesInfiniteCarousel() {
  return (
    <div className="w-full py-[60px] overflow-hidden bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]">
      
      {/* Inject custom animation styles specifically for this component */}
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-features {
          animation: scroll 40s linear infinite;
        }
        .carousel-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="flex w-max animate-scroll-features carousel-track">
        {/* We map the data twice to create the seamless infinite loop effect */}
        {[...features, ...features].map((feature, index) => (
          <div 
            key={index} 
            className="group w-[550px] h-[280px] mx-[15px] bg-[#0d0d0e] rounded-[32px] border border-[#1f1f21] flex items-center relative px-[40px] shrink-0 transition-all duration-300 hover:border-[#333] hover:-translate-y-1"
          >
            {/* Icon Box */}
            <div className="w-[140px] h-[140px] shrink-0 flex justify-center items-center relative">
              <feature.icon 
                className="w-full h-full text-white/90 drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]" 
                strokeWidth={1}
              />
            </div>

            {/* Content */}
            <div className="ml-[30px] flex flex-col gap-2">
              <span className="text-[#d1a5ff] text-[18px] font-medium capitalize">
                {feature.label}
              </span>
              
              <h3 className="text-white text-[32px] font-semibold leading-[1.1] m-0">
                {feature.title.split(': ')[0]} <br/>
                <span className="text-[0.8em] opacity-80 font-normal">
                   {feature.title.split(': ')[1]}
                </span>
              </h3>

              {feature.status === "coming_soon" && (
                <div className="mt-[10px] w-fit px-3 py-1 rounded-[20px] border border-white/10 bg-white/5 text-[#88888e] text-[12px]">
                  Coming Soon
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="absolute bottom-[30px] right-[30px] w-[50px] h-[50px] bg-[#2a2a2c] rounded-full flex justify-center items-center transition-colors duration-300 group-hover:bg-white">
              <ArrowUpRight className="w-[24px] h-[24px] text-[#888] stroke-[2.5] transition-colors duration-300 group-hover:text-black" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
