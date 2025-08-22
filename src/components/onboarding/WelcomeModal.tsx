import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TreePine, X, CheckCircle, Users, MessageCircle, Camera } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [profileData, setProfileData] = useState({
    bio: user?.bio || '',
    location: user?.location || '',
    interests: user?.interests || [],
  });
  
  const [interestInput, setInterestInput] = useState('');

  const predefinedInterests = [
    'Nature', 'Hiking', 'Photography', 'Adventure', 'Forest', 'Wildlife',
    'Camping', 'Reading', 'Music', 'Art', 'Travel', 'Cooking',
    'Technology', 'Sports', 'Gaming', 'Writing', 'Fitness', 'Movies'
  ];

  const addInterest = (interest: string) => {
    if (!profileData.interests.includes(interest)) {
      setProfileData({
        ...profileData,
        interests: [...profileData.interests, interest]
      });
    }
  };

  const removeInterest = (interest: string) => {
    setProfileData({
      ...profileData,
      interests: profileData.interests.filter(i => i !== interest)
    });
  };

  const addCustomInterest = () => {
    if (interestInput.trim() && !profileData.interests.includes(interestInput.trim())) {
      addInterest(interestInput.trim());
      setInterestInput('');
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      const success = await updateProfile(profileData);
      if (success) {
        toast({
          title: "Profile updated!",
          description: "Welcome to Under Pines! Your profile has been set up.",
        });
        onClose();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <TreePine className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
          Welcome to Under Pines!
        </h2>
        <p className="text-muted-foreground">
          A cozy social space where you can connect with nature lovers, share your adventures, 
          and build meaningful friendships under the digital canopy.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        <div className="p-4 rounded-lg bg-muted/30 space-y-2">
          <Users className="h-6 w-6 text-primary" />
          <h3 className="font-semibold text-sm">Connect with Friends</h3>
          <p className="text-xs text-muted-foreground">
            Find like-minded people and build lasting connections
          </p>
        </div>
        <div className="p-4 rounded-lg bg-muted/30 space-y-2">
          <Camera className="h-6 w-6 text-primary" />
          <h3 className="font-semibold text-sm">Share Your Adventures</h3>
          <p className="text-xs text-muted-foreground">
            Post photos and stories from your outdoor experiences
          </p>
        </div>
        <div className="p-4 rounded-lg bg-muted/30 space-y-2">
          <MessageCircle className="h-6 w-6 text-primary" />
          <h3 className="font-semibold text-sm">Join Communities</h3>
          <p className="text-xs text-muted-foreground">
            Participate in groups based on your interests
          </p>
        </div>
      </div>

      <Button onClick={() => setStep(2)} className="w-full">
        Let's Get Started
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Complete Your Profile</h3>
        <p className="text-sm text-muted-foreground">
          Help others get to know you better by sharing a bit about yourself
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            placeholder="Tell us about yourself, your interests, and what brings you to Under Pines..."
            value={profileData.bio}
            onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">
            {profileData.bio.length}/500 characters
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location (Optional)</Label>
          <Input
            id="location"
            placeholder="e.g., San Francisco, CA"
            value={profileData.location}
            onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
            maxLength={100}
          />
        </div>

        <div className="space-y-3">
          <Label>Interests</Label>
          <p className="text-xs text-muted-foreground">
            Select or add interests to help others discover you
          </p>
          
          {/* Current interests */}
          {profileData.interests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profileData.interests.map((interest) => (
                <Badge
                  key={interest}
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeInterest(interest)}
                >
                  {interest} <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}

          {/* Predefined interests */}
          <div className="space-y-2">
            <p className="text-xs font-medium">Popular interests:</p>
            <div className="flex flex-wrap gap-2">
              {predefinedInterests
                .filter(interest => !profileData.interests.includes(interest))
                .slice(0, 12)
                .map((interest) => (
                  <Badge
                    key={interest}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => addInterest(interest)}
                  >
                    {interest}
                  </Badge>
                ))}
            </div>
          </div>

          {/* Custom interest input */}
          <div className="flex space-x-2">
            <Input
              placeholder="Add custom interest..."
              value={interestInput}
              onChange={(e) => setInterestInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomInterest())}
              maxLength={30}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCustomInterest}
              disabled={!interestInput.trim()}
            >
              Add
            </Button>
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
          Back
        </Button>
        <Button 
          onClick={handleSaveProfile} 
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? 'Saving...' : 'Complete Setup'}
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={() => {}} modal>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center space-x-2">
            <TreePine className="h-6 w-6 text-primary" />
            <span className="bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              Under Pines
            </span>
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? renderStep1() : renderStep2()}

        {/* Progress indicator */}
        <div className="flex justify-center space-x-2 mt-6">
          {[1, 2].map((stepNumber) => (
            <div
              key={stepNumber}
              className={`h-2 w-8 rounded-full transition-smooth ${
                stepNumber <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};