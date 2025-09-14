import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CraftRequest {
  recipeSlug: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { recipeSlug }: CraftRequest = await req.json();

    // Get recipe details with ingredients
    const { data: recipe, error: recipeError } = await supabaseClient
      .from('recipes')
      .select(`
        *,
        recipe_ingredients (
          item_slug,
          quantity_needed,
          items:item_slug (
            name,
            emoji
          )
        )
      `)
      .eq('slug', recipeSlug)
      .single();

    if (recipeError || !recipe) {
      return new Response(JSON.stringify({ error: 'Recipe not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user's inventory
    const { data: inventory, error: invError } = await supabaseClient
      .from('user_inventory')
      .select('item_slug, quantity')
      .eq('user_id', user.id);

    if (invError) {
      return new Response(JSON.stringify({ error: 'Failed to fetch inventory' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userItems = new Map(inventory?.map(item => [item.item_slug, item.quantity]) || []);

    // Check if user has all required ingredients
    const missingItems: string[] = [];
    for (const ingredient of recipe.recipe_ingredients) {
      const userQuantity = userItems.get(ingredient.item_slug) || 0;
      if (userQuantity < ingredient.quantity_needed) {
        missingItems.push(`${ingredient.items.emoji} ${ingredient.items.name} (need ${ingredient.quantity_needed}, have ${userQuantity})`);
      }
    }

    if (missingItems.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'Missing ingredients',
        missing: missingItems
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check campfire requirement (simplified - assume user is always at campfire for now)
    if (recipe.requires_campfire) {
      console.log('Recipe requires campfire - assuming user is at main campfire');
    }

    // Consume ingredients
    for (const ingredient of recipe.recipe_ingredients) {
      const currentQuantity = userItems.get(ingredient.item_slug) || 0;
      const newQuantity = currentQuantity - ingredient.quantity_needed;

      if (newQuantity <= 0) {
        // Delete the inventory item if quantity becomes 0
        await supabaseClient
          .from('user_inventory')
          .delete()
          .eq('user_id', user.id)
          .eq('item_slug', ingredient.item_slug);
      } else {
        // Update quantity
        await supabaseClient
          .from('user_inventory')
          .update({ quantity: newQuantity })
          .eq('user_id', user.id)
          .eq('item_slug', ingredient.item_slug);
      }
    }

    // Add crafted item to inventory
    await supabaseClient
      .from('user_inventory')
      .upsert({
        user_id: user.id,
        item_slug: recipe.result_item_slug,
        quantity: 1
      }, {
        onConflict: 'user_id,item_slug'
      });

    // If item already exists, increment quantity
    const { data: existingItem } = await supabaseClient
      .from('user_inventory')
      .select('quantity')
      .eq('user_id', user.id)
      .eq('item_slug', recipe.result_item_slug)
      .single();

    if (existingItem) {
      await supabaseClient
        .from('user_inventory')
        .update({ quantity: existingItem.quantity + 1 })
        .eq('user_id', user.id)
        .eq('item_slug', recipe.result_item_slug);
    }

    // Get the crafted item details
    const { data: craftedItem } = await supabaseClient
      .from('items')
      .select('name, emoji')
      .eq('slug', recipe.result_item_slug)
      .single();

    return new Response(JSON.stringify({ 
      success: true,
      crafted: {
        name: craftedItem?.name,
        emoji: craftedItem?.emoji,
        slug: recipe.result_item_slug
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in game-craft function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});