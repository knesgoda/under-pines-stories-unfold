import { supabase } from '@/integrations/supabase/client';

export type RelationshipState = 'requested' | 'accepted' | 'blocked';

export interface Relationship {
  user_id: string;
  target_user_id: string;
  state: RelationshipState;
  created_at: string;
}

/**
 * Send a friend request
 */
export async function sendRequest(userId: string, targetUserId: string): Promise<boolean> {
  const { error } = await supabase
    .from('relationships')
    .insert({
      user_id: userId,
      target_user_id: targetUserId,
      state: 'requested'
    });

  if (error) {
    console.error('Error sending friend request:', error);
    return false;
  }

  return true;
}

/**
 * Accept a friend request
 */
export async function acceptRequest(userId: string, requesterId: string): Promise<boolean> {
  const { error } = await supabase
    .from('relationships')
    .update({ state: 'accepted' })
    .eq('user_id', requesterId)
    .eq('target_user_id', userId)
    .eq('state', 'requested');

  if (error) {
    console.error('Error accepting friend request:', error);
    return false;
  }

  return true;
}

/**
 * Decline a friend request
 */
export async function declineRequest(userId: string, requesterId: string): Promise<boolean> {
  const { error } = await supabase
    .from('relationships')
    .delete()
    .eq('user_id', requesterId)
    .eq('target_user_id', userId)
    .eq('state', 'requested');

  if (error) {
    console.error('Error declining friend request:', error);
    return false;
  }

  return true;
}

/**
 * Block a user
 */
export async function blockUser(userId: string, targetUserId: string): Promise<boolean> {
  // First, update any existing relationship to blocked
  const { error: updateError } = await supabase
    .from('relationships')
    .upsert({
      user_id: userId,
      target_user_id: targetUserId,
      state: 'blocked'
    }, {
      onConflict: 'user_id,target_user_id'
    });

  if (updateError) {
    console.error('Error blocking user:', updateError);
    return false;
  }

  return true;
}

/**
 * Unblock a user
 */
export async function unblockUser(userId: string, targetUserId: string): Promise<boolean> {
  const { error } = await supabase
    .from('relationships')
    .delete()
    .eq('user_id', userId)
    .eq('target_user_id', targetUserId)
    .eq('state', 'blocked');

  if (error) {
    console.error('Error unblocking user:', error);
    return false;
  }

  return true;
}

/**
 * Get relationship status between two users
 */
export async function getRelationshipStatus(
  userId: string, 
  targetUserId: string
): Promise<RelationshipState | null> {
  const { data, error } = await supabase
    .from('relationships')
    .select('state')
    .eq('user_id', userId)
    .eq('target_user_id', targetUserId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching relationship status:', error);
    return null;
  }

  return data?.state || null;
}

/**
 * Get pending friend requests for a user
 */
export async function getPendingRequests(userId: string): Promise<Relationship[]> {
  const { data, error } = await supabase
    .from('relationships')
    .select('*')
    .eq('target_user_id', userId)
    .eq('state', 'requested')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending requests:', error);
    return [];
  }

  return data || [];
}

/**
 * Get friends list for a user
 */
export async function getFriends(userId: string): Promise<Relationship[]> {
  const { data, error } = await supabase
    .from('relationships')
    .select('*')
    .or(`and(user_id.eq.${userId},state.eq.accepted),and(target_user_id.eq.${userId},state.eq.accepted)`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching friends:', error);
    return [];
  }

  return data || [];
}

/**
 * Remove a friend (unfriend)
 */
export async function removeFriend(userId: string, friendId: string): Promise<boolean> {
  const { error } = await supabase
    .from('relationships')
    .delete()
    .or(`and(user_id.eq.${userId},target_user_id.eq.${friendId}),and(user_id.eq.${friendId},target_user_id.eq.${userId})`)
    .eq('state', 'accepted');

  if (error) {
    console.error('Error removing friend:', error);
    return false;
  }

  return true;
}