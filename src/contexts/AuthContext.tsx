import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, userStorage, sessionStorage } from '@/lib/localStorage';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<Omit<User, 'id' | 'createdAt'>>) => Promise<boolean>;
}

interface RegisterData {
  username: string;
  displayName: string;
  email: string;
  password: string;
  bio?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load current user from localStorage on app start
    const currentUser = sessionStorage.getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Simple mock authentication - in real app, this would be hashed passwords
      const foundUser = userStorage.getByUsername(username);
      
      if (!foundUser) {
        toast({
          title: "Login Failed",
          description: "Username not found",
          variant: "destructive",
        });
        return false;
      }

      // For testing, accept any password (in real app, verify against hashed password)
      sessionStorage.setCurrentUser(foundUser);
      setUser(foundUser);
      
      toast({
        title: "Welcome back!",
        description: `Logged in as ${foundUser.displayName}`,
      });
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      // Check if username already exists
      if (userStorage.getByUsername(userData.username)) {
        toast({
          title: "Registration Failed",
          description: "Username already taken",
          variant: "destructive",
        });
        return false;
      }

      // Check if email already exists
      if (userStorage.getByEmail(userData.email)) {
        toast({
          title: "Registration Failed",
          description: "Email already registered",
          variant: "destructive",
        });
        return false;
      }

      // Create new user (password would be hashed in real app)
      const newUser = userStorage.create({
        username: userData.username,
        displayName: userData.displayName,
        email: userData.email,
        bio: userData.bio,
      });

      sessionStorage.setCurrentUser(newUser);
      setUser(newUser);
      
      toast({
        title: "Welcome to Under Pines!",
        description: `Account created for ${newUser.displayName}`,
      });
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = () => {
    sessionStorage.clearCurrentUser();
    setUser(null);
    toast({
      title: "Goodbye!",
      description: "You have been logged out",
    });
  };

  const updateProfile = async (updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<boolean> => {
    if (!user) return false;

    try {
      const updatedUser = userStorage.update(user.id, updates);
      if (updatedUser) {
        sessionStorage.setCurrentUser(updatedUser);
        setUser(updatedUser);
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated",
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Update Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};