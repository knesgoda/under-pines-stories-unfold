import { supabase } from '@/integrations/supabase/client';

export interface Relationship {
  user_id: string;
  target_user_id: string;
  state: 'requested' | 'accepted' | 'blocked';
  created_at: string;
  updated_at: string;
}

export interface RelationshipWithUser extends Relationship {
  user: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
  target_user: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

/**
 * Send a friend request
 */
export async function sendRequest(targetUserId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('relationships')
    .insert({
      user_id: user.id,
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
export async function acceptRequest(userId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Update the request to accepted
  const { error: updateError } = await supabase
    .from('relationships')
    .update({ 
      state: 'accepted',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('target_user_id', user.id);

  if (updateError) {
    console.error('Error accepting friend request:', updateError);
    return false;
  }

  // Create the reciprocal relationship
  const { error: insertError } = await supabase
    .from('relationships')
    .insert({
      user_id: user.id,
      target_user_id: userId,
      state: 'accepted'
    });

  if (insertError) {
    console.error('Error creating reciprocal relationship:', insertError);
    return false;
  }

  return true;
}

/**
 * Decline a friend request
 */
export async function declineRequest(userId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('relationships')
    .delete()
    .eq('user_id', userId)
    .eq('target_user_id', user.id);

  if (error) {
    console.error('Error declining friend request:', error);
    return false;
  }

  return true;
}

/**
 * Block a user
 */
export async function blockUser(targetUserId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Delete any existing relationship
  await supabase
    .from('relationships')
    .delete()
    .or(`and(user_id.eq.${user.id},target_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},target_user_id.eq.${user.id})`);

  // Create block relationship
  const { error } = await supabase
    .from('relationships')
    .insert({
      user_id: user.id,
      target_user_id: targetUserId,
      state: 'blocked'
    });

  if (error) {
    console.error('Error blocking user:', error);
    return false;
  }

  return true;
}

/**
 * Unblock a user
 */
export async function unblockUser(targetUserId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('relationships')
    .delete()
    .eq('user_id', user.id)
    .eq('target_user_id', targetUserId)
    .eq('state', 'blocked');

  if (error) {
    console.error('Error unblocking user:', error);
    return false;
  }

  return true;
}

/**
 * Unfriend a user
 */
export async function unfriendUser(targetUserId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('relationships')
    .delete()
    .or(`and(user_id.eq.${user.id},target_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},target_user_id.eq.${user.id})`);

  if (error) {
    console.error('Error unfriending user:', error);
    return false;
  }

  return true;
}

/**
 * Get pending friend requests (received)
 */
export async function getPendingRequests(): Promise<RelationshipWithUser[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('relationships')
    .select(`
      *,
      user:profiles!relationships_user_id_fkey(
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('target_user_id', user.id)
    .eq('state', 'requested')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting pending requests:', error);
    return [];
  }

  return data || [];
}

/**
 * Get sent friend requests
 */
export async function getSentRequests(): Promise<RelationshipWithUser[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('relationships')
    .select(`
      *,
      target_user:profiles!relationships_target_user_id_fkey(
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('user_id', user.id)
    .eq('state', 'requested')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting sent requests:', error);
    return [];
  }

  return data || [];
}

/**
 * Get friends list
 */
export async function getFriends(): Promise<RelationshipWithUser[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('relationships')
    .select(`
      *,
      target_user:profiles!relationships_target_user_id_fkey(
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('user_id', user.id)
    .eq('state', 'accepted')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error getting friends:', error);
    return [];
  }

  return data || [];
}

/**
 * Get relationship status between current user and target user
 */
export async function getRelationshipStatus(targetUserId: string): Promise<Relationship | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('relationships')
    .select('*')
    .eq('user_id', user.id)
    .eq('target_user_id', targetUserId)
    .maybeSingle();

  if (error) {
    console.error('Error getting relationship status:', error);
    return null;
  }

  return data;
}

/**
 * Check if users are friends
 */
export async function areFriends(targetUserId: string): Promise<boolean> {
  const relationship = await getRelationshipStatus(targetUserId);
  return relationship?.state === 'accepted' || false;
}

/**
 * Check if user is blocked
 */
export async function isBlocked(targetUserId: string): Promise<boolean> {
  const relationship = await getRelationshipStatus(targetUserId);
  return relationship?.state === 'blocked' || false;
}
