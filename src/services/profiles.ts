import { supabase } from '@/integrations/supabase/client'

export type Highlight = {
  id: string
  user_id: string
  title: string
  cover_url?: string | null
  items: Array<{ type: 'image'|'video'; url: string; poster_url?: string }>
  created_at: string
}

export async function listHighlights(userId: string): Promise<Highlight[]> {
  const { data, error } = await supabase
    .from('profile_highlights')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('listHighlights error', error)
    return []
  }
  return data || []
}

export async function createHighlight(title: string, cover_url: string | null, items: Highlight['items']): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('profile_highlights')
    .insert({ user_id: user.id, title, cover_url, items })
    .select('id')
    .single()
  if (error) return null
  return data.id as string
}

export async function deleteHighlight(id: string): Promise<boolean> {
  const { error } = await supabase.from('profile_highlights').delete().eq('id', id)
  return !error
}

