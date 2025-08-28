import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(){
  const sb = createClient(); const { data:u } = await sb.auth.getUser();
  if(!u?.user) return NextResponse.json({ items: [] });
  const [inv, items] = await Promise.all([
    sb.from('inventories').select('item_slug, qty').eq('user_id', u.user.id),
    sb.from('game_items').select('slug, name, emoji, kind')
  ]);
  const meta = new Map((items.data||[]).map(i => [i.slug, i]));
  const rows = (inv.data||[]).filter(r=>r.qty>0).map(r => ({ ...meta.get(r.item_slug), qty: r.qty }));
  return NextResponse.json({ items: rows });
}
