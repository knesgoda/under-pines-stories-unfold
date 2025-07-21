import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Post, User } from '@/lib/localStorage';
import { Trash2, TreePine } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocial } from '@/contexts/SocialContext';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: Post;
  author: User;
}

export const PostCard: React.FC<PostCardProps> = ({ post, author }) => {
  const { user } = useAuth();
  const { deletePost } = useSocial();

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      await deletePost(post.id);
    }
  };

  const canDelete = user?.id === post.userId;

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
              <p className="text-xs text-muted-foreground">@{author.username}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
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
      <CardContent className="pt-0">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center space-x-1 text-muted-foreground">
            <TreePine className="h-4 w-4" />
            <span className="text-xs">Under Pines</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};