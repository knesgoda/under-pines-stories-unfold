import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  User, 
  Edit2, 
  Save, 
  X, 
  MapPin, 
  Globe, 
  Calendar, 
  Heart, 
  MessageCircle,
  UserPlus,
  Settings,
  Activity,
  Users,
  Camera
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { enhancedUserStorage, postStorage, friendshipStorage } from '@/lib/localStorage';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface EnhancedProfileProps {
  userId?: string;
}

const EnhancedProfile: React.FC<EnhancedProfileProps> = ({ userId }) => {
  const { user: currentUser, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    location: '',
    website: '',
    interests: [] as string[],
    isPrivate: false
  });

  const targetUser = userId ? enhancedUserStorage.getById(userId) : currentUser;
  const isOwnProfile = !userId || userId === currentUser?.id;

  React.useEffect(() => {
    if (targetUser) {
      setFormData({
        displayName: targetUser.displayName || '',
        bio: targetUser.bio || '',
        location: targetUser.location || '',
        website: targetUser.website || '',
        interests: targetUser.interests || [],
        isPrivate: targetUser.isPrivate || false
      });
    }
  }, [targetUser]);

  if (!targetUser) {
    return (
      <Card className="card-gradient pine-shadow">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">User not found</p>
        </CardContent>
      </Card>
    );
  }

  const handleSave = async () => {
    if (!isOwnProfile || !currentUser) return;
    
    try {
      const success = await updateProfile(formData);
      if (success) {
        setIsEditing(false);
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddInterest = (interest: string) => {
    if (interest.trim() && !formData.interests.includes(interest.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, interest.trim()]
      }));
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const getUserPosts = () => {
    return postStorage.getByUserId(targetUser.id);
  };

  const getUserFriends = () => {
    return friendshipStorage.getFriends(targetUser.id);
  };

  const userPosts = getUserPosts();
  const userFriends = getUserFriends();
  const isFriend = currentUser && !isOwnProfile ? 
    friendshipStorage.areFriends(currentUser.id, targetUser.id) : false;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="card-gradient pine-shadow">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-24 w-24 md:h-32 md:w-32">
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl md:text-4xl font-bold">
                    {targetUser.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && isEditing && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute -bottom-2 -right-2 h-8 w-8 p-0 rounded-full"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {!isOwnProfile && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  {!isFriend && (
                    <Button variant="default" size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Friend
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  {isEditing ? (
                    <Input
                      value={formData.displayName}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                      className="text-2xl font-bold h-auto border-none px-0 bg-transparent"
                      placeholder="Display name"
                    />
                  ) : (
                    <h1 className="text-2xl md:text-3xl font-bold">{targetUser.displayName}</h1>
                  )}
                  <p className="text-muted-foreground">@{targetUser.username}</p>
                </div>
                
                {isOwnProfile && (
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button onClick={handleSave} size="sm">
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsEditing(false)} 
                          size="sm"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditing(true)} 
                        size="sm"
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Bio */}
              <div>
                {isEditing ? (
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell people about yourself..."
                    className="resize-none"
                    rows={3}
                  />
                ) : (
                  targetUser.bio && (
                    <p className="text-foreground/80">{targetUser.bio}</p>
                  )
                )}
              </div>

              {/* Profile Details */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {(targetUser.location || isEditing) && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {isEditing ? (
                      <Input
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Location"
                        className="h-auto border-none px-0 bg-transparent text-sm"
                      />
                    ) : (
                      <span>{targetUser.location}</span>
                    )}
                  </div>
                )}
                
                {(targetUser.website || isEditing) && (
                  <div className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    {isEditing ? (
                      <Input
                        value={formData.website}
                        onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="Website"
                        className="h-auto border-none px-0 bg-transparent text-sm"
                      />
                    ) : (
                      <a href={targetUser.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                        {targetUser.website}
                      </a>
                    )}
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {formatDistanceToNow(new Date(targetUser.createdAt), { addSuffix: true })}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 text-sm">
                <div className="text-center">
                  <p className="font-bold text-lg">{userPosts.length}</p>
                  <p className="text-muted-foreground">Posts</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">{userFriends.length}</p>
                  <p className="text-muted-foreground">Friends</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">
                    {userPosts.reduce((total, post) => total + (post.likes?.length || 0), 0)}
                  </p>
                  <p className="text-muted-foreground">Likes</p>
                </div>
              </div>

              {/* Interests */}
              {(targetUser.interests?.length || isEditing) && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Interests</Label>
                  <div className="flex flex-wrap gap-2">
                    {formData.interests.map((interest, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-secondary/80"
                      >
                        {interest}
                        {isEditing && (
                          <X 
                            className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive" 
                            onClick={() => handleRemoveInterest(interest)}
                          />
                        )}
                      </Badge>
                    ))}
                    {isEditing && (
                      <Input
                        placeholder="Add interest..."
                        className="h-6 w-24 text-xs"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddInterest(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Tabs */}
      <Tabs defaultValue="posts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Friends
          </TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="posts">
          <Card className="card-gradient pine-shadow">
            <CardHeader>
              <CardTitle>Recent Posts</CardTitle>
            </CardHeader>
            <CardContent>
              {userPosts.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No posts yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userPosts.slice(0, 5).map((post) => (
                    <div key={post.id} className="p-4 border border-border/50 rounded-lg">
                      <p className="text-sm">{post.content}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {post.likes?.length || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {post.comments?.length || 0}
                        </span>
                        <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="friends">
          <Card className="card-gradient pine-shadow">
            <CardHeader>
              <CardTitle>Friends ({userFriends.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {userFriends.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No friends yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {userFriends.map((friend) => (
                    <div key={friend.id} className="flex flex-col items-center p-4 border border-border/50 rounded-lg hover:bg-muted/50 transition-smooth">
                      <Avatar className="h-12 w-12 mb-2">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {friend.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-medium text-sm text-center">{friend.displayName}</p>
                      <p className="text-xs text-muted-foreground">@{friend.username}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isOwnProfile && (
          <TabsContent value="settings">
            <Card className="card-gradient pine-shadow">
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="private-profile">Private Profile</Label>
                    <p className="text-sm text-muted-foreground">Only friends can see your posts and profile</p>
                  </div>
                  <Switch
                    id="private-profile"
                    checked={formData.isPrivate}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPrivate: checked }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default EnhancedProfile;