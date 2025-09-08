import { supabase } from "@/integrations/supabase/client"

// Private profile data (includes email) - only visible to the profile owner
export interface User {
  id: string
  username: string
  display_name?: string
  avatar_url?: string
  email: string
  bio?: string
  website?: string
  hobbies?: string[]
  interests?: string[]
  places_lived?: string[]
  created_at: string
  updated_at: string
}

// Public profile data (no email) - visible to other users
export interface PublicProfile {
  id: string
  username: string
  display_name?: string
  avatar_url?: string
  profile_cover_url?: string
  bio?: string
  website?: string
  hobbies?: string[]
  interests?: string[]
  places_lived?: string[]
  created_at: string
  updated_at: string
}

export interface ProfileUpdateData {
  display_name?: string
  bio?: string
  website?: string
  hobbies?: string[]
  interests?: string[]
  places_lived?: string[]
  avatar_url?: string
}

export type Relation = 
  | 'self'
  | 'none'
  | 'requested'     // you requested them
  | 'following'     // you follow them
  | 'follows_you'   // they follow you
  | 'mutual'       // both follow

export interface ProfileWithRelation extends PublicProfile {
  relation: Relation
  isPrivate: boolean
  requestId?: string | null
  isIncomingRequest?: boolean
  followerCount?: number
  followingCount?: number
  pinned_post_ids?: string[]
}

export async function getProfileByUsername(username: string): Promise<ProfileWithRelation | null> {
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, profile_cover_url, pinned_post_ids, bio, hobbies, interests, places_lived, discoverable, created_at, updated_at')
    .eq('username', username)
    .maybeSingle()

  if (error || !profile) return null

  // If no current user, return basic profile
  if (!currentUser) {
    return {
      ...profile,
      relation: 'none',
      isPrivate: false
    }
  }

  // Get privacy settings - only accessible if logged in
  const { data: settings } = await supabase
    .from('user_settings')
    .select('is_private')
    .eq('user_id', profile.id)
    .maybeSingle()

  const isPrivate = settings?.is_private ?? false

  // Get follower/following counts
  const [{ count: followerCount }, { count: followingCount }] = await Promise.all([
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('followee_id', profile.id),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profile.id)
  ])

  // If it's the current user's profile
  if (currentUser.id === profile.id) {
    return {
      ...profile,
      relation: 'self',
      isPrivate,
      followerCount: followerCount || 0,
      followingCount: followingCount || 0
    }
  }

  // Check relationships
  const [
    { data: followingThem },
    { data: followingMe },
    { data: outgoingRequest },
    { data: incomingRequest }
  ] = await Promise.all([
    supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', currentUser.id)
      .eq('followee_id', profile.id)
      .maybeSingle(),
    supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', profile.id)
      .eq('followee_id', currentUser.id)
      .maybeSingle(),
    supabase
      .from('follow_requests')
      .select('request_id')
      .eq('requester_id', currentUser.id)
      .eq('target_id', profile.id)
      .maybeSingle(),
    supabase
      .from('follow_requests')
      .select('request_id')
      .eq('requester_id', profile.id)
      .eq('target_id', currentUser.id)
      .maybeSingle()
  ])

  // Determine relation
  let relation: Relation = 'none'
  let requestId: string | null = null
  let isIncomingRequest = false

  if (followingThem && followingMe) {
    relation = 'mutual'
  } else if (followingThem) {
    relation = 'following'
  } else if (followingMe) {
    relation = 'follows_you'
  } else if (outgoingRequest) {
    relation = 'requested'
    requestId = outgoingRequest.request_id
  } else if (incomingRequest) {
    relation = 'follows_you' // They want to follow you
    requestId = incomingRequest.request_id
    isIncomingRequest = true
  }

  return {
    ...profile,
    relation,
    isPrivate,
    requestId,
    isIncomingRequest,
    followerCount: followerCount || 0,
    followingCount: followingCount || 0
  }
}

// Get current user's own profile (includes email)
export async function getCurrentUserProfile(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio, hobbies, interests, places_lived, discoverable, created_at, updated_at, email')
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw error
  return profile as User
}

export async function updateProfile(updates: ProfileUpdateData): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: profile, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)
    .select('id, username, display_name, avatar_url, bio, hobbies, interests, places_lived, discoverable, created_at, updated_at, email')
    .single()

  if (error) throw error
  return profile as User
}

export async function uploadAvatar(file: File): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Delete existing avatar if it exists
  await deleteAvatar().catch(() => {}) // Ignore errors

  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}/avatar.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { 
      cacheControl: '3600',
      upsert: true
    })

  if (uploadError) throw uploadError

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName)

  // Update profile with new avatar URL
  await updateProfile({ avatar_url: data.publicUrl })

  return data.publicUrl
}

export async function deleteAvatar(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Get current profile to find avatar path
  const { data: profile } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.avatar_url) {
    // Extract path from URL
    const url = new URL(profile.avatar_url)
    const path = url.pathname.split('/storage/v1/object/public/avatars/')[1]
    
    if (path) {
      await supabase.storage
        .from('avatars')
        .remove([path])
    }
  }

  // Clear avatar URL from profile
  await updateProfile({ avatar_url: undefined })
}