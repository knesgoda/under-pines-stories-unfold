import { supabase } from "@/integrations/supabase/client";

export type Ember = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  expires_at: string;
};

export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

export type EmberGroup = {
  user: Profile;
  items: Ember[];            // newest -> oldest
  hasUnseen: boolean;
  lastAt: string;            // newest created_at in group
};

export async function fetchEmberGroups(): Promise<EmberGroup[]> {
  const user = (await supabase.auth.getUser()).data.user;
  const me = user?.id;

  // 1) Get active embers with author profile
  const { data: rows, error } = await supabase
    .from("embers")
    .select("id,user_id,content,image_url,created_at,expires_at,profiles!inner(id,username,display_name,avatar_url)")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;
  const embers: (Ember & { profiles: Profile })[] = rows || [];

  // 2) Get what I've seen (last 72h to keep it light)
  const seenSet = new Set<string>();
  if (me) {
    const since = new Date(Date.now() - 72 * 3600 * 1000).toISOString();
    const { data: seen } = await supabase
      .from("ember_views")
      .select("ember_id")
      .gte("seen_at", since)
      .eq("user_id", me);
    seen?.forEach((r) => seenSet.add(r.ember_id));
  }

  // 3) Group by author
  const byUser = new Map<string, EmberGroup>();
  for (const e of embers) {
    const u = e.user_id;
    const g = byUser.get(u) || {
      user: e.profiles,
      items: [],
      hasUnseen: false,
      lastAt: e.created_at,
    };
    g.items.push({
      id: e.id, user_id: e.user_id, content: e.content,
      image_url: e.image_url, created_at: e.created_at, expires_at: e.expires_at
    });
    if (!seenSet.has(e.id)) g.hasUnseen = true;
    if (e.created_at > g.lastAt) g.lastAt = e.created_at;
    byUser.set(u, g);
  }

  // newest authors first
  return [...byUser.values()].sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));
}

export async function markSeen(emberId: string) {
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return;
  await supabase.from("ember_views").upsert({ ember_id: emberId, user_id: uid }, { onConflict: "ember_id,user_id" });
}
