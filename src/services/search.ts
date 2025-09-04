// Adjust the import to your client location
import { supabase } from "@/integrations/supabase/client";

export async function searchUsersPrefix(q: string) {
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

export async function searchTagsPrefix(q: string) {
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
