import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from "@/components/ui/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { AuthModal } from "@/components/auth/AuthModal";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    if (user) {
      // Check if this is a new user (no bio or interests set up)
      const isNewUser = !user.bio && (!user.interests || user.interests.length === 0);
      
      if (isNewUser) {
        setShowWelcomeModal(true);
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  const handleWelcomeComplete = () => {
    setShowWelcomeModal(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen">
      <Navigation onAuthClick={() => setShowAuthModal(true)} />
      <HeroSection onGetStarted={() => setShowAuthModal(true)} />
      <FeaturesSection />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <WelcomeModal isOpen={showWelcomeModal} onClose={handleWelcomeComplete} />
    </div>
  );
};

export default Index;
