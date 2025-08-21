import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Search, Plus, Send, Image, Paperclip } from 'lucide-react';
import { useMessages } from '@/contexts/MessageContext';
import { enhancedUserStorage } from '@/lib/localStorage';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

const MessageCenter: React.FC = () => {
  const { user } = useAuth();
  const { 
    conversations, 
    currentConversation, 
    messages, 
    unreadCount,
    setCurrentConversation, 
    sendMessage, 
    markConversationAsRead,
    isLoading 
  } = useMessages();
  
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter(conv => {
    const otherParticipant = conv.participants.find(p => p !== user?.id);
    if (!otherParticipant) return false;
    
    const otherUser = enhancedUserStorage.getById(otherParticipant);
    if (!otherUser) return false;
    
    return otherUser.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           otherUser.username.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentConversation || !user) return;
    
    const otherParticipant = currentConversation.participants.find(p => p !== user.id);
    if (!otherParticipant) return;
    
    await sendMessage(otherParticipant, newMessage.trim());
    setNewMessage('');
  };

  const handleSelectConversation = (conversation: any) => {
    setCurrentConversation(conversation);
    if (user && conversation.unreadCount[user.id] > 0) {
      markConversationAsRead(conversation.id);
    }
  };

  if (isLoading) {
    return (
      <Card className="card-gradient pine-shadow h-[600px]">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading messages...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-gradient pine-shadow h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Messages
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex h-full">
          {/* Conversations List */}
          <div className="w-1/3 border-r border-border/50 flex flex-col">
            <div className="p-4 border-b border-border/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center">
                  <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? 'No conversations found' : 'No messages yet'}
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  {filteredConversations.map((conversation) => {
                    const otherParticipant = conversation.participants.find(p => p !== user?.id);
                    const otherUser = otherParticipant ? enhancedUserStorage.getById(otherParticipant) : null;
                    const isUnread = user && conversation.unreadCount[user.id] > 0;
                    const isSelected = currentConversation?.id === conversation.id;
                    
                    if (!otherUser) return null;
                    
                    return (
                      <div
                        key={conversation.id}
                        className={`p-3 rounded-lg cursor-pointer transition-smooth hover:bg-muted/50 ${
                          isSelected ? 'bg-primary/10 border border-primary/20' : ''
                        }`}
                        onClick={() => handleSelectConversation(conversation)}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {otherUser.displayName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-medium truncate ${isUnread ? 'text-foreground' : 'text-foreground/80'}`}>
                                {otherUser.displayName}
                              </p>
                              {conversation.lastMessage && (
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })}
                                </p>
                              )}
                            </div>
                            
                            {conversation.lastMessage && (
                              <p className={`text-xs truncate mt-1 ${isUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                {conversation.lastMessage.content}
                              </p>
                            )}
                            
                            {isUnread && (
                              <Badge variant="destructive" className="mt-1 h-5 text-xs">
                                {conversation.unreadCount[user.id]}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
          
          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {currentConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border/50">
                  {(() => {
                    const otherParticipant = currentConversation.participants.find(p => p !== user?.id);
                    const otherUser = otherParticipant ? enhancedUserStorage.getById(otherParticipant) : null;
                    
                    return otherUser ? (
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {otherUser.displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{otherUser.displayName}</p>
                          <p className="text-xs text-muted-foreground">@{otherUser.username}</p>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
                
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isOwn = message.senderId === user?.id;
                      const sender = enhancedUserStorage.getById(message.senderId);
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isOwn && (
                            <Avatar className="h-6 w-6 flex-shrink-0">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {sender?.displayName.charAt(0).toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div className={`max-w-[70%] ${isOwn ? 'text-right' : 'text-left'}`}>
                            <div
                              className={`inline-block p-3 rounded-lg ${
                                isOwn 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-muted text-foreground'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                
                {/* Message Input */}
                <div className="p-4 border-t border-border/50">
                  <div className="flex gap-2">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Image className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground text-sm">
                    Choose a conversation from the left to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MessageCenter;