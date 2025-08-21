import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  media_urls: string[] | null;
  reply_to_id: string | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  type: string;
  name: string | null;
  last_message_id: string | null;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
  participants?: Array<{
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  }>;
  messages?: Message[];
  unread_count?: number;
}

interface MessageContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  unreadCount: number;
  refreshConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, media_urls?: string[]) => Promise<boolean>;
  markConversationAsRead: (conversationId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  startConversation: (participantId: string) => Promise<string | null>;
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
      
      // Subscribe to real-time updates
      const messagesSubscription = supabase
        .channel('messages_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
          refreshConversations();
          if (currentConversation) {
            loadMessages(currentConversation.id);
          }
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

  const refreshConversations = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Get conversations where user is a participant
      const { data: participantData, error } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations (
            id,
            type,
            name,
            last_message_id,
            last_activity_at,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading conversations:', error);
        return;
      }

      const conversationIds = participantData?.map(p => p.conversation_id) || [];
      const conversationsData: Conversation[] = [];

      // Get participants for each conversation
      for (const convData of participantData || []) {
        const conversation = convData.conversations as any;
        
        // Get other participants
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select(`
            user_id,
            profiles (
              id,
              username,
              display_name,
              avatar_url
            )
          `)
          .eq('conversation_id', conversation.id);

        // Count unread messages
        const { count: unreadMessages } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conversation.id)
          .eq('is_read', false)
          .neq('sender_id', user.id);

        conversationsData.push({
          ...conversation,
          participants: participants?.map(p => p.profiles).filter(Boolean) || [],
          unread_count: unreadMessages || 0,
        });
      }

      // Sort by last activity
      conversationsData.sort((a, b) => 
        new Date(b.last_activity_at || b.created_at).getTime() - 
        new Date(a.last_activity_at || a.created_at).getTime()
      );

      setConversations(conversationsData);
      
      // Calculate total unread count
      const totalUnread = conversationsData.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
      setUnreadCount(totalUnread);

    } catch (error) {
      console.error('Error refreshing conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(data || []);
      
      // Find and set current conversation
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        setCurrentConversation(conversation);
      }

    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async (conversationId: string, content: string, media_urls?: string[]): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          media_urls: media_urls || null,
        });

      if (messageError) {
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        });
        return false;
      }

      // Update conversation's last activity
      await supabase
        .from('conversations')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', conversationId);

      await refreshConversations();
      await loadMessages(conversationId);
      
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  };

  const markConversationAsRead = async (conversationId: string) => {
    if (!user) return;

    try {
      // Mark all unread messages in the conversation as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('is_read', false)
        .neq('sender_id', user.id);

      await refreshConversations();
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  const deleteMessage = async (messageId: string): Promise<boolean> => {
    if (!user) return false;

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
        return false;
      }

      if (currentConversation) {
        await loadMessages(currentConversation.id);
      }
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  };

  const startConversation = async (participantId: string): Promise<string | null> => {
    if (!user) return null;

    try {
      // Check if conversation already exists between these users
      const { data: existingParticipants } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .in('user_id', [user.id, participantId]);

      // Find conversations with both users
      const conversationCounts: { [key: string]: number } = {};
      existingParticipants?.forEach(p => {
        conversationCounts[p.conversation_id] = (conversationCounts[p.conversation_id] || 0) + 1;
      });

      const existingConversation = Object.keys(conversationCounts).find(
        convId => conversationCounts[convId] === 2
      );

      if (existingConversation) {
        return existingConversation;
      }

      // Create new conversation
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          type: 'direct',
        })
        .select()
        .single();

      if (convError) {
        throw convError;
      }

      // Add participants
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConversation.id, user_id: user.id },
          { conversation_id: newConversation.id, user_id: participantId },
        ]);

      if (participantsError) {
        throw participantsError;
      }

      await refreshConversations();
      return newConversation.id;

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
    refreshConversations,
    loadMessages,
    sendMessage,
    markConversationAsRead,
    deleteMessage,
    startConversation,
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};