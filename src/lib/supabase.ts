import { createClient } from '@supabase/supabase-js'

// In Lovable with Supabase integration, these are automatically provided
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Create client - Lovable handles the connection automatically
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Database types based on our schema
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string
          email: string
          bio: string | null
          avatar_url: string | null
          interests: string[] | null
          location: string | null
          website: string | null
          birthday: string | null
          is_private: boolean
          last_active: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name: string
          email: string
          bio?: string | null
          avatar_url?: string | null
          interests?: string[] | null
          location?: string | null
          website?: string | null
          birthday?: string | null
          is_private?: boolean
          last_active?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string
          email?: string
          bio?: string | null
          avatar_url?: string | null
          interests?: string[] | null
          location?: string | null
          website?: string | null
          birthday?: string | null
          is_private?: boolean
          last_active?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          content: string
          privacy: 'public' | 'friends' | 'private'
          tags: string[] | null
          media_urls: string[] | null
          like_count: number
          comment_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          privacy?: 'public' | 'friends' | 'private'
          tags?: string[] | null
          media_urls?: string[] | null
          like_count?: number
          comment_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          privacy?: 'public' | 'friends' | 'private'
          tags?: string[] | null
          media_urls?: string[] | null
          like_count?: number
          comment_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string
        }
      }
      friendships: {
        Row: {
          id: string
          user_id_1: string
          user_id_2: string
          status: 'pending' | 'accepted' | 'blocked'
          created_at: string
        }
        Insert: {
          id?: string
          user_id_1: string
          user_id_2: string
          status?: 'pending' | 'accepted' | 'blocked'
          created_at?: string
        }
        Update: {
          id?: string
          user_id_1?: string
          user_id_2?: string
          status?: 'pending' | 'accepted' | 'blocked'
          created_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string
          avatar_url: string | null
          cover_image_url: string | null
          privacy: 'public' | 'private'
          category: string
          created_by: string
          member_count: number
          post_count: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          avatar_url?: string | null
          cover_image_url?: string | null
          privacy?: 'public' | 'private'
          category: string
          created_by: string
          member_count?: number
          post_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          avatar_url?: string | null
          cover_image_url?: string | null
          privacy?: 'public' | 'private'
          category?: string
          created_by?: string
          member_count?: number
          post_count?: number
          created_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: 'admin' | 'moderator' | 'member'
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: 'admin' | 'moderator' | 'member'
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: 'admin' | 'moderator' | 'member'
          joined_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          participant_ids: string[]
          last_message_id: string | null
          last_activity: string
          created_at: string
        }
        Insert: {
          id?: string
          participant_ids: string[]
          last_message_id?: string | null
          last_activity?: string
          created_at?: string
        }
        Update: {
          id?: string
          participant_ids?: string[]
          last_message_id?: string | null
          last_activity?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          message_type: 'text' | 'image' | 'file'
          media_url: string | null
          file_name: string | null
          file_size: number | null
          is_edited: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          message_type?: 'text' | 'image' | 'file'
          media_url?: string | null
          file_name?: string | null
          file_size?: number | null
          is_edited?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          message_type?: 'text' | 'image' | 'file'
          media_url?: string | null
          file_name?: string | null
          file_size?: number | null
          is_edited?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      message_reads: {
        Row: {
          id: string
          message_id: string
          user_id: string
          read_at: string
        }
        Insert: {
          id?: string
          message_id: string
          user_id: string
          read_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          user_id?: string
          read_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'like' | 'comment' | 'friend_request' | 'friend_accepted' | 'group_invite' | 'group_join' | 'message' | 'mention' | 'group_post'
          from_user_id: string
          post_id: string | null
          group_id: string | null
          message_id: string | null
          message: string
          is_read: boolean
          priority: 'low' | 'medium' | 'high'
          action_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'like' | 'comment' | 'friend_request' | 'friend_accepted' | 'group_invite' | 'group_join' | 'message' | 'mention' | 'group_post'
          from_user_id: string
          post_id?: string | null
          group_id?: string | null
          message_id?: string | null
          message: string
          is_read?: boolean
          priority?: 'low' | 'medium' | 'high'
          action_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'like' | 'comment' | 'friend_request' | 'friend_accepted' | 'group_invite' | 'group_join' | 'message' | 'mention' | 'group_post'
          from_user_id?: string
          post_id?: string | null
          group_id?: string | null
          message_id?: string | null
          message?: string
          is_read?: boolean
          priority?: 'low' | 'medium' | 'high'
          action_url?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}