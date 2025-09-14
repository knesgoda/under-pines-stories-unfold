'use client';
import useSWR from 'swr';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function CraftPanel(){
  const { data: inv, mutate: mutateInventory } = useSWR('/api/game/inventory', async () => {
    const { data, error } = await supabase.functions.invoke('game-inventory');
    if (error) throw error;
    return data;
  });
  
  const { data: rec } = useSWR('/api/game/recipes', async () => {
    const { data, error } = await supabase.functions.invoke('game-recipes');
    if (error) throw error;
    return data;
  });
  
  const inventory = new Map((inv?.items||[]).map((i: { slug: string; qty: number })=>[i.slug, i.qty]));
  const { toast } = useToast();
  const [crafting, setCrafting] = useState<string | null>(null);

  async function craft(recipeSlug: string, recipeName: string){
    setCrafting(recipeSlug);
    try {
      const { data: result, error } = await supabase.functions.invoke('game-craft', {
        body: { recipeSlug }
      });
      
      if (error) throw error;
      
      if (result.success) {
        toast({
          title: `${result.crafted.emoji} ${recipeName} crafted!`,
          description: `You successfully made a delicious ${recipeName}! 🎉`
        });
        mutateInventory();
      } else {
        toast({
          title: "Crafting failed",
          description: result.error || "Unable to craft this item",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error crafting:', error);
      if (error.missing) {
        toast({
          title: "Missing ingredients",
          description: `You need: ${error.missing.join(', ')}`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Crafting error",
          description: "Failed to craft item. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setCrafting(null);
    }
  }

  const canCraft = (recipe: any) => {
    return recipe.ingredients.every((ing: any) => {
      const userQuantity = inventory.get(ing.item.slug) || 0;
      return userQuantity >= ing.qty;
    });
  };

  return (
    <div className="rounded-lg border border-white/10 p-4 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="text-sm font-semibold">Campfire Crafting</div>
        <div className="text-xl">🔥</div>
      </div>
      
      {(rec?.items||[]).map((recipe: any) => {
        const craftable = canCraft(recipe);
        const isCrafting = crafting === recipe.slug;
        
        return (
          <div key={recipe.slug} className={`rounded p-4 border transition-colors ${
            craftable ? 'bg-green-500/10 border-green-500/20' : 'bg-white/5 border-white/10'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="text-lg">{recipe.result?.emoji}</div>
              <div className="text-sm font-medium">{recipe.name}</div>
              {recipe.requires_fire && <div className="text-sm">🔥</div>}
              {recipe.requires_campfire && <div className="text-sm">🏕️</div>}
            </div>
            
            <div className="text-xs text-white/60 mb-2">{recipe.description}</div>
            
            <div className="text-xs text-white/60 mb-3">
              <div className="font-medium mb-1">Ingredients needed:</div>
              <div className="flex flex-wrap gap-2">
                {recipe.ingredients.map((ing: any, idx: number) => {
                  const userQuantity = inventory.get(ing.item.slug) || 0;
                  const hasEnough = userQuantity >= ing.qty;
                  return (
                    <span 
                      key={idx} 
                      className={`text-xs px-2 py-1 rounded ${
                        hasEnough ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {ing.item.emoji} {ing.item.name} ({userQuantity}/{ing.qty})
                    </span>
                  );
                })}
              </div>
            </div>
            
            <button 
              onClick={() => craft(recipe.slug, recipe.name)} 
              disabled={!craftable || isCrafting}
              className={`h-8 px-3 rounded text-sm transition-colors ${
                craftable 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              {isCrafting ? 'Crafting...' : 'Craft'}
            </button>
          </div>
        );
      })}
      
      {(!rec?.items?.length) && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🔥</div>
          <div className="text-sm text-white/60">No recipes available</div>
        </div>
      )}
    </div>
  );
}
