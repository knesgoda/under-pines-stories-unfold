import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Send, Image, X, Lock, Users, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocial } from '@/contexts/SocialContextSupabase';

export const CreatePost: React.FC = () => {
  const { user } = useAuth();
  const { createPost, isLoading } = useSocial();
  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('public');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  if (!user) return null;

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const success = await createPost(content.trim(), privacy, tags.length > 0 ? tags : undefined);
    
    if (success) {
      setContent('');
      setTags([]);
      setPrivacy('public');
    }
  };

  const getPrivacyIcon = () => {
    switch (privacy) {
      case 'public': return <Globe className="h-4 w-4" />;
      case 'friends': return <Users className="h-4 w-4" />;
      case 'private': return <Lock className="h-4 w-4" />;
    }
  };

  return (
    <Card className="card-gradient pine-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Share your thoughts</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {user.display_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="What's on your mind under the pines?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px] resize-none border-0 shadow-none focus-visible:ring-0 p-0 text-sm"
                maxLength={1000}
              />

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      #{tag} <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}

              {/* Tag Input */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 text-sm bg-transparent border-0 focus:outline-none placeholder:text-muted-foreground"
                />
                {tagInput && (
                  <Button type="button" variant="ghost" size="sm" onClick={addTag}>
                    Add Tag
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <div className="flex items-center space-x-2">
                  <Select value={privacy} onValueChange={(value: any) => setPrivacy(value)}>
                    <SelectTrigger className="w-32 h-8">
                      <div className="flex items-center space-x-1">
                        {getPrivacyIcon()}
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4" />
                          <span>Public</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="friends">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>Friends</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center space-x-2">
                          <Lock className="h-4 w-4" />
                          <span>Private</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs text-muted-foreground">
                    {content.length}/1000
                  </span>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!content.trim() || isLoading}
                    className="transition-smooth"
                  >
                    {isLoading ? (
                      'Posting...'
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Post
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};