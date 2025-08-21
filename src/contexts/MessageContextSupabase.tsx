import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file';
  media_url: string | null;
  file_name: string | null;
  file_size: number | null;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  message_reads?: {
    user_id: string;
    read_at: string;
  }[];
}

export interface Conversation {
  id: string;
  participant_ids: string[];
  last_message_id: string | null;
  last_activity: string;
  created_at: string;
  messages?: Message[];
  participants?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  }[];
}

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
  startConversation: (userId: string) => Promise<Conversation | null>;
  refreshConversations: () => void;
}

const MessageContext = createContext<MessageContextType | null>(null);

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};

export const MessageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      refreshConversations();
      
      // Subscribe to real-time message updates
      const messagesSubscription = supabase
        .channel('messages_changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          const newMessage = payload.new as Message;
          
          // If message is for current conversation, add it to messages
          if (currentConversation && newMessage.conversation_id === currentConversation.id) {
            setMessages(prev => [...prev, newMessage]);
          }
          
          // Refresh conversations to update last message
          refreshConversations();
        })
        .subscribe();

      const conversationsSubscription = supabase
        .channel('conversations_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
          refreshConversations();
        })
        .subscribe();

      return () => {
        messagesSubscription.unsubscribe();
        conversationsSubscription.unsubscribe();
      };
    }
  }, [user, currentConversation]);

  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id);
    } else {
      setMessages([]);
    }
  }, [currentConversation]);

  const refreshConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages!conversations_last_message_id_fkey (
            id,
            content,
            created_at,
            sender_id,
            message_type
          )
        `)
        .contains('participant_ids', [user.id])
        .order('last_activity', { ascending: false });

      if (error) {
        console.error('Error loading conversations:', error);
        return;
      }

      // Get participant details for each conversation
      const conversationsWithParticipants = await Promise.all(
        (data || []).map(async (conv) => {
          const otherParticipantIds = conv.participant_ids.filter(id => id !== user.id);
          
          const { data: participants } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .in('id', otherParticipantIds);

          return {
            ...conv,
            participants: participants || []
          };
        })
      );

      setConversations(conversationsWithParticipants);

      // Calculate unread count
      let totalUnread = 0;
      for (const conv of conversationsWithParticipants) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', user.id)
          .not('id', 'in', `(
            SELECT message_id FROM message_reads WHERE user_id = '${user.id}'
          )`);
        
        totalUnread += count || 0;
      }
      setUnreadCount(totalUnread);

    } catch (error) {
      console.error('Error refreshing conversations:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles:sender_id (username, display_name, avatar_url),
          message_reads (user_id, read_at)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
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
      // Find or create conversation
      let conversation = await startConversation(receiverId);
      if (!conversation) return null;

      // Send message
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          content,
          message_type: messageType,
          media_url: mediaUrl || null,
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        });
        return null;
      }

      // Update conversation's last message and activity
      await supabase
        .from('conversations')
        .update({
          last_message_id: data.id,
          last_activity: new Date().toISOString(),
        })
        .eq('id', conversation.id);

      // Create notification for receiver  
      await supabase
        .from('notifications')
        .insert({
          user_id: receiverId,
          type: 'message',
          from_user_id: user.id,
          message_id: data.id,
          message: `New message from ${user.display_name}`,
        });

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  };

  const markConversationAsRead = async (conversationId: string) => {
    if (!user) return;

    try {
      // Get all unread messages in this conversation
      const { data: unreadMessages } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .not('id', 'in', `(
          SELECT message_id FROM message_reads WHERE user_id = '${user.id}'
        )`);

      if (unreadMessages && unreadMessages.length > 0) {
        // Mark messages as read
        const readRecords = unreadMessages.map(msg => ({
          message_id: msg.id,
          user_id: user.id,
        }));

        await supabase
          .from('message_reads')
          .insert(readRecords);
      }

      // Refresh unread count
      refreshConversations();
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete message",
          variant: "destructive",
        });
        return;
      }

      // Remove from local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const startConversation = async (userId: string): Promise<Conversation | null> => {
    if (!user || userId === user.id) return null;

    try {
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('*')
        .contains('participant_ids', [user.id])
        .contains('participant_ids', [userId])
        .single();

      if (existingConv) {
        return existingConv;
      }

      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          participant_ids: [user.id, userId],
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        return null;
      }

      await refreshConversations();
      return data;
    } catch (error) {
      console.error('Error starting conversation:', error);
      return null;
    }
  };

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
    refreshConversations,
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};