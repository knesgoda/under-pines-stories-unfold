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
import { Separator } from '@/components/ui/separator';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Globe, Lock, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Group } from '@/lib/localStorage';

interface GroupSettingsProps {
  group: Group;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export const GroupSettings: React.FC<GroupSettingsProps> = ({ 
  group, 
  open, 
  onOpenChange, 
  onUpdate 
}) => {
  const navigate = useNavigate();
  const { updateGroup, deleteGroup } = useGroups();
  const [formData, setFormData] = useState({
    name: group.name,
    description: group.description,
    category: group.category,
    privacy: group.privacy,
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
    if (!formData.name.trim() || !formData.description.trim()) {
      return;
    }

    setLoading(true);
    try {
      await updateGroup(group.id, formData);
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update group:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const success = await deleteGroup(group.id);
      if (success) {
        onOpenChange(false);
        navigate('/groups');
      }
    } catch (error) {
      console.error('Failed to delete group:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const hasChanges = 
    formData.name !== group.name ||
    formData.description !== group.description ||
    formData.category !== group.category ||
    formData.privacy !== group.privacy;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Group Settings</DialogTitle>
          <DialogDescription>
            Update your group information and settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              required
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
              <SelectTrigger>
                <SelectValue />
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
                    <RadioGroupItem value="public" id="public-edit" />
                    <div className="flex items-center gap-2 flex-1">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label htmlFor="public-edit" className="cursor-pointer font-medium">
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
                    <RadioGroupItem value="private" id="private-edit" />
                    <div className="flex items-center gap-2 flex-1">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label htmlFor="private-edit" className="cursor-pointer font-medium">
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
              disabled={loading || !hasChanges || !formData.name.trim() || !formData.description.trim()}
              className="flex-1"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>

        <Separator />

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-destructive mb-2">Danger Zone</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete this group. This action cannot be undone.
            </p>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={loading}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Group
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Group</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{group.name}"? This will permanently remove the group and all its data. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Group
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};