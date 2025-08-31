import { supabase } from '@/integrations/supabase/client'

export type DMThread = {
  id: string
  otherUser: {
    id: string
    username: string
    display_name?: string | null
    avatar_url?: string | null
  }
  lastMessage?: {
    id: string
    body: string
    created_at: string
    sender_id: string
  }
  unreadCount: number
  updated_at: string
  memberState: 'active' | 'pending'
}

export type DMMessage = {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
  sender: {
    id: string
    username: string
    display_name?: string | null
    avatar_url?: string | null
  }
}

// Start a conversation with a user
export async function startConversation(targetUserId: string): Promise<{ conversationId: string }> {
  const { data, error } = await supabase.rpc('dm_start', {
    target_user_id: targetUserId
  })
  
  if (error) throw error
  return data as { conversationId: string }
}

// Fetch conversation threads (inbox or requests)
export async function fetchThreads(type: 'inbox' | 'requests' = 'inbox'): Promise<DMThread[]> {
  const { data: conversations, error } = await supabase
    .from('dm_conversations')
    .select(`
      id,
      updated_at,
      dm_members!inner (
        user_id,
        state,
        last_read_at,
        profiles!dm_members_user_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      )
    `)
    .order('updated_at', { ascending: false })

  if (error) throw error

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const threads: DMThread[] = []
  
  for (const conv of conversations || []) {
    const members = conv.dm_members as any[]
    const otherMember = members.find(m => m.user_id !== user.id)
    const currentMember = members.find(m => m.user_id === user.id)
    
    if (!otherMember || !currentMember) continue
    
    // Filter by type - only show active conversations for inbox, pending for requests
    if (type === 'inbox' && currentMember.state !== 'active') continue
    if (type === 'requests' && currentMember.state !== 'pending') continue

    // Get last message
    const { data: lastMessage } = await supabase
      .from('dm_messages')
      .select('id, body, created_at, sender_id')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Count unread messages
    const { count: unreadCount } = await supabase
      .from('dm_messages')
      .select('id', { count: 'exact' })
      .eq('conversation_id', conv.id)
      .gt('created_at', currentMember.last_read_at || '1970-01-01')
      .neq('sender_id', user.id)

    threads.push({
      id: conv.id,
      otherUser: {
        id: otherMember.profiles.id,
        username: otherMember.profiles.username,
        display_name: otherMember.profiles.display_name,
        avatar_url: otherMember.profiles.avatar_url
      },
      lastMessage: lastMessage || undefined,
      unreadCount: unreadCount || 0,
      updated_at: conv.updated_at,
      memberState: currentMember.state
    })
  }

  return threads
}

// Fetch messages for a conversation
export async function fetchMessages(conversationId: string, limit = 50): Promise<DMMessage[]> {
  const { data, error } = await supabase
    .from('dm_messages')
    .select(`
      id,
      conversation_id,
      sender_id,
      body,
      created_at,
      profiles!dm_messages_sender_id_fkey (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) throw error

  return (data || []).map(msg => ({
    id: msg.id,
    conversation_id: msg.conversation_id,
    sender_id: msg.sender_id,
    body: msg.body,
    created_at: msg.created_at,
    sender: {
      id: (msg as any).profiles.id,
      username: (msg as any).profiles.username,
      display_name: (msg as any).profiles.display_name,
      avatar_url: (msg as any).profiles.avatar_url
    }
  }))
}

// Send a message
export async function sendMessage(conversationId: string, body: string): Promise<DMMessage> {
  const { data, error } = await supabase
    .from('dm_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: (await supabase.auth.getUser()).data.user!.id,
      body
    })
    .select(`
      id,
      conversation_id,
      sender_id,
      body,
      created_at,
      profiles!dm_messages_sender_id_fkey (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .single()

  if (error) throw error

  // Update conversation timestamp
  await supabase
    .from('dm_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId)

  return {
    id: data.id,
    conversation_id: data.conversation_id,
    sender_id: data.sender_id,
    body: data.body,
    created_at: data.created_at,
    sender: {
      id: (data as any).profiles.id,
      username: (data as any).profiles.username,
      display_name: (data as any).profiles.display_name,
      avatar_url: (data as any).profiles.avatar_url
    }
  }
}

// Mark thread as read
export async function markThreadRead(conversationId: string): Promise<void> {
  const { error } = await supabase.rpc('dm_mark_read', {
    conversation_id: conversationId
  })
  
  if (error) throw error
}

// Accept or decline a message request
export async function setRequest(conversationId: string, accept: boolean): Promise<void> {
  const { error } = await supabase.rpc('dm_set_request', {
    conversation_id: conversationId,
    accept
  })
  
  if (error) throw error
}