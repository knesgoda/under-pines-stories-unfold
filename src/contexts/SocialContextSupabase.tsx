import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Post {
  id: string;
  user_id: string;
  content: string;
  privacy: string;
  tags: string[] | null;
  media_urls: string[] | null;
  location: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  profiles?: any;
  likes?: any[];
  comments?: any[];
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  updated_at: string;
  profiles?: any;
}

interface SocialContextType {
  posts: Post[];
  friends: Friendship[];
  friendRequests: Friendship[];
  isLoading: boolean;
  createPost: (content: string, privacy?: 'public' | 'friends' | 'private', media_urls?: string[]) => Promise<boolean>;
  deletePost: (postId: string) => Promise<boolean>;
  toggleLike: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string, parentId?: string) => Promise<boolean>;
  deleteComment: (commentId: string) => Promise<boolean>;
  sendFriendRequest: (userId: string) => Promise<boolean>;
  acceptFriendRequest: (friendshipId: string) => Promise<boolean>;
  rejectFriendRequest: (friendshipId: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
}

const SocialContext = createContext<SocialContextType | null>(null);

export const useSocial = () => {
  const context = useContext(SocialContext);
  if (!context) {
    throw new Error('useSocial must be used within a SocialProvider');
  }
  return context;
};

export const SocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [friendRequests, setFriendRequests] = useState<Friendship[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      refreshData();
      
      // Subscribe to real-time updates
      const postsSubscription = supabase
        .channel('posts_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
          refreshData();
        })
        .subscribe();

      const likesSubscription = supabase
        .channel('likes_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => {
          refreshData();
        })
        .subscribe();

      const commentsSubscription = supabase
        .channel('comments_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => {
          refreshData();
        })
        .subscribe();

      const friendshipsSubscription = supabase
        .channel('friendships_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => {
          refreshData();
        })
        .subscribe();

      return () => {
        postsSubscription.unsubscribe();
        likesSubscription.unsubscribe();
        commentsSubscription.unsubscribe();
        friendshipsSubscription.unsubscribe();
      };
    }
  }, [user]);

  const refreshData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Load posts with profile information
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            username,
            display_name,
            avatar_url
          ),
          likes (
            user_id
          ),
          comments (
            id,
            content,
            user_id,
            created_at,
            profiles:user_id (
              username,
              display_name,
              avatar_url
            )
          )
        `)
        .eq('privacy', 'public')
        .order('created_at', { ascending: false })
        .limit(50);

      if (postsError) {
        console.error('Error loading posts:', postsError);
      } else {
        setPosts(postsData || []);
      }

      // Load friendships with profile information
      const { data: friendshipsData, error: friendshipsError } = await supabase
        .from('friendships')
        .select(`
          *,
          profiles:addressee_id (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('requester_id', user.id)
        .eq('status', 'accepted');

      if (friendshipsError) {
        console.error('Error loading friendships:', friendshipsError);
      } else {
        setFriends(friendshipsData || []);
      }

      // Load friend requests with profile information
      const { data: requestsData, error: requestsError } = await supabase
        .from('friendships')
        .select(`
          *,
          profiles:requester_id (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('addressee_id', user.id)
        .eq('status', 'pending');

      if (requestsError) {
        console.error('Error loading friend requests:', requestsError);
      } else {
        setFriendRequests(requestsData || []);
      }

    } catch (error) {
      console.error('Error refreshing social data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createPost = async (content: string, privacy: 'public' | 'friends' | 'private' = 'public', media_urls?: string[]): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content,
          privacy,
          media_urls: media_urls || null,
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create post",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Post created successfully",
      });

      await refreshData();
      return true;
    } catch (error) {
      console.error('Error creating post:', error);
      return false;
    }
  };

  const deletePost = async (postId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete post",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Post deleted successfully",
      });

      await refreshData();
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      return false;
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;

    try {
      // Check if user has already liked this post
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike the post
        await supabase
          .from('likes')
          .delete()
          .eq('id', existingLike.id);
      } else {
        // Like the post
        await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id,
          });

        // Create notification for post owner
        const post = posts.find(p => p.id === postId);
        if (post && post.user_id !== user.id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: post.user_id,
              type: 'like',
              title: 'New Like',
              message: `${user.display_name || user.username} liked your post`,
              related_user_id: user.id,
              related_post_id: postId,
            });
        }
      }

      await refreshData();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const addComment = async (postId: string, content: string, parentId?: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
          parent_id: parentId || null,
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add comment",
          variant: "destructive",
        });
        return false;
      }

      // Create notification for post owner
      const post = posts.find(p => p.id === postId);
      if (post && post.user_id !== user.id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: post.user_id,
            type: 'comment',
            title: 'New Comment',
            message: `${user.display_name || user.username} commented on your post`,
            related_user_id: user.id,
            related_post_id: postId,
          });
      }

      await refreshData();
      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      return false;
    }
  };

  const deleteComment = async (commentId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete comment",
          variant: "destructive",
        });
        return false;
      }

      await refreshData();
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  };

  const sendFriendRequest = async (userId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          requester_id: user.id,
          addressee_id: userId,
          status: 'pending',
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to send friend request",
          variant: "destructive",
        });
        return false;
      }

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'friend_request',
          title: 'Friend Request',
          message: `${user.display_name || user.username} sent you a friend request`,
          related_user_id: user.id,
        });

      toast({
        title: "Success",
        description: "Friend request sent",
      });

      await refreshData();
      return true;
    } catch (error) {
      console.error('Error sending friend request:', error);
      return false;
    }
  };

  const acceptFriendRequest = async (friendshipId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to accept friend request",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Friend request accepted",
      });

      await refreshData();
      return true;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      return false;
    }
  };

  const rejectFriendRequest = async (friendshipId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to reject friend request",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Friend request rejected",
      });

      await refreshData();
      return true;
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      return false;
    }
  };

  const value: SocialContextType = {
    posts,
    friends,
    friendRequests,
    isLoading,
    createPost,
    deletePost,
    toggleLike,
    addComment,
    deleteComment,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    refreshData,
  };

  return (
    <SocialContext.Provider value={value}>
      {children}
    </SocialContext.Provider>
  );
};