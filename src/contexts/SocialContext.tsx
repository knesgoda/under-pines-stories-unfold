import React, { createContext, useContext, useState, useEffect } from 'react';
import { Post, User, FriendRequest, postStorage, userStorage, friendRequestStorage, friendshipStorage } from '@/lib/localStorage';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';

interface SocialContextType {
  posts: Post[];
  friends: User[];
  friendRequests: FriendRequest[];
  isLoading: boolean;
  createPost: (content: string) => Promise<boolean>;
  deletePost: (postId: string) => Promise<boolean>;
  sendFriendRequest: (toUserId: string) => Promise<boolean>;
  acceptFriendRequest: (requestId: string) => Promise<boolean>;
  rejectFriendRequest: (requestId: string) => Promise<boolean>;
  refreshData: () => void;
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
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = () => {
    if (!user) {
      setPosts([]);
      setFriends([]);
      setFriendRequests([]);
      return;
    }

    // Load all posts (in real app, this would be filtered by user's network)
    const allPosts = postStorage.getAll();
    setPosts(allPosts);

    // Load user's friends
    const friendIds = friendshipStorage.getFriends(user.id);
    const friendUsers = friendIds.map(id => userStorage.getById(id)).filter(Boolean) as User[];
    setFriends(friendUsers);

    // Load friend requests for current user
    const requests = friendRequestStorage.getByUserId(user.id).filter(req => req.status === 'pending');
    setFriendRequests(requests);
  };

  useEffect(() => {
    refreshData();
  }, [user]);

  const createPost = async (content: string): Promise<boolean> => {
    if (!user || !content.trim()) return false;

    try {
      setIsLoading(true);
      postStorage.create({
        userId: user.id,
        content: content.trim(),
      });
      
      refreshData();
      toast({
        title: "Post Created",
        description: "Your post has been shared!",
      });
      
      return true;
    } catch (error) {
      console.error('Create post error:', error);
      toast({
        title: "Post Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deletePost = async (postId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      setIsLoading(true);
      const deleted = postStorage.delete(postId);
      
      if (deleted) {
        refreshData();
        toast({
          title: "Post Deleted",
          description: "Your post has been removed",
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Delete post error:', error);
      toast({
        title: "Delete Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const sendFriendRequest = async (toUserId: string): Promise<boolean> => {
    if (!user || user.id === toUserId) return false;

    try {
      setIsLoading(true);
      
      // Check if already friends
      if (friendshipStorage.areFriends(user.id, toUserId)) {
        toast({
          title: "Already Friends",
          description: "You are already friends with this user",
        });
        return false;
      }

      // Check if request already exists
      const existingRequests = friendRequestStorage.getAll();
      const existingRequest = existingRequests.find(req => 
        ((req.fromUserId === user.id && req.toUserId === toUserId) ||
         (req.fromUserId === toUserId && req.toUserId === user.id)) &&
        req.status === 'pending'
      );

      if (existingRequest) {
        toast({
          title: "Request Already Sent",
          description: "A friend request is already pending",
        });
        return false;
      }

      friendRequestStorage.create(user.id, toUserId);
      refreshData();
      
      const targetUser = userStorage.getById(toUserId);
      toast({
        title: "Friend Request Sent",
        description: `Friend request sent to ${targetUser?.displayName || 'user'}`,
      });
      
      return true;
    } catch (error) {
      console.error('Send friend request error:', error);
      toast({
        title: "Request Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const acceptFriendRequest = async (requestId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      setIsLoading(true);
      
      const request = friendRequestStorage.getAll().find(req => req.id === requestId);
      if (!request || request.toUserId !== user.id) return false;

      // Update request status
      friendRequestStorage.updateStatus(requestId, 'accepted');
      
      // Create friendship
      friendshipStorage.create(request.fromUserId, request.toUserId);
      
      refreshData();
      
      const fromUser = userStorage.getById(request.fromUserId);
      toast({
        title: "Friend Request Accepted",
        description: `You are now friends with ${fromUser?.displayName || 'user'}`,
      });
      
      return true;
    } catch (error) {
      console.error('Accept friend request error:', error);
      toast({
        title: "Accept Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const rejectFriendRequest = async (requestId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      setIsLoading(true);
      
      const request = friendRequestStorage.getAll().find(req => req.id === requestId);
      if (!request || request.toUserId !== user.id) return false;

      friendRequestStorage.updateStatus(requestId, 'rejected');
      refreshData();
      
      toast({
        title: "Friend Request Rejected",
        description: "The friend request has been declined",
      });
      
      return true;
    } catch (error) {
      console.error('Reject friend request error:', error);
      toast({
        title: "Reject Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const value: SocialContextType = {
    posts,
    friends,
    friendRequests,
    isLoading,
    createPost,
    deletePost,
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