import React, { useState } from 'react';
import { useGroups } from '@/contexts/GroupContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Globe, Lock } from 'lucide-react';

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ open, onOpenChange }) => {
  const { createGroup } = useGroups();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    privacy: 'public' as 'public' | 'private',
  });
  const [loading, setLoading] = useState(false);

  const categories = [
    'Technology',
    'Gaming',
    'Lifestyle',
    'Education',
    'Sports',
    'Arts',
    'Business',
    'Health & Fitness',
    'Travel',
    'Food & Cooking',
    'Music',
    'Books & Literature',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim() || !formData.category) {
      return;
    }

    setLoading(true);
    try {
      await createGroup(formData);
      setFormData({
        name: '',
        description: '',
        category: '',
        privacy: 'public',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create group:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogDescription>
            Create a group to connect with people who share your interests.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name *</Label>
            <Input
              id="name"
              placeholder="Enter group name..."
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Tell people what this group is about..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              required
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Privacy Setting</Label>
            <RadioGroup
              value={formData.privacy}
              onValueChange={(value) => handleInputChange('privacy', value)}
              className="space-y-2"
            >
              <Card className="cursor-pointer hover:bg-muted/50">
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="public" id="public" />
                    <div className="flex items-center gap-2 flex-1">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label htmlFor="public" className="cursor-pointer font-medium">
                          Public
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Anyone can find and join this group
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:bg-muted/50">
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="private" id="private" />
                    <div className="flex items-center gap-2 flex-1">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label htmlFor="private" className="cursor-pointer font-medium">
                          Private
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          People must request to join
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </RadioGroup>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.name.trim() || !formData.description.trim() || !formData.category}
              className="flex-1"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};