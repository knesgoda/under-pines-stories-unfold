import { Button } from "@/components/ui/button";
import { ArrowRight, TreePine, Shield, Users } from "lucide-react";
import heroImage from "@/assets/hero-forest.jpg";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${heroImage})`,
        }}
      >
        <div className="absolute inset-0 hero-gradient opacity-80"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8 animate-fade-in">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Privacy-First Social Network
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground mb-6 animate-fade-in-up">
            Connect Under
            <br />
            <span className="under-pines-gradient bg-clip-text text-transparent">
              The Pines
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in-up">
            An invite-only social platform where authentic connections grow naturally.
            No ads, no data exploitation—just genuine community.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 animate-scale-in">
            <Button size="lg" variant="hero" className="text-lg px-8 py-4">
              Request Invite
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="pine" className="text-lg px-8 py-4">
              Learn More
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 animate-slide-in-right">
            <div className="glass-effect rounded-xl p-6 text-center border border-primary/20">
              <div className="w-12 h-12 rounded-lg under-pines-gradient mx-auto mb-4 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-primary-foreground mb-2">
                Privacy First
              </h3>
              <p className="text-primary-foreground/80">
                Your data stays yours. No tracking, no ads, no exploitation.
              </p>
            </div>

            <div className="glass-effect rounded-xl p-6 text-center border border-primary/20">
              <div className="w-12 h-12 rounded-lg under-pines-gradient mx-auto mb-4 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-primary-foreground mb-2">
                Curated Community
              </h3>
              <p className="text-primary-foreground/80">
                Invite-only system ensures quality connections and meaningful interactions.
              </p>
            </div>

            <div className="glass-effect rounded-xl p-6 text-center border border-primary/20">
              <div className="w-12 h-12 rounded-lg under-pines-gradient mx-auto mb-4 flex items-center justify-center">
                <TreePine className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-primary-foreground mb-2">
                Natural Growth
              </h3>
              <p className="text-primary-foreground/80">
                Organic discovery and authentic relationships, just like nature intended.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-gentle-bounce">
        <div className="w-6 h-10 border-2 border-primary-foreground/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary-foreground/50 rounded-full mt-2 animate-float"></div>
        </div>
      </div>
    </section>
  );
}