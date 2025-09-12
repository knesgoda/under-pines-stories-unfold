export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      beta_testers: {
        Row: {
          invited_at: string | null
          note: string | null
          user_id: string
        }
        Insert: {
          invited_at?: string | null
          note?: string | null
          user_id: string
        }
        Update: {
          invited_at?: string | null
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "beta_testers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          body: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          post_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          post_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_conversations: {
        Row: {
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      dm_members: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          last_read_at: string | null
          state: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          last_read_at?: string | null
          state?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          last_read_at?: string | null
          state?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "dm_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_messages: {
        Row: {
          attachments: Json | null
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          attachments?: Json | null
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          attachments?: Json | null
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "dm_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ember_views: {
        Row: {
          ember_id: string
          id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          ember_id: string
          id?: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          ember_id?: string
          id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ember_views_ember_id_fkey"
            columns: ["ember_id"]
            isOneToOne: false
            referencedRelation: "embers"
            referencedColumns: ["id"]
          },
        ]
      }
      embers: {
        Row: {
          author_id: string
          content_ref: string
          content_type: string
          created_at: string
          expires_at: string
          id: string
          meta: Json | null
          status: string
          visibility: string
        }
        Insert: {
          author_id: string
          content_ref: string
          content_type?: string
          created_at?: string
          expires_at?: string
          id?: string
          meta?: Json | null
          status?: string
          visibility?: string
        }
        Update: {
          author_id?: string
          content_ref?: string
          content_type?: string
          created_at?: string
          expires_at?: string
          id?: string
          meta?: Json | null
          status?: string
          visibility?: string
        }
        Relationships: []
      }
      follow_requests: {
        Row: {
          created_at: string | null
          request_id: string
          requester_id: string
          target_id: string
        }
        Insert: {
          created_at?: string | null
          request_id?: string
          requester_id: string
          target_id: string
        }
        Update: {
          created_at?: string | null
          request_id?: string
          requester_id?: string
          target_id?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string | null
          followee_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string | null
          followee_id: string
          follower_id: string
        }
        Update: {
          created_at?: string | null
          followee_id?: string
          follower_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_followee_id_fkey"
            columns: ["followee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mutes: {
        Row: {
          created_at: string | null
          muted_id: string
          muter_id: string
        }
        Insert: {
          created_at?: string | null
          muted_id: string
          muter_id: string
        }
        Update: {
          created_at?: string | null
          muted_id?: string
          muter_id?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reaction_counts: {
        Row: {
          counts: Json | null
          post_id: string
          updated_at: string | null
        }
        Insert: {
          counts?: Json | null
          post_id: string
          updated_at?: string | null
        }
        Update: {
          counts?: Json | null
          post_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      post_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          body: string
          created_at: string | null
          has_media: boolean | null
          id: string
          is_deleted: boolean | null
          like_count: number | null
          media: Json | null
          share_count: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string | null
          has_media?: boolean | null
          id?: string
          is_deleted?: boolean | null
          like_count?: number | null
          media?: Json | null
          share_count?: number | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string | null
          has_media?: boolean | null
          id?: string
          is_deleted?: boolean | null
          like_count?: number | null
          media?: Json | null
          share_count?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          discoverable: boolean
          display_name: string | null
          email: string
          hobbies: string[] | null
          id: string
          interests: string[] | null
          places_lived: string[] | null
          search_document: unknown | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          discoverable?: boolean
          display_name?: string | null
          email?: string
          hobbies?: string[] | null
          id: string
          interests?: string[] | null
          places_lived?: string[] | null
          search_document?: unknown | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          discoverable?: boolean
          display_name?: string | null
          email?: string
          hobbies?: string[] | null
          id?: string
          interests?: string[] | null
          places_lived?: string[] | null
          search_document?: unknown | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          comment_id: string | null
          created_at: string | null
          id: string
          post_id: string | null
          reason: string
          reporter_id: string
          status: string
          target_user_id: string | null
        }
        Insert: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
          reason: string
          reporter_id: string
          status?: string
          target_user_id?: string | null
        }
        Update: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
          reason?: string
          reporter_id?: string
          status?: string
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          is_admin: boolean
          user_id: string
        }
        Insert: {
          is_admin?: boolean
          user_id: string
        }
        Update: {
          is_admin?: boolean
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          is_private: boolean
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          is_private?: boolean
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          is_private?: boolean
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_mutual_follows: {
        Row: {
          friend_id: string | null
          friendship_started: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follows_followee_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      clear_post_reaction: {
        Args: { p_post_id: string }
        Returns: undefined
      }
      create_draft_post: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      create_ember_from_post: {
        Args: { p_post_id: string; p_visibility?: string }
        Returns: string
      }
      create_notification: {
        Args: {
          p_actor: string
          p_comment?: string
          p_meta?: Json
          p_post?: string
          p_type: string
          p_user: string
        }
        Returns: string
      }
      dm_mark_read: {
        Args: { conversation_id: string }
        Returns: Json
      }
      dm_set_request: {
        Args: { accept: boolean; conversation_id: string }
        Returns: Json
      }
      dm_start: {
        Args: { target_user_id: string }
        Returns: Json
      }
      feed_author_ids: {
        Args: { p_user: string }
        Returns: {
          author_id: string
        }[]
      }
      feed_following: {
        Args: { p_before?: string; p_limit?: number; p_user: string }
        Returns: {
          author_id: string
          body: string
          created_at: string
          has_media: boolean
          id: string
          is_deleted: boolean
          like_count: number
          media: Json
          share_count: number
          status: string
        }[]
      }
      get_post_comments: {
        Args: {
          p_before?: string
          p_limit?: number
          p_post: string
          p_preview_replies?: number
          p_viewer: string
        }
        Returns: Json
      }
      get_post_like_count: {
        Args: { p_post_id: string }
        Returns: number
      }
      get_post_reaction_summary: {
        Args: { p_post_id: string }
        Returns: Json
      }
      get_public_profile: {
        Args: { profile_id: string }
        Returns: {
          avatar_url: string
          bio: string
          created_at: string
          discoverable: boolean
          display_name: string
          hobbies: string[]
          id: string
          interests: string[]
          places_lived: string[]
          username: string
        }[]
      }
      get_safe_public_profile: {
        Args: { profile_id: string }
        Returns: {
          avatar_url: string
          bio: string
          created_at: string
          discoverable: boolean
          display_name: string
          hobbies: string[]
          id: string
          interests: string[]
          places_lived: string[]
          username: string
        }[]
      }
      get_user_embers: {
        Args: { p_limit?: number }
        Returns: {
          author_avatar_url: string
          author_display_name: string
          author_id: string
          author_username: string
          content_ref: string
          content_type: string
          created_at: string
          expires_at: string
          id: string
          is_viewed: boolean
          meta: Json
          visibility: string
        }[]
      }
      is_profile_discoverable: {
        Args: { profile_user_id: string }
        Returns: boolean
      }
      mark_ember_viewed: {
        Args: { p_ember_id: string }
        Returns: boolean
      }
      metrics_snapshot: {
        Args: { p_days?: number }
        Returns: Json
      }
      publish_post: {
        Args: { p_body: string; p_media?: Json; p_post_id: string }
        Returns: {
          author_id: string
          body: string
          created_at: string | null
          has_media: boolean | null
          id: string
          is_deleted: boolean | null
          like_count: number | null
          media: Json | null
          share_count: number | null
          status: string
          updated_at: string | null
        }
      }
      search_people: {
        Args: { p_limit?: number; p_q: string; p_viewer: string }
        Returns: {
          avatar_url: string
          bio: string
          discoverable: boolean
          display_name: string
          id: string
          is_private: boolean
          rank: number
          relation: string
          username: string
        }[]
      }
      suggestions_for_user: {
        Args: { p_limit?: number; p_user: string }
        Returns: {
          avatar_url: string
          display_name: string
          followers: number
          id: string
          username: string
        }[]
      }
      update_post_reaction_counts: {
        Args: { p_post_id: string }
        Returns: undefined
      }
      upsert_post_reaction: {
        Args: { p_post_id: string; p_reaction: string }
        Returns: undefined
      }
      user_liked_post: {
        Args: { p_post_id: string }
        Returns: boolean
      }
      user_post_reaction: {
        Args: { p_post_id: string }
        Returns: string
      }
      validate_user_content: {
        Args: { content: string; max_length?: number }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
