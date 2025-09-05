import { supabase } from '@/integrations/supabase/client'

export interface DMThread {
  id: string
  otherUser: {
    id: string
    username: string
    display_name?: string
    avatar_url?: string
  }
  lastMessage?: DMMessage
  unreadCount: number
  updated_at: string
  isPending: boolean
}

export interface DMMessage {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
  sender: {
    id: string
    username: string
    display_name?: string
    avatar_url?: string
  }
}

export async function fetchThreads(type: 'inbox' | 'requests' = 'inbox'): Promise<DMThread[]> {
  // DM functionality is currently disabled
  return [];
}

export async function fetchMessages(conversationId: string): Promise<DMMessage[]> {
  // DM functionality is currently disabled  
  return [];
}

export async function sendMessage(conversationId: string, body: string): Promise<DMMessage> {
  // DM functionality is currently disabled
  throw new Error('DM functionality is currently disabled');
}

export async function markThreadRead(conversationId: string): Promise<void> {
  // DM functionality is currently disabled
  return;
}

export async function startConversation(targetUserId: string): Promise<string> {
  // DM functionality is currently disabled
  throw new Error('DM functionality is currently disabled');
}

export async function getUnreadDMCount(): Promise<number> {
  // DM functionality is currently disabled
  return 0;
}