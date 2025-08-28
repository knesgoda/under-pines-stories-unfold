import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  hobbies: string[];
  interests: string[];
  places_lived: string[];
  created_at: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<Omit<User, 'id' | 'created_at'>>) => Promise<boolean>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
}

interface RegisterData {
  email: string;
  password: string;
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
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const createUserProfile = useCallback(async (userId: string) => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) return;

      const email = authUser.user.email || '';
      const username = email ? email.split('@')[0] : `user_${userId.slice(0, 8)}`;

      const { data: profile, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email,
          username,
          display_name: username,
          bio: null,
          hobbies: [],
          interests: [],
          places_lived: [],
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return;
      }

      if (profile) {
        setUser(profile);
        console.log('Profile created successfully');
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  }, []);

  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      if (profile) {
        setUser(profile);
      } else {
        // Create profile if it doesn't exist
        console.log('Profile not found, creating one...');
        await createUserProfile(userId);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }, [createUserProfile]);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setSupabaseUser(session.user);
        await loadUserProfile(session.user.id);
      }
      setIsLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        // Defer Supabase calls to prevent authentication deadlock
        setTimeout(() => {
          loadUserProfile(session.user.id);
        }, 0);
      } else {
        setSupabaseUser(null);
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserProfile]);

  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error checking username availability:', error);
        return false;
      }

      return !data; // Return true if username is available (no existing row)
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        let errorMessage = "Something went wrong. Please try again.";
        if (error.message.includes('invalid_credentials') || error.message.includes('Invalid login credentials')) {
          errorMessage = "Wrong email or password";
        } else if (error.message.includes('email_rate_limit_exceeded')) {
          errorMessage = "Too many attempts. Try again in a minute";
        } else if (error.message.includes('signup_disabled')) {
          errorMessage = "Account creation is currently disabled";
        }
        
        toast({
          title: "Login Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return false;
      }

      if (data.user) {
        toast({
          title: "Welcome back!",
          description: "Successfully logged in",
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      console.log('Attempting signup with:', { email: userData.email });
      
      const { data, error } = await supabase.auth.signUp({
        email: userData.email.trim(),
        password: userData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      console.log('Signup response:', { data, error });

      if (error) {
        console.error('Signup error:', error);
        let errorMessage = "Something went wrong. Please try again.";
        if (error.message.includes('signup_disabled')) {
          errorMessage = "Account creation is currently disabled";
        } else if (error.message.includes('password')) {
          errorMessage = "Use at least 8 characters with letters and numbers";
        } else if (error.message.includes('email')) {
          errorMessage = "Please enter a valid email address";
        }
        
        toast({
          title: "Registration Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return false;
      }

      if (data.user) {
        // Check if email confirmation is required
        if (data.user && !data.user.email_confirmed_at && data.session) {
          // With email confirmation OFF, we should get a session immediately
          toast({
            title: "Welcome to Under Pines!",
            description: "Account created successfully",
          });
        } else if (!data.session) {
          toast({
            title: "Check Your Email!",
            description: "Please check your email and click the confirmation link to complete registration.",
          });
        } else {
          toast({
            title: "Welcome to Under Pines!",
            description: "Account created successfully",
          });
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSupabaseUser(null);
      toast({
        title: "Goodbye!",
        description: "You have been logged out",
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = async (updates: Partial<Omit<User, 'id' | 'created_at'>>): Promise<boolean> => {
    if (!user || !supabaseUser) return false;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        toast({
          title: "Update Failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      if (data) {
        setUser(data);
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
    supabaseUser,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    checkUsernameAvailability,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
