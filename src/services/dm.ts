import { supabase } from '@/integrations/supabase/client';

export interface DMConversation {
  id: string;
  updated_at: string;
  members: DMMember[];
  last_message?: DMMessage;
  unread_count?: number;
}

export interface DMMember {
  id: string;
  dm_id: string;
  user_id: string;
  state: string;
  last_read_at?: string;
  user?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export interface DMMessage {
  id: string;
  dm_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export interface DMThread {
  id: string;
  updated_at: string;
  members: DMMember[];
  last_message?: DMMessage;
  unread_count: number;
}

/**
 * List DM threads for a user
 */
export async function listThreads(userId: string): Promise<DMThread[]> {
  const { data, error } = await supabase
    .from('dm_conversations')
    .select(`
      id,
      updated_at,
      dm_members!inner(
        id,
        dm_id,
        user_id,
        state,
        last_read_at,
        user:profiles!dm_members_user_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      ),
      dm_messages(
        id,
        dm_id,
        author_id,
        body,
        created_at,
        author:profiles!dm_messages_author_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      )
    `)
    .eq('dm_members.user_id', userId)
    .eq('dm_members.state', 'active')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching DM threads:', error);
    return [];
  }

  const threads: DMThread[] = [];

  for (const conv of data || []) {
    const members = conv.dm_members as DMMember[];
    const messages = conv.dm_messages as DMMessage[];
    
    // Get last message
    const lastMessage = messages.length > 0 
      ? messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
      : undefined;

    // Calculate unread count
    const userMember = members.find(m => m.user_id === userId);
    const lastReadAt = userMember?.last_read_at;
    const unreadCount = lastReadAt 
      ? messages.filter(m => new Date(m.created_at) > new Date(lastReadAt)).length
      : messages.length;

    threads.push({
      id: conv.id,
      updated_at: conv.updated_at,
      members,
      last_message: lastMessage,
      unread_count: unreadCount
    });
  }

  return threads;
}

/**
 * List messages in a DM conversation
 */
export async function listMessages(dmId: string, limit = 50, offset = 0): Promise<DMMessage[]> {
  const { data, error } = await supabase
    .from('dm_messages')
    .select(`
      id,
      dm_id,
      author_id,
      body,
      created_at,
      author:profiles!dm_messages_author_id_fkey(
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('dm_id', dmId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching DM messages:', error);
    return [];
  }

  return (data || []).reverse(); // Reverse to show oldest first
}

/**
 * Send a message in a DM conversation
 */
export async function sendMessage(dmId: string, authorId: string, body: string): Promise<DMMessage | null> {
  const { data, error } = await supabase
    .from('dm_messages')
    .insert({
      dm_id: dmId,
      author_id: authorId,
      body
    })
    .select(`
      id,
      dm_id,
      author_id,
      body,
      created_at,
      author:profiles!dm_messages_author_id_fkey(
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .single();

  if (error) {
    console.error('Error sending DM message:', error);
    return null;
  }

  // Update conversation timestamp
  await supabase
    .from('dm_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', dmId);

  return data as DMMessage;
}

/**
 * Mark messages as read in a conversation
 */
export async function markAsRead(dmId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('dm_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('dm_id', dmId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error marking DM as read:', error);
    return false;
  }

  return true;
}

/**
 * Create a new DM conversation
 */
export async function createConversation(userIds: string[]): Promise<string | null> {
  if (userIds.length < 2) return null;

  // Check if conversation already exists
  const { data: existing } = await supabase
    .from('dm_conversations')
    .select(`
      id,
      dm_members!inner(user_id)
    `)
    .eq('dm_members.user_id', userIds[0])
    .in('dm_members.user_id', userIds);

  if (existing && existing.length > 0) {
    // Check if all users are in the same conversation
    for (const conv of existing) {
      const memberIds = (conv.dm_members as any[]).map(m => m.user_id);
      if (userIds.every(id => memberIds.includes(id))) {
        return conv.id;
      }
    }
  }

  // Create new conversation
  const { data: conversation, error: convError } = await supabase
    .from('dm_conversations')
    .insert({})
    .select('id')
    .single();

  if (convError || !conversation) {
    console.error('Error creating DM conversation:', convError);
    return null;
  }

  // Add members
  const members = userIds.map(userId => ({
    dm_id: conversation.id,
    user_id: userId,
    state: 'active'
  }));

  const { error: membersError } = await supabase
    .from('dm_members')
    .insert(members);

  if (membersError) {
    console.error('Error adding DM members:', membersError);
    return null;
  }

  return conversation.id;
}

/**
 * Subscribe to DM messages
 */
export function subscribeToDM(dmId: string, callback: (message: DMMessage) => void): () => void {
  const channel = supabase
    .channel(`dm:${dmId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'dm_messages',
        filter: `dm_id=eq.${dmId}`
      },
      async (payload) => {
        const message = payload.new as DMMessage;
        
        // Fetch author details
        const { data: author } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .eq('id', message.author_id)
          .single();

        callback({
          ...message,
          author
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to typing indicators
 */
export function subscribeToTyping(
  dmId: string, 
  callback: (userId: string, isTyping: boolean) => void
): () => void {
  const channel = supabase
    .channel(`typing:${dmId}`)
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      // Handle typing state changes
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      // Handle user joining typing
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      // Handle user leaving typing
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Send typing indicator
 */
export async function sendTyping(dmId: string, userId: string, isTyping: boolean): Promise<void> {
  const channel = supabase.channel(`typing:${dmId}`);
  
  if (isTyping) {
    await channel.track({ typing: true, user_id: userId });
  } else {
    await channel.untrack();
  }
}
