import React, { useState } from 'react';
import { Navigation } from "@/components/ui/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { AuthModal } from "@/components/auth/AuthModal";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CreatePost } from '@/components/social/CreatePost';
import { PostCard } from '@/components/social/PostCard';
import { FriendRequests } from '@/components/social/FriendRequests';
import { UserList } from '@/components/social/UserList';
import { EnhancedSearch } from '@/components/social/EnhancedSearch';
import { BetaFeedbackButton } from '@/components/feedback/BetaFeedbackButton';
import { LogOut, TreePine, Bell, MessageCircle, Search, Users } from 'lucide-react';
import { useSocial } from '@/contexts/SocialContextSupabase';
import { useNotifications } from '@/contexts/NotificationContextSupabase';
import { useMessages } from '@/contexts/MessageContextSupabase';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

const Index = () => {
  const { user, logout } = useAuth();
  const { posts } = useSocial();
  const { unreadCount: notificationCount } = useNotifications();
  const { unreadCount: messageCount } = useMessages();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const handleWelcomeComplete = () => {
    setShowWelcomeModal(false);
  };

  // Show dashboard content if user is logged in
  if (user) {
    // Check if this is a new user and show welcome modal
    const isNewUser = !user.bio;
    if (isNewUser && !showWelcomeModal) {
      setShowWelcomeModal(true);
    }

    return (
      <div className="min-h-screen bg-gradient-subtle">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <TreePine className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                  Under Pines
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                {/* Navigation Icons */}
                <div className="flex items-center space-x-2">
                  <Link to="/search">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Search className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/notifications">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 relative">
                      <Bell className="h-4 w-4" />
                      {notificationCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
                        >
                          {notificationCount > 9 ? '9+' : notificationCount}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                  <Link to="/messages">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 relative">
                      <MessageCircle className="h-4 w-4" />
                      {messageCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
                        >
                          {messageCount > 9 ? '9+' : messageCount}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                  <Link to="/groups">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Users className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Link to="/profile">
                    <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                        {user.display_name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <span className="text-sm font-medium hidden sm:inline">
                    {user.display_name}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="h-8"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar - User Info & Friend Requests */}
            <div className="space-y-6">
              {/* User Profile Card */}
              <div className="card-gradient pine-shadow p-6 rounded-lg">
                <div className="flex flex-col items-center text-center space-y-3">
                  <Link to="/profile">
                    <Avatar className="h-16 w-16 cursor-pointer hover:opacity-80 transition-opacity">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                        {user.display_name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <Link to="/profile">
                      <h2 className="font-bold text-lg hover:text-primary transition-smooth cursor-pointer">
                        {user.display_name}
                      </h2>
                    </Link>
                    <p className="text-muted-foreground text-sm">@{user.username}</p>
                    {user.bio && (
                      <p className="text-sm mt-2 text-center">{user.bio}</p>
                    )}
                  </div>
                </div>
              </div>

              <FriendRequests />
            </div>

            {/* Center - Posts Feed */}
            <div className="space-y-6">
              <CreatePost />
              
              <div className="space-y-4">
                {posts.length === 0 ? (
                  <div className="text-center py-12">
                    <TreePine className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                    <p className="text-muted-foreground text-sm">
                      Be the first to share something under the pines!
                    </p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))
                )}
              </div>
            </div>

            {/* Right Sidebar - Enhanced Search & Discovery */}
            <div className="space-y-6">
              <EnhancedSearch />
              <UserList />
            </div>
          </div>
        </main>

        <BetaFeedbackButton />
        <WelcomeModal isOpen={showWelcomeModal} onClose={handleWelcomeComplete} />
      </div>
    );
  }

  // Show landing page if user is not logged in
  return (
    <div className="min-h-screen">
      <Navigation onAuthClick={() => setShowAuthModal(true)} />
      <HeroSection onGetStarted={() => setShowAuthModal(true)} />
      <FeaturesSection />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default Index;
