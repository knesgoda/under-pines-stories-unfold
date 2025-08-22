import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, TreePine, Heart, MessageCircle, Share, Globe, Users, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocial } from '@/contexts/SocialContextSupabase';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import type { Post } from '@/contexts/SocialContextSupabase';

interface PostCardProps {
  post: Post;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { user } = useAuth();
  const { deletePost, toggleLike, addComment } = useSocial();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  const isLiked = user && post.likes ? post.likes.some((like: any) => like.user_id === user.id) : false;
  const canDelete = user?.id === post.user_id;
  const author = post.profiles || { username: 'unknown', display_name: 'Unknown User', avatar_url: null };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      await deletePost(post.id);
    }
  };

  const handleLike = async () => {
    if (!user) return;
    await toggleLike(post.id);
  };

  const loadComments = async () => {
    setShowComments(!showComments);
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return;

    setIsAddingComment(true);
    try {
      const success = await addComment(post.id, newComment.trim());
      if (success) {
        setNewComment('');
        toast({
          title: "Comment added",
          description: "Your comment has been posted",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setIsAddingComment(false);
    }
  };

  const getPrivacyIcon = () => {
    switch (post.privacy) {
      case 'public': return <Globe className="h-3 w-3" />;
      case 'friends': return <Users className="h-3 w-3" />;
      case 'private': return <Lock className="h-3 w-3" />;
    }
  };

  return (
    <Card className="card-gradient pine-shadow transition-smooth hover:pine-shadow-medium">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {author.display_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{author.display_name}</p>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span>@{author.username}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  {getPrivacyIcon()}
                  <span className="capitalize">{post.privacy}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive transition-smooth"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
          
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Media */}
        {post.media_urls && post.media_urls.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {post.media_urls.map((url, index) => (
              <div key={index} className="rounded-lg overflow-hidden">
                <img
                  src={url}
                  alt={`Post media ${index + 1}`}
                  className="w-full h-48 object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`h-8 px-3 transition-smooth ${isLiked ? 'text-red-500 hover:text-red-600' : ''}`}
            >
              <Heart className={`h-4 w-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
              {post.likes_count || 0}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={loadComments}
              className="h-8 px-3 transition-smooth"
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              {post.comments_count || 0}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 transition-smooth"
            >
              <Share className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>
          
          <div className="flex items-center space-x-1 text-muted-foreground">
            <TreePine className="h-4 w-4" />
            <span className="text-xs">Under Pines</span>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="pt-3 border-t border-border/50 space-y-3">
            {/* Add Comment */}
            {user && (
              <div className="flex space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                    {user.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex space-x-2">
                  <Textarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[60px] text-sm"
                    maxLength={500}
                  />
                  <Button
                    size="sm"
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isAddingComment}
                  >
                    {isAddingComment ? 'Posting...' : 'Post'}
                  </Button>
                </div>
              </div>
            )}

            {/* Comments List */}
            {post.comments && post.comments.length > 0 ? (
              <div className="space-y-3">
                {post.comments.map((comment: any) => (
                  <div key={comment.id} className="flex space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                        {comment.profiles?.display_name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-muted rounded-lg p-3">
                        <p className="font-semibold text-sm">{comment.profiles?.display_name || 'Unknown User'}</p>
                        <p className="text-sm mt-1">{comment.content}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};