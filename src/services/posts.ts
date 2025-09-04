import { supabase } from '@/integrations/supabase/client';

export interface Post {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  media?: Array<{
    type: 'image' | 'video';
    url: string;
    alt_text?: string;
    poster_url?: string;
  }>;
  author: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
  stats?: {
    reactions: number;
    comments: number;
  };
}

export interface PostWithStats extends Post {
  reaction_counts: Array<{
    emoji: string;
    count: number;
  }>;
  comment_count: number;
}

/**
 * Get posts by a specific user
 */
export async function getUserPosts(userId: string, limit = 20, offset = 0): Promise<PostWithStats[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id,
      content,
      created_at,
      author_id,
      media,
      author:profiles!posts_author_id_fkey(
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('author_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching user posts:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Get reaction counts for all posts
  const postIds = data.map(post => post.id);
  const { data: reactionCounts } = await supabase
    .from('post_reaction_counts')
    .select('post_id, emoji, count')
    .in('post_id', postIds);

  // Get comment counts for all posts
  const { data: commentCounts } = await supabase
    .from('comments')
    .select('post_id')
    .in('post_id', postIds)
    .eq('is_deleted', false);

  // Group reaction counts by post
  const reactionCountsByPost = new Map<string, Array<{ emoji: string; count: number }>>();
  reactionCounts?.forEach(rc => {
    if (!reactionCountsByPost.has(rc.post_id)) {
      reactionCountsByPost.set(rc.post_id, []);
    }
    reactionCountsByPost.get(rc.post_id)!.push({
      emoji: rc.emoji,
      count: rc.count
    });
  });

  // Group comment counts by post
  const commentCountsByPost = new Map<string, number>();
  commentCounts?.forEach(cc => {
    commentCountsByPost.set(cc.post_id, (commentCountsByPost.get(cc.post_id) || 0) + 1);
  });

  // Combine data
  return data.map(post => ({
    ...post,
    reaction_counts: reactionCountsByPost.get(post.id) || [],
    comment_count: commentCountsByPost.get(post.id) || 0
  }));
}

/**
 * Get posts by username
 */
export async function getUserPostsByUsername(username: string, limit = 20, offset = 0): Promise<PostWithStats[]> {
  // First get the user ID
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching user profile:', profileError);
    return [];
  }

  return getUserPosts(profile.id, limit, offset);
}

/**
 * Get total post count for a user
 */
export async function getUserPostCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', userId);

  if (error) {
    console.error('Error fetching user post count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Get total post count by username
 */
export async function getUserPostCountByUsername(username: string): Promise<number> {
  // First get the user ID
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching user profile:', profileError);
    return 0;
  }

  return getUserPostCount(profile.id);
}
