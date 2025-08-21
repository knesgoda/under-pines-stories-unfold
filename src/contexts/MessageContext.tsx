import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Message, Conversation } from '@/lib/localStorage';
import { messageStorage, conversationStorage } from '@/lib/localStorage';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { toast } from '@/hooks/use-toast';

interface MessageContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  unreadCount: number;
  setCurrentConversation: (conversation: Conversation | null) => void;
  sendMessage: (receiverId: string, content: string, messageType?: 'text' | 'image' | 'file', mediaUrl?: string) => Promise<Message | null>;
  markConversationAsRead: (conversationId: string) => void;
  deleteMessage: (messageId: string) => void;
  startConversation: (userId: string) => Conversation;
  refreshConversations: () => void;
}

const MessageContext = createContext<MessageContextType | null>(null);

export const useMessages = (): MessageContextType => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};

interface MessageProviderProps {
  children: ReactNode;
}

export const MessageProvider: React.FC<MessageProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { createNotification } = useNotifications();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load conversations when user changes
  useEffect(() => {
    if (user) {
      refreshConversations();
    } else {
      setConversations([]);
      setCurrentConversation(null);
      setMessages([]);
    }
  }, [user]);

  // Load messages when current conversation changes
  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id);
    } else {
      setMessages([]);
    }
  }, [currentConversation]);

  const refreshConversations = () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const userConversations = conversationStorage.getUserConversations(user.id);
      setConversations(userConversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = (conversationId: string) => {
    try {
      const conversationMessages = messageStorage.getConversationMessages(conversationId);
      setMessages(conversationMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async (
    receiverId: string, 
    content: string, 
    messageType: 'text' | 'image' | 'file' = 'text',
    mediaUrl?: string
  ): Promise<Message | null> => {
    if (!user) return null;
    
    try {
      const newMessage = messageStorage.create({
        senderId: user.id,
        receiverId,
        content,
        messageType,
        mediaUrl,
        isRead: false
      });

      // Create notification for receiver
      createNotification({
        userId: receiverId,
        type: 'message',
        fromUserId: user.id,
        messageId: newMessage.id,
        message: `${user.display_name} sent you a message`,
        isRead: false,
        priority: 'high'
      });

      // Refresh conversations to update last message
      refreshConversations();
      
      // If this message is in the current conversation, add it to messages
      if (currentConversation && 
          currentConversation.participants.includes(receiverId)) {
        setMessages(prev => [...prev, newMessage]);
      }

      return newMessage;
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const markConversationAsRead = (conversationId: string) => {
    if (!user) return;
    
    conversationStorage.markAsRead(conversationId, user.id);
    
    // Mark all messages in this conversation as read
    const conversationMessages = messages.filter(m => m.receiverId === user.id && !m.isRead);
    if (conversationMessages.length > 0) {
      messageStorage.markAsRead(conversationMessages.map(m => m.id), user.id);
      setMessages(prev => 
        prev.map(message => 
          message.receiverId === user.id ? { ...message, isRead: true } : message
        )
      );
    }
    
    refreshConversations();
  };

  const deleteMessage = (messageId: string) => {
    if (!user) return;
    
    const success = messageStorage.delete(messageId, user.id);
    if (success) {
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast({
        title: "Message deleted",
        description: "The message has been removed.",
      });
    }
  };

  const startConversation = (userId: string): Conversation => {
    if (!user) throw new Error('User not authenticated');
    
    const conversation = conversationStorage.findOrCreate(user.id, userId);
    setCurrentConversation(conversation);
    refreshConversations();
    return conversation;
  };

  const unreadCount = conversations.reduce((total, conv) => {
    return total + (conv.unreadCount[user?.id || ''] || 0);
  }, 0);

  const value: MessageContextType = {
    conversations,
    currentConversation,
    messages,
    isLoading,
    unreadCount,
    setCurrentConversation,
    sendMessage,
    markConversationAsRead,
    deleteMessage,
    startConversation,
    refreshConversations
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};