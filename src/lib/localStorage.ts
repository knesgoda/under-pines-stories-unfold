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

const STORAGE_KEYS = {
  USERS: 'under_pines_users',
  POSTS: 'under_pines_posts',
  FRIENDSHIPS: 'under_pines_friendships',
  FRIEND_REQUESTS: 'under_pines_friend_requests',
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
  
  create: (postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Post => {
    const posts = getFromStorage<Post>(STORAGE_KEYS.POSTS);
    const newPost: Post = {
      ...postData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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