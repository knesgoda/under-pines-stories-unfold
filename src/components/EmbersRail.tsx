import * as React from "react";
import { listEmbersFeed, getEmberCounts, reactToEmber, getUserEmberReaction, subscribeToEmbers, subscribeToEmberReactions, type Ember } from "@/services/embers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Flame, Clock, Eye, Users, EyeOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/hooks/use-toast";

export default function EmbersRail() {
  const [embers, setEmbers] = React.useState<Ember[]>([]);
  const [counts, setCounts] = React.useState<Record<string, Record<string, number>>>({});
  const [userReactions, setUserReactions] = React.useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = React.useState(true);

  const loadEmbers = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await listEmbersFeed({ limit: 40 });
      setEmbers(data);
      
      const ids = data.map((d) => d.id);
      const [countsData, reactionsData] = await Promise.all([
        getEmberCounts(ids),
        Promise.all(ids.map(async (id) => {
          const reaction = await getUserEmberReaction(id);
          return { id, reaction };
        }))
      ]);
      
      setCounts(countsData);
      const reactionsMap: Record<string, string> = {};
      reactionsData.forEach(({ id, reaction }) => {
        if (reaction) reactionsMap[id] = reaction;
      });
      setUserReactions(reactionsMap);
    } catch (error) {
      console.error('Error loading embers:', error);
      toast({
        title: "Error",
        description: "Failed to load embers",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadEmbers();
  }, [loadEmbers]);

  // Realtime subscriptions
  React.useEffect(() => {
    const unsubscribeEmbers = subscribeToEmbers((newEmber) => {
      setEmbers(prev => [newEmber, ...prev.filter(e => e.id !== newEmber.id)]);
    });

    const unsubscribeReactions = subscribeToEmberReactions(async (reaction) => {
      // Reload counts when reactions change
      const emberIds = embers.map(e => e.id);
      if (emberIds.length > 0) {
        const newCounts = await getEmberCounts(emberIds);
        setCounts(prev => ({ ...prev, ...newCounts }));
      }
    });

    return () => {
      unsubscribeEmbers();
      unsubscribeReactions();
    };
  }, [embers]);

  const handleReaction = async (emberId: string, emoji: string) => {
    try {
      const currentReaction = userReactions[emberId];
      
      if (currentReaction === emoji) {
        // Remove reaction
        await reactToEmber(emberId, emoji); // This will toggle it off
        setUserReactions(prev => {
          const newReactions = { ...prev };
          delete newReactions[emberId];
          return newReactions;
        });
      } else {
        // Add new reaction
        await reactToEmber(emberId, emoji);
        setUserReactions(prev => ({ ...prev, [emberId]: emoji }));
      }
      
      // Reload counts
      const newCounts = await getEmberCounts([emberId]);
      setCounts(prev => ({ ...prev, ...newCounts }));
    } catch (error) {
      console.error('Error reacting to ember:', error);
      toast({
        title: "Error",
        description: "Failed to react to ember",
        variant: "destructive"
      });
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Eye className="h-3 w-3" />;
      case 'friends': return <Users className="h-3 w-3" />;
      case 'private': return <EyeOff className="h-3 w-3" />;
      default: return <Eye className="h-3 w-3" />;
    }
  };

  const getTotalReactions = (emberId: string) => {
    const emberCounts = counts[emberId] || {};
    return Object.values(emberCounts).reduce((sum, count) => sum + count, 0);
  };

  if (isLoading) {
    return (
      <div className="mt-3 flex gap-3 overflow-x-auto pb-2 pt-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-28 w-48 shrink-0 rounded-2xl border border-emerald-900/40 bg-emerald-950/30 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (embers.length === 0) {
    return (
      <div className="mt-3 rounded-xl border border-emerald-900/35 bg-[#F8F6F2] p-6 text-center">
        <Flame className="h-8 w-8 text-amber-500 mx-auto mb-2" />
        <p className="text-slate-600">No embers glowing yet. Be the first to ignite one!</p>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 mb-2">
        <Flame className="h-4 w-4 text-amber-500" />
        <h3 className="font-semibold text-emerald-50">Glowing Embers</h3>
      </div>
      
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2 pt-1">
        {embers.map((ember) => (
          <div
            key={ember.id}
            className="group relative h-32 w-52 shrink-0 rounded-2xl border border-emerald-900/40 bg-emerald-950/30 p-3 text-left text-emerald-50 backdrop-blur
                       shadow-[0_6px_18px_rgba(0,0,0,0.28)] hover:shadow-[0_10px_26px_rgba(0,0,0,0.34)] transition-all duration-200"
          >
            {/* Header with avatar and visibility */}
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-6 w-6 border border-emerald-700">
                <AvatarImage src={ember.profiles?.avatar_url || '/placeholder.svg'} alt={ember.profiles?.username || 'User'} />
                <AvatarFallback className="bg-emerald-800 text-emerald-50 text-xs">
                  {ember.profiles?.display_name?.[0] || ember.profiles?.username?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-emerald-200/80 truncate">
                {ember.profiles?.display_name || ember.profiles?.username || 'Unknown'}
              </span>
              <div className="ml-auto flex items-center gap-1">
                {getVisibilityIcon(ember.visibility)}
              </div>
            </div>
            
            {/* Content */}
            <div className="line-clamp-3 text-[13px] leading-5 text-emerald-50/95 mb-2">
              {ember.content}
            </div>
            
            {/* Footer with reactions and time */}
            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleReaction(ember.id, '👍')}
                  className={`text-sm transition-transform hover:scale-110 ${
                    userReactions[ember.id] === '👍' ? 'text-yellow-400' : 'text-emerald-200/80'
                  }`}
                >
                  👍
                </button>
                <button
                  onClick={() => handleReaction(ember.id, '😂')}
                  className={`text-sm transition-transform hover:scale-110 ${
                    userReactions[ember.id] === '😂' ? 'text-yellow-400' : 'text-emerald-200/80'
                  }`}
                >
                  😂
                </button>
                <button
                  onClick={() => handleReaction(ember.id, '🔥')}
                  className={`text-sm transition-transform hover:scale-110 ${
                    userReactions[ember.id] === '🔥' ? 'text-yellow-400' : 'text-emerald-200/80'
                  }`}
                >
                  🔥
                </button>
                {getTotalReactions(ember.id) > 0 && (
                  <span className="text-xs text-emerald-200/80 ml-1">
                    {getTotalReactions(ember.id)}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1 text-xs text-emerald-200/60">
                <Clock className="h-3 w-3" />
                <span>{formatDistanceToNow(new Date(ember.created_at), { addSuffix: true })}</span>
              </div>
            </div>
            
            {/* Glow effect */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-emerald-500/25" />
          </div>
        ))}
      </div>
    </div>
  );
}
