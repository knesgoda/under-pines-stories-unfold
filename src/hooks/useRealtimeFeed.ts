import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Post } from '@/lib/posts';

export interface RealtimeFeedOptions {
  onNewPost?: (post: Post) => void;
  onPostUpdate?: (post: Post) => void;
  onPostDelete?: (postId: string) => void;
  onReactionUpdate?: (postId: string, reactionCounts: Record<string, number>) => void;
}

export interface RealtimeFeedResult {
  newPostsCount: number;
  showNewPostsBanner: boolean;
  clearNewPosts: () => void;
  prependNewPosts: () => void;
}

export function useRealtimeFeed({
  onNewPost,
  onPostUpdate,
  onPostDelete,
  onReactionUpdate
}: RealtimeFeedOptions = {}): RealtimeFeedResult {
  const { user } = useAuth();
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [showNewPostsBanner, setShowNewPostsBanner] = useState(false);
  const [newPosts, setNewPosts] = useState<Post[]>([]);

  const clearNewPosts = useCallback(() => {
    setNewPostsCount(0);
    setShowNewPostsBanner(false);
    setNewPosts([]);
  }, []);

  const prependNewPosts = useCallback(() => {
    if (newPosts.length > 0) {
      newPosts.forEach(post => onNewPost?.(post));
      clearNewPosts();
    }
  }, [newPosts, onNewPost, clearNewPosts]);

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to new posts
    const postsSubscription = supabase
      .channel('feed-posts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: `user_id=neq.${user.id}` // Don't show own posts as "new"
        },
        async (payload) => {
          const post = payload.new;
          
          // Fetch full post data with author info
          const { data: fullPost } = await supabase
            .from('posts')
            .select(`
              id,
              body,
              created_at,
              author_id,
              media,
              profiles!posts_author_id_fkey(
                username,
                display_name,
                avatar_url
              )
            `)
            .eq('id', post.id)
            .single();

          if (fullPost) {
            const formattedPost: Post = {
              id: fullPost.id,
              author_id: fullPost.author_id,
              body: fullPost.body,
              created_at: fullPost.created_at,
              like_count: 0,
              share_count: 0,
              comment_count: 0,
              is_deleted: false,
              media: Array.isArray(fullPost.media) ? fullPost.media as any[] : [],
              has_media: Array.isArray(fullPost.media) && fullPost.media.length > 0,
              profiles: {
                username: fullPost.profiles.username,
                display_name: fullPost.profiles.display_name,
                avatar_url: fullPost.profiles.avatar_url
              },
              liked_by_user: false
            };

            setNewPosts(prev => [formattedPost, ...prev]);
            setNewPostsCount(prev => prev + 1);
            setShowNewPostsBanner(true);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          const post = payload.new;
          onPostUpdate?.(post as Post);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          const post = payload.old;
          onPostDelete?.(post.id);
        }
      )
      .subscribe();

    // Subscribe to reaction changes
    const reactionsSubscription = supabase
      .channel('feed-reactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_reactions'
        },
        async (payload) => {
          const reaction = payload.new || payload.old;
          if (!reaction) return;

        if (reaction && typeof reaction === 'object' && 'post_id' in reaction) {
          // Fetch updated reaction counts for the post
          const { data: reactions } = await supabase
            .from('post_reactions')
            .select('emoji')
            .eq('post_id', reaction.post_id as string);

          if (reactions) {
            const counts: Record<string, number> = {};
            reactions.forEach(r => {
              counts[r.emoji] = (counts[r.emoji] || 0) + 1;
            });
            
            onReactionUpdate?.(reaction.post_id as string, counts);
          }
        }
        }
      )
      .subscribe();

    return () => {
      postsSubscription.unsubscribe();
      reactionsSubscription.unsubscribe();
    };
  }, [user?.id, onNewPost, onPostUpdate, onPostDelete, onReactionUpdate]);

  return {
    newPostsCount,
    showNewPostsBanner,
    clearNewPosts,
    prependNewPosts
  };
}
