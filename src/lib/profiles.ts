import { supabase } from "@/integrations/supabase/client"
import type { User } from "@/contexts/AuthContext"

export interface ProfileUpdateData {
  display_name?: string
  bio?: string
  hobbies?: string[]
  interests?: string[]
  places_lived?: string[]
  avatar_url?: string
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

  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}/avatar.${fileExt}`

  // Delete existing avatar first
  await supabase.storage
    .from('avatars')
    .remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.jpeg`, `${user.id}/avatar.png`, `${user.id}/avatar.gif`])

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true })

  if (error) {
    console.error('Error uploading avatar:', error)
    throw error
  }

  const { data: publicUrl } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName)

  return publicUrl.publicUrl
}

export async function deleteAvatar(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { error } = await supabase.storage
    .from('avatars')
    .remove([
      `${user.id}/avatar.jpg`, 
      `${user.id}/avatar.jpeg`, 
      `${user.id}/avatar.png`, 
      `${user.id}/avatar.gif`
    ])

  if (error) {
    console.error('Error deleting avatar:', error)
    throw error
  }
}