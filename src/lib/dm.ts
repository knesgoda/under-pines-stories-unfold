import { supabase } from '@/integrations/supabase/client'

export interface DMThread {
  id: string
  other_user: {
    id: string
    username: string
    display_name?: string
    avatar_url?: string
  }
  last_message?: DMMessage
  unread_count: number
  state: 'active' | 'pending'
  last_read_at: string
}

export interface DMMessage {
  id: string
  conversation_id: string
  author_id: string
  body: string
  attachments: Attachment[]
  created_at: string
  is_deleted: boolean
}

export interface Attachment {
  type: 'image' | 'video'
  [key: string]: unknown
}

// Start a conversation or fetch existing conversation id
export async function startConversation(otherUserId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase.rpc('dm_start', {
    p_me: user.id,
    p_other: otherUserId
  })

  if (error) throw error
  return data as string
}

// Fetch threads for inbox or requests
export async function fetchThreads(box: 'inbox' | 'requests', limit = 20) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const state = box === 'inbox' ? 'active' : 'pending'
  const { data, error } = await supabase
    .from('dm_members')
    .select('conversation_id, state, last_read_at, dm_conversations (*), profiles!dm_members_user_id_fkey (*)')
    .eq('user_id', user.id)
    .eq('state', state)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export async function fetchMessages(conversationId: string, after?: string, limit = 50) {
  const query = supabase
    .from('dm_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit)
  if (after) query.gt('created_at', after)
  const { data, error } = await query
  if (error) throw error
  return data as DMMessage[]
}

export async function sendMessage(conversationId: string, text: string, attachments: Attachment[] = []) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('dm_messages')
    .insert({
      conversation_id: conversationId,
      author_id: user.id,
      body: text,
      attachments
    })
    .select()
    .single()
  if (error) throw error
  return data as DMMessage
}

export async function markThreadRead(conversationId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { error } = await supabase.rpc('dm_mark_read', {
    p_me: user.id,
    p_conversation: conversationId
  })
  if (error) throw error
}
