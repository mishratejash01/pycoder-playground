import * as React from "react"
import Autoplay from "embla-carousel-autoplay"
import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { Badge } from "@/components/ui/badge"
import { 
  Flame, 
  Terminal, 
  Trophy, 
  Medal, 
  BookOpen, 
  UserCircle 
} from "lucide-react"

export function FeaturesInfiniteCarousel() {
  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false })
  )

  const features = [
    {
      title: "Maintain Streak",
      icon: Flame,
      description: "Keep your coding consistency alive day by day.",
      status: "active"
    },
    {
      title: "Online Compiler",
      icon: Terminal,
      description: "Run and test your code instantly in the browser.",
      status: "active"
    },
    {
      title: "Competitions",
      icon: Trophy,
      description: "Participate in contests and win rewards.",
      status: "active"
    },
    {
      title: "Global Ranks",
      icon: Medal,
      description: "See where you stand among top developers.",
      status: "active"
    },
    {
      title: "Tech Blog",
      icon: BookOpen,
      description: "Latest insights and tutorials from the community.",
      status: "coming_soon"
    },
    {
      title: "Profile Card",
      icon: UserCircle,
      description: "Showcase your stats and achievements.",
      status: "active"
    }
  ]

  return (
    <div className="w-full py-10 bg-black border-t border-white/5">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        plugins={[plugin.current]}
        className="w-full max-w-7xl mx-auto px-4"
      >
        <CarouselContent className="-ml-4">
          {features.map((feature, index) => (
            <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
              <div className="p-1 h-full">
                <Card className="h-full border-white/10 bg-[#0a0a0a] hover:border-white/20 transition-all duration-300 relative overflow-hidden group">
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center h-[200px] gap-3">
                    <div className="p-3 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors duration-300">
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight text-white">{feature.title}</h3>
                    {feature.status === "coming_soon" ? (
                      <Badge variant="secondary" className="mt-2 bg-white/10 text-gray-400 hover:bg-white/20">
                        Coming Soon
                      </Badge>
                    ) : (
                      <p className="text-sm text-gray-400 leading-relaxed">
                        {feature.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
