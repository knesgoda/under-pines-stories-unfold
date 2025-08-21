import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Post, User, Comment } from '@/lib/localStorage';
import { Trash2, TreePine, Heart, MessageCircle, Share, Globe, Users, Lock, MoreHorizontal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocial } from '@/contexts/SocialContext';
import { formatDistanceToNow } from 'date-fns';
import { commentStorage, notificationStorage, userStorage } from '@/lib/localStorage';
import { toast } from '@/hooks/use-toast';

interface PostCardProps {
  post: Post;
  author: User;
}

export const PostCard: React.FC<PostCardProps> = ({ post, author }) => {
  const { user } = useAuth();
  const { deletePost, toggleLike, refreshData } = useSocial();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const isLiked = user ? post.likes.includes(user.id) : false;
  const canDelete = user?.id === post.userId;

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      await deletePost(post.id);
    }
  };

  const handleLike = async () => {
    if (!user) return;
    const success = await toggleLike(post.id);
    
    if (success && !isLiked && user.id !== post.userId) {
      // Create notification for post author
      notificationStorage.create({
        userId: post.userId,
        fromUserId: user.id,
        type: 'like',
        postId: post.id,
        message: `${user.display_name} liked your post`,
        isRead: false,
        priority: 'medium'
      });
    }
  };

  const loadComments = async () => {
    if (!showComments) {
      setIsLoadingComments(true);
      const postComments = commentStorage.getByPostId(post.id);
      setComments(postComments);
      setIsLoadingComments(false);
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return;

    try {
      const comment = commentStorage.create({
        postId: post.id,
        userId: user.id,
        content: newComment.trim(),
      });

      setComments(prev => [...prev, comment]);
      setNewComment('');
      refreshData();

      // Create notification for post author
      if (user.id !== post.userId) {
        notificationStorage.create({
          userId: post.userId,
          fromUserId: user.id,
          type: 'comment',
          postId: post.id,
          message: `${user.display_name} commented on your post`,
          isRead: false,
          priority: 'medium'
        });
      }

      toast({
        title: "Comment added",
        description: "Your comment has been posted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
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
                {author.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{author.displayName}</p>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span>@{author.username}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
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
        {post.media && post.media.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {post.media.map((media) => (
              <div key={media.id} className="rounded-lg overflow-hidden">
                {media.type === 'image' ? (
                  <img
                    src={media.url}
                    alt={media.alt || media.filename}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-muted flex items-center justify-center rounded-lg">
                    <span className="text-sm font-medium">{media.filename}</span>
                  </div>
                )}
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
              {post.likes.length}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={loadComments}
              className="h-8 px-3 transition-smooth"
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              {post.commentCount}
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
                    disabled={!newComment.trim()}
                  >
                    Post
                  </Button>
                </div>
              </div>
            )}

            {/* Comments List */}
            {isLoadingComments ? (
              <p className="text-sm text-muted-foreground">Loading comments...</p>
            ) : comments.length > 0 ? (
              <div className="space-y-3">
                {comments.map((comment) => {
                  const commentAuthor = userStorage.getById(comment.userId);
                  if (!commentAuthor) return null;

                  return (
                    <div key={comment.id} className="flex space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                          {commentAuthor.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-muted rounded-lg p-3">
                          <p className="font-semibold text-sm">{commentAuthor.displayName}</p>
                          <p className="text-sm mt-1">{comment.content}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
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