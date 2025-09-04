import { supabase } from "@/integrations/supabase/client";

export interface Ember {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  visibility: 'public' | 'friends' | 'private';
  ttl_hours: number;
  created_at: string;
  expires_at: string;
  profiles?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export interface EmberReaction {
  id: string;
  ember_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export async function createEmber({ 
  content, 
  image_url, 
  visibility = "public", 
  ttl_hours = 48 
}: {
  content: string; 
  image_url?: string; 
  visibility?: "public"|"friends"|"private"; 
  ttl_hours?: number;
}) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("Not signed in");
  
  const { data, error } = await supabase.from("embers")
    .insert({ user_id: user.id, content, image_url, visibility, ttl_hours })
    .select("id, created_at, expires_at")
    .single();
    
  if (error) throw error;
  return data;
}

export async function listEmbersFeed({ limit = 32 } = {}) {
  const { data, error } = await supabase
    .from("embers")
    .select(`
      id,
      user_id,
      content,
      image_url,
      created_at,
      expires_at,
      visibility,
      profiles!inner(id,username,display_name,avatar_url)
    `)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(limit);
    
  if (error) throw error;
  return data ?? [];
}

export async function listUserEmbers(userId: string, { limit = 20 } = {}) {
  const { data, error } = await supabase
    .from("embers")
    .select(`
      id,
      user_id,
      content,
      image_url,
      created_at,
      expires_at,
      visibility,
      profiles!inner(id,username,display_name,avatar_url)
    `)
    .eq("user_id", userId)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(limit);
    
  if (error) throw error;
  return data ?? [];
}

export async function reactToEmber(emberId: string, emoji: string) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("Not signed in");
  
  const { error } = await supabase
    .from("ember_reactions")
    .upsert({ ember_id: emberId, user_id: user.id, emoji }, { onConflict: "ember_id,user_id" });
    
  if (error) throw error;
}

export async function clearEmberReaction(emberId: string) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("Not signed in");
  
  const { error } = await supabase
    .from("ember_reactions")
    .delete()
    .eq("ember_id", emberId)
    .eq("user_id", user.id);
    
  if (error) throw error;
}

export async function getEmberCounts(emberIds: string[]) {
  if (!emberIds.length) return {};
  
  const { data, error } = await supabase
    .from("ember_reaction_counts")
    .select("*")
    .in("ember_id", emberIds);
    
  if (error) throw error;
  
  const map: Record<string, Record<string, number>> = {};
  for (const r of data ?? []) {
    map[r.ember_id] ??= {};
    map[r.ember_id][r.emoji] = r.count;
  }
  
  return map;
}

export async function getUserEmberReaction(emberId: string) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return null;
  
  const { data, error } = await supabase
    .from("ember_reactions")
    .select("emoji")
    .eq("ember_id", emberId)
    .eq("user_id", user.id)
    .maybeSingle();
    
  if (error) throw error;
  return data?.emoji || null;
}

export async function deleteEmber(emberId: string) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("Not signed in");
  
  const { error } = await supabase
    .from("embers")
    .delete()
    .eq("id", emberId)
    .eq("user_id", user.id);
    
  if (error) throw error;
}

// Realtime subscriptions
export function subscribeToEmbers(callback: (ember: Ember) => void): () => void {
  const subscription = supabase
    .channel('embers-feed')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'embers'
      },
      async (payload) => {
        const ember = payload.new as Ember;
        
        // Fetch profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .eq('id', ember.user_id)
          .single();
          
        callback({ ...ember, profiles: profile });
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

export function subscribeToEmberReactions(callback: (reaction: EmberReaction) => void): () => void {
  const subscription = supabase
    .channel('ember-reactions')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'ember_reactions'
      },
      (payload) => {
        const reaction = payload.new || payload.old;
        if (reaction) {
          callback(reaction as EmberReaction);
        }
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}
