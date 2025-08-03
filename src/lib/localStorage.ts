// Local storage service for Under Pines social network
export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  likes: string[]; // Array of user IDs who liked
  commentCount: number;
  media?: MediaAttachment[];
  privacy: 'public' | 'friends' | 'private';
  tags?: string[];
}

export interface MediaAttachment {
  id: string;
  type: 'image' | 'video' | 'file';
  url: string;
  filename: string;
  size: number;
  alt?: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface Like {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string; // recipient
  fromUserId: string; // who triggered it
  type: 'like' | 'comment' | 'friend_request' | 'friend_accepted';
  entityId: string; // post id, friend request id, etc.
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Friendship {
  id: string;
  userId1: string;
  userId2: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  coverImage?: string;
  privacy: 'public' | 'private';
  category: string;
  createdBy: string;
  createdAt: string;
  memberCount: number;
  postCount: number;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: 'admin' | 'moderator' | 'member';
  joinedAt: string;
}

export interface GroupJoinRequest {
  id: string;
  groupId: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const STORAGE_KEYS = {
  USERS: 'under_pines_users',
  POSTS: 'under_pines_posts',
  COMMENTS: 'under_pines_comments',
  LIKES: 'under_pines_likes',
  NOTIFICATIONS: 'under_pines_notifications',
  FRIENDSHIPS: 'under_pines_friendships',
  FRIEND_REQUESTS: 'under_pines_friend_requests',
  GROUPS: 'under_pines_groups',
  GROUP_MEMBERS: 'under_pines_group_members',
  GROUP_JOIN_REQUESTS: 'under_pines_group_join_requests',
  CURRENT_USER: 'under_pines_current_user',
} as const;

// Generic storage functions
const getFromStorage = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveToStorage = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

// User management
export const userStorage = {
  getAll: (): User[] => getFromStorage<User>(STORAGE_KEYS.USERS),
  
  getById: (id: string): User | null => {
    const users = getFromStorage<User>(STORAGE_KEYS.USERS);
    return users.find(user => user.id === id) || null;
  },
  
  getByUsername: (username: string): User | null => {
    const users = getFromStorage<User>(STORAGE_KEYS.USERS);
    return users.find(user => user.username.toLowerCase() === username.toLowerCase()) || null;
  },
  
  getByEmail: (email: string): User | null => {
    const users = getFromStorage<User>(STORAGE_KEYS.USERS);
    return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
  },
  
  create: (userData: Omit<User, 'id' | 'createdAt'>): User => {
    const users = getFromStorage<User>(STORAGE_KEYS.USERS);
    const newUser: User = {
      ...userData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    saveToStorage(STORAGE_KEYS.USERS, users);
    return newUser;
  },
  
  update: (id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): User | null => {
    const users = getFromStorage<User>(STORAGE_KEYS.USERS);
    const index = users.findIndex(user => user.id === id);
    if (index === -1) return null;
    
    users[index] = { ...users[index], ...updates };
    saveToStorage(STORAGE_KEYS.USERS, users);
    return users[index];
  },
};

// Post management
export const postStorage = {
  getAll: (): Post[] => getFromStorage<Post>(STORAGE_KEYS.POSTS),
  
  getByUserId: (userId: string): Post[] => {
    const posts = getFromStorage<Post>(STORAGE_KEYS.POSTS);
    return posts.filter(post => post.userId === userId);
  },
  
  create: (postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'commentCount'>): Post => {
    const posts = getFromStorage<Post>(STORAGE_KEYS.POSTS);
    const newPost: Post = {
      ...postData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likes: [],
      commentCount: 0,
      privacy: postData.privacy || 'public',
      media: postData.media || [],
    };
    posts.unshift(newPost);
    saveToStorage(STORAGE_KEYS.POSTS, posts);
    return newPost;
  },
  
  update: (id: string, updates: Partial<Pick<Post, 'content'>>): Post | null => {
    const posts = getFromStorage<Post>(STORAGE_KEYS.POSTS);
    const index = posts.findIndex(post => post.id === id);
    if (index === -1) return null;
    
    posts[index] = { ...posts[index], ...updates, updatedAt: new Date().toISOString() };
    saveToStorage(STORAGE_KEYS.POSTS, posts);
    return posts[index];
  },
  
  delete: (id: string): boolean => {
    const posts = getFromStorage<Post>(STORAGE_KEYS.POSTS);
    const filteredPosts = posts.filter(post => post.id !== id);
    if (filteredPosts.length === posts.length) return false;
    
    saveToStorage(STORAGE_KEYS.POSTS, filteredPosts);
    return true;
  },
};

// Comment management
export const commentStorage = {
  getAll: (): Comment[] => getFromStorage<Comment>(STORAGE_KEYS.COMMENTS),
  
  getByPostId: (postId: string): Comment[] => {
    const comments = getFromStorage<Comment>(STORAGE_KEYS.COMMENTS);
    return comments.filter(comment => comment.postId === postId);
  },
  
  create: (commentData: Omit<Comment, 'id' | 'createdAt'>): Comment => {
    const comments = getFromStorage<Comment>(STORAGE_KEYS.COMMENTS);
    const newComment: Comment = {
      ...commentData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    comments.push(newComment);
    saveToStorage(STORAGE_KEYS.COMMENTS, comments);
    
    // Update post comment count
    const posts = getFromStorage<Post>(STORAGE_KEYS.POSTS);
    const postIndex = posts.findIndex(p => p.id === commentData.postId);
    if (postIndex !== -1) {
      posts[postIndex].commentCount += 1;
      saveToStorage(STORAGE_KEYS.POSTS, posts);
    }
    
    return newComment;
  },
  
  delete: (id: string): boolean => {
    const comments = getFromStorage<Comment>(STORAGE_KEYS.COMMENTS);
    const comment = comments.find(c => c.id === id);
    if (!comment) return false;
    
    const filteredComments = comments.filter(c => c.id !== id);
    saveToStorage(STORAGE_KEYS.COMMENTS, filteredComments);
    
    // Update post comment count
    const posts = getFromStorage<Post>(STORAGE_KEYS.POSTS);
    const postIndex = posts.findIndex(p => p.id === comment.postId);
    if (postIndex !== -1) {
      posts[postIndex].commentCount = Math.max(0, posts[postIndex].commentCount - 1);
      saveToStorage(STORAGE_KEYS.POSTS, posts);
    }
    
    return true;
  },
};

// Like management
export const likeStorage = {
  getAll: (): Like[] => getFromStorage<Like>(STORAGE_KEYS.LIKES),
  
  getByPostId: (postId: string): Like[] => {
    const likes = getFromStorage<Like>(STORAGE_KEYS.LIKES);
    return likes.filter(like => like.postId === postId);
  },
  
  toggle: (postId: string, userId: string): { liked: boolean; like: Like | null } => {
    const likes = getFromStorage<Like>(STORAGE_KEYS.LIKES);
    const existingLike = likes.find(like => like.postId === postId && like.userId === userId);
    
    if (existingLike) {
      // Unlike
      const filteredLikes = likes.filter(like => like.id !== existingLike.id);
      saveToStorage(STORAGE_KEYS.LIKES, filteredLikes);
      
      // Update post likes array
      const posts = getFromStorage<Post>(STORAGE_KEYS.POSTS);
      const postIndex = posts.findIndex(p => p.id === postId);
      if (postIndex !== -1) {
        posts[postIndex].likes = posts[postIndex].likes.filter(id => id !== userId);
        saveToStorage(STORAGE_KEYS.POSTS, posts);
      }
      
      return { liked: false, like: null };
    } else {
      // Like
      const newLike: Like = {
        id: crypto.randomUUID(),
        postId,
        userId,
        createdAt: new Date().toISOString(),
      };
      likes.push(newLike);
      saveToStorage(STORAGE_KEYS.LIKES, likes);
      
      // Update post likes array
      const posts = getFromStorage<Post>(STORAGE_KEYS.POSTS);
      const postIndex = posts.findIndex(p => p.id === postId);
      if (postIndex !== -1) {
        posts[postIndex].likes.push(userId);
        saveToStorage(STORAGE_KEYS.POSTS, posts);
      }
      
      return { liked: true, like: newLike };
    }
  },
};

// Notification management
export const notificationStorage = {
  getAll: (): Notification[] => getFromStorage<Notification>(STORAGE_KEYS.NOTIFICATIONS),
  
  getByUserId: (userId: string): Notification[] => {
    const notifications = getFromStorage<Notification>(STORAGE_KEYS.NOTIFICATIONS);
    return notifications
      .filter(notif => notif.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  
  create: (notificationData: Omit<Notification, 'id' | 'createdAt'>): Notification => {
    const notifications = getFromStorage<Notification>(STORAGE_KEYS.NOTIFICATIONS);
    const newNotification: Notification = {
      ...notificationData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    notifications.push(newNotification);
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
    return newNotification;
  },
  
  markAsRead: (id: string): boolean => {
    const notifications = getFromStorage<Notification>(STORAGE_KEYS.NOTIFICATIONS);
    const index = notifications.findIndex(notif => notif.id === id);
    if (index === -1) return false;
    
    notifications[index].read = true;
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
    return true;
  },
  
  markAllAsRead: (userId: string): void => {
    const notifications = getFromStorage<Notification>(STORAGE_KEYS.NOTIFICATIONS);
    const updated = notifications.map(notif => 
      notif.userId === userId ? { ...notif, read: true } : notif
    );
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
  },
};

// Friend request management
export const friendRequestStorage = {
  getAll: (): FriendRequest[] => getFromStorage<FriendRequest>(STORAGE_KEYS.FRIEND_REQUESTS),
  
  getByUserId: (userId: string): FriendRequest[] => {
    const requests = getFromStorage<FriendRequest>(STORAGE_KEYS.FRIEND_REQUESTS);
    return requests.filter(req => req.fromUserId === userId || req.toUserId === userId);
  },
  
  create: (fromUserId: string, toUserId: string): FriendRequest => {
    const requests = getFromStorage<FriendRequest>(STORAGE_KEYS.FRIEND_REQUESTS);
    const newRequest: FriendRequest = {
      id: crypto.randomUUID(),
      fromUserId,
      toUserId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    requests.push(newRequest);
    saveToStorage(STORAGE_KEYS.FRIEND_REQUESTS, requests);
    return newRequest;
  },
  
  updateStatus: (id: string, status: FriendRequest['status']): FriendRequest | null => {
    const requests = getFromStorage<FriendRequest>(STORAGE_KEYS.FRIEND_REQUESTS);
    const index = requests.findIndex(req => req.id === id);
    if (index === -1) return null;
    
    requests[index] = { ...requests[index], status };
    saveToStorage(STORAGE_KEYS.FRIEND_REQUESTS, requests);
    return requests[index];
  },
};

// Friendship management
export const friendshipStorage = {
  getAll: (): Friendship[] => getFromStorage<Friendship>(STORAGE_KEYS.FRIENDSHIPS),
  
  getFriends: (userId: string): string[] => {
    const friendships = getFromStorage<Friendship>(STORAGE_KEYS.FRIENDSHIPS);
    return friendships
      .filter(f => f.status === 'accepted' && (f.userId1 === userId || f.userId2 === userId))
      .map(f => f.userId1 === userId ? f.userId2 : f.userId1);
  },
  
  create: (userId1: string, userId2: string): Friendship => {
    const friendships = getFromStorage<Friendship>(STORAGE_KEYS.FRIENDSHIPS);
    const newFriendship: Friendship = {
      id: crypto.randomUUID(),
      userId1,
      userId2,
      status: 'accepted',
      createdAt: new Date().toISOString(),
    };
    friendships.push(newFriendship);
    saveToStorage(STORAGE_KEYS.FRIENDSHIPS, friendships);
    return newFriendship;
  },
  
  areFriends: (userId1: string, userId2: string): boolean => {
    const friendships = getFromStorage<Friendship>(STORAGE_KEYS.FRIENDSHIPS);
    return friendships.some(f => 
      f.status === 'accepted' && 
      ((f.userId1 === userId1 && f.userId2 === userId2) || (f.userId1 === userId2 && f.userId2 === userId1))
    );
  },
};

// Group management
export const groupStorage = {
  getAll: (): Group[] => getFromStorage<Group>(STORAGE_KEYS.GROUPS),
  
  getById: (id: string): Group | null => {
    const groups = getFromStorage<Group>(STORAGE_KEYS.GROUPS);
    return groups.find(group => group.id === id) || null;
  },
  
  getByCategory: (category: string): Group[] => {
    const groups = getFromStorage<Group>(STORAGE_KEYS.GROUPS);
    return groups.filter(group => group.category === category);
  },
  
  search: (query: string): Group[] => {
    const groups = getFromStorage<Group>(STORAGE_KEYS.GROUPS);
    const searchTerm = query.toLowerCase();
    return groups.filter(group => 
      group.name.toLowerCase().includes(searchTerm) ||
      group.description.toLowerCase().includes(searchTerm) ||
      group.category.toLowerCase().includes(searchTerm)
    );
  },
  
  create: (groupData: Omit<Group, 'id' | 'createdAt' | 'memberCount' | 'postCount'>): Group => {
    const groups = getFromStorage<Group>(STORAGE_KEYS.GROUPS);
    const newGroup: Group = {
      ...groupData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      memberCount: 1, // Creator is first member
      postCount: 0,
    };
    groups.push(newGroup);
    saveToStorage(STORAGE_KEYS.GROUPS, groups);
    
    // Add creator as admin member
    groupMemberStorage.create({
      groupId: newGroup.id,
      userId: groupData.createdBy,
      role: 'admin',
    });
    
    return newGroup;
  },
  
  update: (id: string, updates: Partial<Omit<Group, 'id' | 'createdAt' | 'createdBy'>>): Group | null => {
    const groups = getFromStorage<Group>(STORAGE_KEYS.GROUPS);
    const index = groups.findIndex(group => group.id === id);
    if (index === -1) return null;
    
    groups[index] = { ...groups[index], ...updates };
    saveToStorage(STORAGE_KEYS.GROUPS, groups);
    return groups[index];
  },
  
  delete: (id: string): boolean => {
    const groups = getFromStorage<Group>(STORAGE_KEYS.GROUPS);
    const filteredGroups = groups.filter(group => group.id !== id);
    if (filteredGroups.length === groups.length) return false;
    
    saveToStorage(STORAGE_KEYS.GROUPS, filteredGroups);
    
    // Clean up related data
    const members = getFromStorage<GroupMember>(STORAGE_KEYS.GROUP_MEMBERS);
    const filteredMembers = members.filter(member => member.groupId !== id);
    saveToStorage(STORAGE_KEYS.GROUP_MEMBERS, filteredMembers);
    
    const requests = getFromStorage<GroupJoinRequest>(STORAGE_KEYS.GROUP_JOIN_REQUESTS);
    const filteredRequests = requests.filter(request => request.groupId !== id);
    saveToStorage(STORAGE_KEYS.GROUP_JOIN_REQUESTS, filteredRequests);
    
    return true;
  },
};

// Group member management
export const groupMemberStorage = {
  getAll: (): GroupMember[] => getFromStorage<GroupMember>(STORAGE_KEYS.GROUP_MEMBERS),
  
  getByGroupId: (groupId: string): GroupMember[] => {
    const members = getFromStorage<GroupMember>(STORAGE_KEYS.GROUP_MEMBERS);
    return members.filter(member => member.groupId === groupId);
  },
  
  getByUserId: (userId: string): GroupMember[] => {
    const members = getFromStorage<GroupMember>(STORAGE_KEYS.GROUP_MEMBERS);
    return members.filter(member => member.userId === userId);
  },
  
  getUserGroups: (userId: string): string[] => {
    const members = getFromStorage<GroupMember>(STORAGE_KEYS.GROUP_MEMBERS);
    return members
      .filter(member => member.userId === userId)
      .map(member => member.groupId);
  },
  
  isMember: (groupId: string, userId: string): boolean => {
    const members = getFromStorage<GroupMember>(STORAGE_KEYS.GROUP_MEMBERS);
    return members.some(member => member.groupId === groupId && member.userId === userId);
  },
  
  getMemberRole: (groupId: string, userId: string): GroupMember['role'] | null => {
    const members = getFromStorage<GroupMember>(STORAGE_KEYS.GROUP_MEMBERS);
    const member = members.find(m => m.groupId === groupId && m.userId === userId);
    return member?.role || null;
  },
  
  create: (memberData: Omit<GroupMember, 'id' | 'joinedAt'>): GroupMember => {
    const members = getFromStorage<GroupMember>(STORAGE_KEYS.GROUP_MEMBERS);
    const newMember: GroupMember = {
      ...memberData,
      id: crypto.randomUUID(),
      joinedAt: new Date().toISOString(),
    };
    members.push(newMember);
    saveToStorage(STORAGE_KEYS.GROUP_MEMBERS, members);
    
    // Update group member count
    const groups = getFromStorage<Group>(STORAGE_KEYS.GROUPS);
    const groupIndex = groups.findIndex(g => g.id === memberData.groupId);
    if (groupIndex !== -1) {
      groups[groupIndex].memberCount += 1;
      saveToStorage(STORAGE_KEYS.GROUPS, groups);
    }
    
    return newMember;
  },
  
  updateRole: (groupId: string, userId: string, role: GroupMember['role']): GroupMember | null => {
    const members = getFromStorage<GroupMember>(STORAGE_KEYS.GROUP_MEMBERS);
    const index = members.findIndex(m => m.groupId === groupId && m.userId === userId);
    if (index === -1) return null;
    
    members[index] = { ...members[index], role };
    saveToStorage(STORAGE_KEYS.GROUP_MEMBERS, members);
    return members[index];
  },
  
  remove: (groupId: string, userId: string): boolean => {
    const members = getFromStorage<GroupMember>(STORAGE_KEYS.GROUP_MEMBERS);
    const filteredMembers = members.filter(m => !(m.groupId === groupId && m.userId === userId));
    if (filteredMembers.length === members.length) return false;
    
    saveToStorage(STORAGE_KEYS.GROUP_MEMBERS, filteredMembers);
    
    // Update group member count
    const groups = getFromStorage<Group>(STORAGE_KEYS.GROUPS);
    const groupIndex = groups.findIndex(g => g.id === groupId);
    if (groupIndex !== -1) {
      groups[groupIndex].memberCount = Math.max(0, groups[groupIndex].memberCount - 1);
      saveToStorage(STORAGE_KEYS.GROUPS, groups);
    }
    
    return true;
  },
};

// Group join request management
export const groupJoinRequestStorage = {
  getAll: (): GroupJoinRequest[] => getFromStorage<GroupJoinRequest>(STORAGE_KEYS.GROUP_JOIN_REQUESTS),
  
  getByGroupId: (groupId: string): GroupJoinRequest[] => {
    const requests = getFromStorage<GroupJoinRequest>(STORAGE_KEYS.GROUP_JOIN_REQUESTS);
    return requests.filter(req => req.groupId === groupId && req.status === 'pending');
  },
  
  getByUserId: (userId: string): GroupJoinRequest[] => {
    const requests = getFromStorage<GroupJoinRequest>(STORAGE_KEYS.GROUP_JOIN_REQUESTS);
    return requests.filter(req => req.userId === userId);
  },
  
  hasPendingRequest: (groupId: string, userId: string): boolean => {
    const requests = getFromStorage<GroupJoinRequest>(STORAGE_KEYS.GROUP_JOIN_REQUESTS);
    return requests.some(req => 
      req.groupId === groupId && 
      req.userId === userId && 
      req.status === 'pending'
    );
  },
  
  create: (groupId: string, userId: string): GroupJoinRequest => {
    const requests = getFromStorage<GroupJoinRequest>(STORAGE_KEYS.GROUP_JOIN_REQUESTS);
    const newRequest: GroupJoinRequest = {
      id: crypto.randomUUID(),
      groupId,
      userId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    requests.push(newRequest);
    saveToStorage(STORAGE_KEYS.GROUP_JOIN_REQUESTS, requests);
    return newRequest;
  },
  
  updateStatus: (id: string, status: GroupJoinRequest['status']): GroupJoinRequest | null => {
    const requests = getFromStorage<GroupJoinRequest>(STORAGE_KEYS.GROUP_JOIN_REQUESTS);
    const index = requests.findIndex(req => req.id === id);
    if (index === -1) return null;
    
    requests[index] = { ...requests[index], status };
    saveToStorage(STORAGE_KEYS.GROUP_JOIN_REQUESTS, requests);
    
    // If approved, add user as member
    if (status === 'approved') {
      groupMemberStorage.create({
        groupId: requests[index].groupId,
        userId: requests[index].userId,
        role: 'member',
      });
    }
    
    return requests[index];
  },
  
  delete: (id: string): boolean => {
    const requests = getFromStorage<GroupJoinRequest>(STORAGE_KEYS.GROUP_JOIN_REQUESTS);
    const filteredRequests = requests.filter(req => req.id !== id);
    if (filteredRequests.length === requests.length) return false;
    
    saveToStorage(STORAGE_KEYS.GROUP_JOIN_REQUESTS, filteredRequests);
    return true;
  },
};

// Current user session
export const sessionStorage = {
  getCurrentUser: (): User | null => {
    try {
      const userData = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  },
  
  setCurrentUser: (user: User): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save current user:', error);
    }
  },
  
  clearCurrentUser: (): void => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },
};
