import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get all recipes with their ingredients
    const { data: recipes, error } = await supabaseClient
      .from('recipes')
      .select(`
        slug,
        name,
        description,
        requires_fire,
        requires_campfire,
        recipe_ingredients (
          quantity_needed,
          items:item_slug (
            slug,
            name,
            emoji,
            type,
            rarity
          )
        ),
        result_item:result_item_slug (
          slug,
          name,
          emoji,
          type,
          rarity
        )
      `);

    if (error) {
      console.error('Error fetching recipes:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Transform the data to match expected format
    const items = recipes?.map(recipe => ({
      slug: recipe.slug,
      name: recipe.name,
      description: recipe.description,
      requires_fire: recipe.requires_fire,
      requires_campfire: recipe.requires_campfire,
      result: recipe.result_item,
      ingredients: recipe.recipe_ingredients.map(ing => ({
        item: ing.items,
        item_slug: ing.items.slug,
        qty: ing.quantity_needed
      }))
    })) || [];

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in game-recipes function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});