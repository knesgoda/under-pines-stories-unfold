'use client';
import useSWR from 'swr';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function Pantry(){
  const { data, mutate } = useSWR('/api/game/inventory', async () => {
    const { data, error } = await supabase.functions.invoke('game-inventory');
    if (error) throw error;
    return data;
  });
  const items = data?.items || [];
  const { toast } = useToast();

  async function claimDaily(){
    try {
      const { data: result, error } = await supabase.functions.invoke('game-reward', {
        body: { activityType: 'daily_login' }
      });
      
      if (error) throw error;
      
      if (result.awarded && result.awarded.length > 0) {
        toast({
          title: "Daily rewards claimed! 🎉",
          description: `You earned: ${result.awarded.map((a: { item_slug: string; qty: number }) => `${a.item_slug}×${a.qty}`).join(', ')}`
        });
        mutate();
      } else {
        toast({
          title: "Already claimed",
          description: result.message || "You've already claimed your daily rewards!"
        });
      }
    } catch (error) {
      console.error('Error claiming daily rewards:', error);
      toast({
        title: "Error",
        description: "Failed to claim daily rewards. Please try again.",
        variant: "destructive"
      });
    }
  }

  const groupedItems = items.reduce((groups: any, item: any) => {
    const category = item.type === 'crafted' ? 'Crafted Items' : 
                    item.type === 'tool' ? 'Tools' : 'Ingredients';
    if (!groups[category]) groups[category] = [];
    groups[category].push(item);
    return groups;
  }, {});

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400';
      case 'uncommon': return 'text-green-400';
      case 'rare': return 'text-blue-400';
      case 'epic': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="rounded-lg border border-white/10 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-semibold">Camp Pantry</div>
        <button 
          onClick={claimDaily} 
          className="h-8 px-3 rounded bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
        >
          Claim Daily Kit
        </button>
      </div>
      
      {Object.entries(groupedItems).map(([category, categoryItems]: [string, any]) => (
        <div key={category} className="mb-4">
          <h3 className="text-xs font-medium text-muted-foreground mb-2">{category}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categoryItems.map((item: any) => (
              <div key={item.slug} className="rounded bg-white/5 p-3 hover:bg-white/10 transition-colors">
                <div className="text-2xl mb-1">{item.emoji}</div>
                <div className="text-sm font-medium">{item.name}</div>
                <div className="text-xs text-white/60 mb-1">×{item.qty}</div>
                <div className={`text-xs font-medium ${getRarityColor(item.rarity)}`}>
                  {item.rarity}
                </div>
                {item.description && (
                  <div className="text-xs text-white/40 mt-1 line-clamp-2">
                    {item.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {!items.length && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🏕️</div>
          <div className="text-sm text-white/60">No items yet!</div>
          <div className="text-xs text-white/40 mt-1">
            Earn ingredients by posting, liking, sharing, and sending messages
          </div>
        </div>
      )}
    </div>
  );
}
