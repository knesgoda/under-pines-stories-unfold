import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Users, 
  MessageCircle, 
  Image, 
  UserCheck, 
  Globe,
  Heart,
  Star
} from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: Shield,
      title: "End-to-End Privacy",
      description: "Your conversations and content are protected with advanced encryption. We never read, analyze, or sell your personal data.",
    },
    {
      icon: Users,
      title: "Invite-Only Community",
      description: "Quality over quantity. Members can only join through personal invitations, creating a trusted network of genuine connections.",
    },
    {
      icon: MessageCircle,
      title: "Meaningful Conversations",
      description: "Focus on what matters. No algorithmic manipulation or engagement farming—just authentic discussions with people you care about.",
    },
    {
      icon: Image,
      title: "Rich Content Sharing",
      description: "Share photos, videos, and thoughts with beautiful, distraction-free presentation. Your content, your way.",
    },
    {
      icon: UserCheck,
      title: "Smart Friend Management",
      description: "Intuitive friend requests, interest-based discovery, and powerful privacy controls for your social circle.",
    },
    {
      icon: Globe,
      title: "Global Yet Personal",
      description: "Connect with like-minded individuals worldwide while maintaining intimate, close-knit community experiences.",
    },
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
            <Star className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Platform Features</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Built for Authentic
            <br />
            <span className="under-pines-gradient bg-clip-text text-transparent">
              Social Connection
            </span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Every feature is designed with your privacy, security, and genuine relationships in mind.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="card-gradient border border-border/50 p-8 hover:pine-shadow-medium transition-smooth group"
            >
              <div className="w-12 h-12 rounded-xl under-pines-gradient flex items-center justify-center mb-6 group-hover:pine-glow transition-smooth">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              
              <h3 className="text-xl font-semibold text-foreground mb-4">
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <div className="glass-effect rounded-2xl p-8 md:p-12 border border-primary/20 max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <Heart className="w-8 h-8 text-primary animate-gentle-bounce" />
            </div>
            
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Ready to Join Our Community?
            </h3>
            
            <p className="text-lg text-muted-foreground mb-8">
              Request an invitation and become part of a social network that values genuine connections over viral content.
            </p>
            
            <Button size="lg" variant="pine" className="text-lg px-8 py-4">
              Request Your Invite
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}