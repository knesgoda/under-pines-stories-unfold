import { supabase } from '@/integrations/supabase/client';

export interface Ember {
  id: string;
  author_id: string;
  content_ref: string;
  content_type: string;
  created_at: string;
  expires_at: string;
  visibility: string;
  meta: any;
  is_viewed: boolean;
  author_username: string;
  author_display_name: string;
  author_avatar_url: string;
}

export async function getUserEmbers(limit = 20): Promise<Ember[]> {
  const { data, error } = await supabase.rpc('get_user_embers', { p_limit: limit });
  
  if (error) {
    console.error('Error fetching embers:', error);
    return [];
  }
  
  return data || [];
}

export async function markEmberViewed(emberId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('mark_ember_viewed', { p_ember_id: emberId });
  
  if (error) {
    console.error('Error marking ember as viewed:', error);
    return false;
  }
  
  return data;
}

export async function createEmberFromPost(postId: string, visibility = 'public'): Promise<string | null> {
  const { data, error } = await supabase.rpc('create_ember_from_post', { 
    p_post_id: postId, 
    p_visibility: visibility 
  });
  
  if (error) {
    console.error('Error creating ember:', error);
    return null;
  }
  
  return data;
}

export function getTimeRemaining(expiresAt: string): number {
  const now = new Date();
  const expires = new Date(expiresAt);
  return Math.max(0, expires.getTime() - now.getTime());
}

export function getEmberBrightness(createdAt: string, expiresAt: string): number {
  const now = new Date().getTime();
  const created = new Date(createdAt).getTime();
  const expires = new Date(expiresAt).getTime();
  
  const totalLifetime = expires - created;
  const timeElapsed = now - created;
  const remainingRatio = Math.max(0, 1 - (timeElapsed / totalLifetime));
  
  // Brightness ranges from 0.3 to 1.0 based on remaining time
  return 0.3 + (remainingRatio * 0.7);
}

export function formatTimeRemaining(expiresAt: string): string {
  const remaining = getTimeRemaining(expiresAt);
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h left`;
  } else if (minutes > 0) {
    return `${minutes}m left`;
  } else {
    return 'Expiring soon';
  }
}