// Adjust the import to your client location
import { supabase } from "@/integrations/supabase/client";

export interface SearchResult {
  id: string;
  label: string;
  sub?: string;
  avatarUrl?: string;
}

export async function searchUsersPrefix(q: string): Promise<SearchResult[]> {
  if (!q) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, discoverable")
    .ilike("username", `${q}%`)
    .eq("discoverable", true)
    .order("username")
    .limit(8);
  if (error) { console.error(error); return []; }
  return (data || []).map((r) => ({
    id: r.id,
    label: `@${r.username}`,
    sub: r.display_name || "",
    avatarUrl: r.avatar_url || undefined,
  }));
}

export async function searchTagsPrefix(q: string): Promise<SearchResult[]> {
  if (!q) return [];
  const { data, error } = await supabase
    .from("hashtags")
    .select("id, tag, uses_count")
    .ilike("tag", `${q}%`)
    .order("uses_count", { ascending: false })
    .limit(8);
  if (error) { console.error(error); return []; }
  return (data || []).map((r) => ({
    id: r.id,
    label: `#${r.tag}`,
    sub: `${r.uses_count} uses`,
  }));
}

export interface PostSearchResult {
  id: string;
  body: string;
  created_at: string;
  author: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export async function searchPostsFTS(q: string, limit = 20): Promise<PostSearchResult[]> {
  if (!q.trim()) return [];
  
  const { data, error } = await supabase
    .from("posts")
    .select(`
      id,
      body,
      created_at,
      author:profiles!posts_author_id_fkey(
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .textSearch('body', q, {
      type: 'websearch',
      config: 'english'
    })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error searching posts:', error);
    return [];
  }

  return data || [];
}

export async function searchUsers(q: string, limit = 20): Promise<SearchResult[]> {
  if (!q.trim()) return [];
  
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, discoverable")
    .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
    .eq("discoverable", true)
    .order("username")
    .limit(limit);

  if (error) {
    console.error('Error searching users:', error);
    return [];
  }

  return (data || []).map((r) => ({
    id: r.id,
    label: r.username,
    sub: r.display_name || "",
    avatarUrl: r.avatar_url || undefined,
  }));
}

export async function searchHashtags(q: string, limit = 20): Promise<SearchResult[]> {
  if (!q.trim()) return [];
  
  const { data, error } = await supabase
    .from("hashtags")
    .select("id, tag, uses_count")
    .ilike("tag", `%${q}%`)
    .order("uses_count", { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error searching hashtags:', error);
    return [];
  }

  return (data || []).map((r) => ({
    id: r.id,
    label: r.tag,
    sub: `${r.uses_count} uses`,
  }));
}
