import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { InterestCard } from '@/components/discovery/InterestCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, Compass } from 'lucide-react'

const interests = [
  {
    title: "Art & Photography",
    image: "/placeholder.svg3d13f4e4-d8c0-48c5-9898-9e45c0420127.png",
    description: "Capture the beauty of nature",
    memberCount: "2.1k members"
  },
  {
    title: "Hiking",
    image: "/placeholder.svg3d4b1b28-9c6f-4c29-b562-8266bbdd4184.png", 
    description: "Trails and outdoor adventures",
    memberCount: "3.4k members"
  },
  {
    title: "Cooking",
    image: "/placeholder.svge1bb5b7d-4237-4311-bcda-208af7ba4130.png",
    description: "Campfire recipes and outdoor cooking",
    memberCount: "1.8k members"
  },
  {
    title: "Books",
    image: "/placeholder.svgd420f065-3dc0-48c5-aa56-5238aca58d8e.png",
    description: "Stories by the firelight",
    memberCount: "956 members"
  }
]

const nearbyLocations = [
  {
    name: "Pacific Northwest",
    image: "/placeholder.svgbf7a08d4-aa03-4aee-ac3b-8caaa0a4c9fc.png",
    description: "Misty forests and mountain trails"
  },
  {
    name: "Rocky Mountains", 
    image: "/placeholder.svg3d13f4e4-d8c0-48c5-9898-9e45c0420127.png",
    description: "Towering peaks and alpine lakes"
  },
  {
    name: "Coastal Redwoods",
    image: "/placeholder.svg3d4b1b28-9c6f-4c29-b562-8266bbdd4184.png",
    description: "Ancient giants and foggy trails"
  }
]

const featuredCreators = [
  {
    name: "Jane Peterson",
    username: "jane_p",
    avatar: "/placeholder.svgaf5371a5-13cf-445f-8757-a7ed3d74ff98.png",
    bio: "Nature photographer capturing the essence of wilderness",
    followers: "1.2k"
  },
  {
    name: "Alex Chen",
    username: "alexoutdoors",
    avatar: "/placeholder.svgbf7a08d4-aa03-4aee-ac3b-8caaa0a4c9fc.png",
    bio: "Trail guide and outdoor educator",
    followers: "892"
  }
]

export default function Discovery() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-0 md:ml-60 pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Compass className="h-8 w-8 text-accent-warm" />
              <div>
                <h1 className="text-2xl font-semibold text-text-light">Discovery</h1>
                <p className="text-text-light/60">Find your tribe under the pines</p>
              </div>
            </div>
            
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-light/60" />
              <Input 
                placeholder="Search interests, places, or people..."
                className="pl-10 bg-bg-pine border-ink-muted text-text-light placeholder:text-text-light/40"
              />
            </div>
          </div>

          {/* Interests Section */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-text-light">Interests</h2>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {interests.map((interest) => (
                <InterestCard
                  key={interest.title}
                  title={interest.title}
                  image={interest.image}
                  description={interest.description}
                  memberCount={interest.memberCount}
                  className="fade-in"
                />
              ))}
            </div>
          </section>

          {/* Nearby Section */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-text-light">Nearby</h2>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {nearbyLocations.map((location) => (
                <InterestCard
                  key={location.name}
                  title={location.name}
                  image={location.image}
                  description={location.description}
                  className="fade-in"
                />
              ))}
            </div>
          </section>

          {/* Creator Spotlight */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-text-light">Creator Spotlight</h2>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {featuredCreators.map((creator) => (
                <Card key={creator.username} className="bg-card border-ink-muted fade-in">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={creator.avatar} />
                        <AvatarFallback className="bg-accent-warm text-bg-dark text-lg">
                          {creator.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-card-foreground">
                          {creator.name}
                        </h3>
                        <p className="text-card-foreground/60 text-sm mb-2">
                          @{creator.username} • {creator.followers} followers
                        </p>
                        <p className="text-card-foreground/80 text-sm mb-4">
                          {creator.bio}
                        </p>
                        
                        <Button size="sm" className="bg-accent-warm hover:bg-accent-warm/90">
                          Follow
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>
      
      <MobileNav />
    </div>
  )
}