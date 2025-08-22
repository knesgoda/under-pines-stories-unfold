import { supabase } from "@/integrations/supabase/client"
import type { User } from "@/contexts/AuthContext"

export interface ProfileUpdateData {
  display_name?: string;
  bio?: string;  
  hobbies?: string[];
  interests?: string[];
  places_lived?: string[];
  avatar_url?: string;
}

export async function getProfileByUsername(username: string): Promise<User | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return profile
}

export async function updateProfile(updates: ProfileUpdateData): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: profile, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    throw error
  }

  return profile
}

export async function uploadAvatar(file: File): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Delete old avatar if exists
  const { data: existingFiles } = await supabase.storage
    .from('avatars')
    .list(user.id)

  if (existingFiles && existingFiles.length > 0) {
    await supabase.storage
      .from('avatars')
      .remove(existingFiles.map(file => `${user.id}/${file.name}`))
  }

  // Upload new avatar
  const fileExt = file.name.split('.').pop()
  const fileName = `avatar.${fileExt}`
  const filePath = `${user.id}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file)

  if (uploadError) {
    console.error('Error uploading avatar:', uploadError)
    throw uploadError
  }

  // Get public URL
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  return data.publicUrl
}

export function getAvatarUrl(avatarUrl?: string): string {
  if (!avatarUrl) return '/placeholder.svg'
  return avatarUrl
}