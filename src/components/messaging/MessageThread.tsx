import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/contexts/MessageContextSupabase';
import { formatDistanceToNow } from 'date-fns';

interface MessageThreadProps {
  conversationId: string;
  onBack: () => void;
}

export const MessageThread: React.FC<MessageThreadProps> = ({ 
  conversationId, 
  onBack 
}) => {
  const { user } = useAuth();
  const { messages, sendMessage, isLoading } = useMessages();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const conversationMessages = messages.filter(m => m.conversation_id === conversationId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const success = await sendMessage(conversationId, newMessage.trim());
      if (success) {
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            Loading messages...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="flex items-center">
            Conversation
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {conversationMessages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Send the first message to start the conversation!</p>
            </div>
          ) : (
            conversationMessages.map((message) => {
              const isOwn = message.sender_id === user?.id;
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex space-x-2 max-w-[70%] ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {!isOwn && (
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                          U
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`space-y-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                      {!isOwn && (
                        <p className="text-xs text-muted-foreground font-medium">
                          User
                        </p>
                      )}
                      
                      <div
                        className={`rounded-lg px-3 py-2 ${
                          isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      
                      <p className={`text-xs text-muted-foreground ${isOwn ? 'text-right' : ''}`}>
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        {message.is_read && isOwn && (
                          <span className="ml-1 text-primary">✓</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Message Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
              maxLength={1000}
              disabled={isSending}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!newMessage.trim() || isSending}
            >
              {isSending ? (
                'Sending...'
              ) : (
                <>
                  <Send className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-1">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </CardContent>
    </Card>
  );
};