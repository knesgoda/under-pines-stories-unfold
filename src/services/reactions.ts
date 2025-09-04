import { supabase } from '@/integrations/supabase/client';

export interface ReactionCount {
  emoji: string;
  count: number;
}

export interface ReactionCounts {
  [emoji: string]: number;
}

/**
 * Get user's reaction to a post
 */
export async function getUserReaction(postId: string, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('post_reactions')
    .select('emoji')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user reaction:', error);
    return null;
  }

  return data?.emoji || null;
}

/**
 * Set user's reaction to a post (upsert)
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
 * Clear user's reaction to a post
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
export async function getCounts(postIds: string[]): Promise<Record<string, ReactionCounts>> {
  if (postIds.length === 0) return {};

  const { data, error } = await supabase
    .from('post_reactions')
    .select('post_id, emoji')
    .in('post_id', postIds);

  if (error) {
    console.error('Error fetching reaction counts:', error);
    return {};
  }

  const counts: Record<string, ReactionCounts> = {};
  
  // Initialize counts for all posts
  postIds.forEach(postId => {
    counts[postId] = {};
  });

  // Count reactions
  data?.forEach(reaction => {
    const postId = reaction.post_id;
    const emoji = reaction.emoji;
    
    if (!counts[postId]) {
      counts[postId] = {};
    }
    
    counts[postId][emoji] = (counts[postId][emoji] || 0) + 1;
  });

  return counts;
}

/**
 * Get reaction counts for a single post
 */
export async function getPostCounts(postId: string): Promise<ReactionCount[]> {
  const { data, error } = await supabase
    .from('post_reactions')
    .select('emoji')
    .eq('post_id', postId);

  if (error) {
    console.error('Error fetching post reaction counts:', error);
    return [];
  }

  const counts: Record<string, number> = {};
  data?.forEach(reaction => {
    counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
  });

  return Object.entries(counts).map(([emoji, count]) => ({
    emoji,
    count
  }));
}