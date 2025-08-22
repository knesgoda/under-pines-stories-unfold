import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Bug, Lightbulb, ThumbsUp, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const BetaFeedbackButton: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState({
    type: 'general' as 'bug' | 'feature' | 'general' | 'praise',
    title: '',
    description: '',
    email: user?.email || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const feedbackTypes = [
    { id: 'bug', label: 'Bug Report', icon: Bug, color: 'destructive' },
    { id: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'secondary' },
    { id: 'general', label: 'General Feedback', icon: MessageSquare, color: 'default' },
    { id: 'praise', label: 'Praise', icon: ThumbsUp, color: 'secondary' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.title.trim() || !feedback.description.trim()) return;

    setIsSubmitting(true);
    
    try {
      // In a real app, this would send to your feedback API
      // For now, we'll just simulate success and log the feedback
      console.log('Beta Feedback Submitted:', {
        ...feedback,
        userId: user?.id,
        userEmail: user?.email,
        timestamp: new Date().toISOString()
      });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Feedback Submitted!",
        description: "Thank you for helping us improve Under Pines. We'll review your feedback soon.",
      });
      
      // Reset form
      setFeedback({
        type: 'general',
        title: '',
        description: '',
        email: user?.email || ''
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Please try again or contact support directly.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = feedbackTypes.find(type => type.id === feedback.type);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 z-50 shadow-lg bg-background/95 backdrop-blur-sm border-primary/20 hover:bg-primary/5"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Beta Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-primary" />
            Beta Feedback
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Feedback Type */}
          <div className="space-y-3">
            <Label>Feedback Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {feedbackTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.id}
                    type="button"
                    variant={feedback.type === type.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFeedback({ ...feedback, type: type.id as any })}
                    className="justify-start h-auto p-3"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    <span className="text-xs">{type.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder={`Brief summary of your ${selectedType?.label.toLowerCase()}...`}
              value={feedback.title}
              onChange={(e) => setFeedback({ ...feedback, title: e.target.value })}
              maxLength={100}
              required
            />
            <p className="text-xs text-muted-foreground">
              {feedback.title.length}/100 characters
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder={
                feedback.type === 'bug'
                  ? "What happened? What did you expect to happen? Steps to reproduce..."
                  : feedback.type === 'feature'
                  ? "Describe the feature you'd like to see and how it would help..."
                  : "Share your thoughts, suggestions, or any other feedback..."
              }
              value={feedback.description}
              onChange={(e) => setFeedback({ ...feedback, description: e.target.value })}
              rows={4}
              maxLength={1000}
              required
            />
            <p className="text-xs text-muted-foreground">
              {feedback.description.length}/1000 characters
            </p>
          </div>

          {/* Contact Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Contact Email (Optional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={feedback.email}
              onChange={(e) => setFeedback({ ...feedback, email: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              We'll only use this to follow up on your feedback if needed
            </p>
          </div>

          {/* Beta Badge */}
          <div className="flex items-center justify-center pt-2">
            <Badge variant="secondary" className="text-xs">
              🚀 Under Pines Beta - Your feedback helps us improve!
            </Badge>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!feedback.title.trim() || !feedback.description.trim() || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                'Submitting...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};