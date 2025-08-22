import React, { useState } from 'react';
import { ConversationList } from '@/components/messaging/ConversationList';
import { MessageThread } from '@/components/messaging/MessageThread';
import { Button } from '@/components/ui/button';
import { TreePine, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Messages: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  const [isMobileThreadView, setIsMobileThreadView] = useState(false);

  if (!user) {
    navigate('/');
    return null;
  }

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setIsMobileThreadView(true);
  };

  const handleBackToList = () => {
    setIsMobileThreadView(false);
    setSelectedConversationId(undefined);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <TreePine className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                Messages
              </h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="h-8"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversation List - Hidden on mobile when thread is open */}
          <div className={`lg:col-span-1 ${isMobileThreadView ? 'hidden lg:block' : ''}`}>
            <ConversationList
              onSelectConversation={handleSelectConversation}
              selectedConversationId={selectedConversationId}
            />
          </div>

          {/* Message Thread - Hidden on mobile when no conversation selected */}
          <div className={`lg:col-span-2 ${!selectedConversationId && !isMobileThreadView ? 'hidden lg:flex lg:items-center lg:justify-center' : ''}`}>
            {selectedConversationId ? (
              <MessageThread
                conversationId={selectedConversationId}
                onBack={handleBackToList}
              />
            ) : (
              <div className="hidden lg:flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                  <TreePine className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Welcome to Messages</h3>
                  <p className="text-muted-foreground text-sm max-w-md">
                    Select a conversation from the list to start chatting, or send a friend request to someone new to start a conversation.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Messages;