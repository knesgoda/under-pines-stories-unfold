import { supabase } from '@/integrations/supabase/client';

export interface Reaction {
  id: string;
  post_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface ReactionCount {
  post_id: string;
  emoji: string;
  count: number;
}

export interface UserReaction {
  post_id: string;
  emoji: string;
}

/**
 * Get user's reaction for a specific post
 */
export async function getUserReaction(postId: string, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('post_reactions')
    .select('emoji')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error getting user reaction:', error);
    return null;
  }

  return data?.emoji || null;
}

/**
 * Set a reaction for a post (upsert)
 */
export async function setReaction(postId: string, userId: string, emoji: string): Promise<boolean> {
  const { error } = await supabase
    .from('post_reactions')
    .upsert({
      post_id: postId,
      user_id: userId,
      emoji
    }, {
      onConflict: 'post_id,user_id'
    });

  if (error) {
    console.error('Error setting reaction:', error);
    return false;
  }

  return true;
}

/**
 * Clear a user's reaction for a post
 */
export async function clearReaction(postId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('post_reactions')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error clearing reaction:', error);
    return false;
  }

  return true;
}

/**
 * Get reaction counts for multiple posts
 */
export async function getCounts(postIds: string[]): Promise<ReactionCount[]> {
  if (postIds.length === 0) return [];

  const { data, error } = await supabase
    .from('post_reaction_counts')
    .select('*')
    .in('post_id', postIds);

  if (error) {
    console.error('Error getting reaction counts:', error);
    return [];
  }

  return data || [];
}

/**
 * Get reaction counts for a single post
 */
export async function getPostCounts(postId: string): Promise<ReactionCount[]> {
  const { data, error } = await supabase
    .from('post_reaction_counts')
    .select('*')
    .eq('post_id', postId);

  if (error) {
    console.error('Error getting post reaction counts:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all reactions for a post with user details
 */
export async function getPostReactions(postId: string): Promise<Array<Reaction & { user: { username: string; avatar_url?: string } }>> {
  const { data, error } = await supabase
    .from('post_reactions')
    .select(`
      *,
      user:profiles!post_reactions_user_id_fkey(
        username,
        avatar_url
      )
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting post reactions:', error);
    return [];
  }

  return data || [];
}

/**
 * Subscribe to reaction changes for a post
 */
export function subscribeToPostReactions(
  postId: string,
  onReactionChange: (reaction: Reaction) => void
) {
  return supabase
    .channel(`post_reactions:${postId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'post_reactions',
        filter: `post_id=eq.${postId}`
      },
      (payload) => {
        onReactionChange(payload.new as Reaction);
      }
    )
    .subscribe();
}

/**
 * Subscribe to reaction changes for multiple posts
 */
export function subscribeToMultiplePostReactions(
  postIds: string[],
  onReactionChange: (reaction: Reaction) => void
) {
  if (postIds.length === 0) return null;

  return supabase
    .channel(`post_reactions:multiple`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'post_reactions',
        filter: `post_id=in.(${postIds.join(',')})`
      },
      (payload) => {
        onReactionChange(payload.new as Reaction);
      }
    )
    .subscribe();
}
