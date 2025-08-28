import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(){
  const sb = createClient();
  const [recipes, ings, items] = await Promise.all([
    sb.from('game_recipes').select('*'),
    sb.from('game_recipe_ingredients').select('*'),
    sb.from('game_items').select('slug,name,emoji')
  ]);
  const meta = new Map((items.data||[]).map(i => [i.slug, i]));
  const map = new Map<string, any>();
  (recipes.data||[]).forEach(r => map.set(r.slug, { ...r, ingredients: [] as any[] }));
  (ings.data||[]).forEach(g => {
    const r = [...map.values()].find(x => x.id === g.recipe_id);
    if (r) r.ingredients.push({ ...g, item: meta.get(g.item_slug) });
  });
  return NextResponse.json({ items: [...map.values()] });
}
