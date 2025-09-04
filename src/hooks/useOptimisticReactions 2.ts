import { useState, useCallback } from 'react';
import { setReaction, clearReaction, type ReactionCounts } from '@/services/reactions';

export interface OptimisticReactionState {
  userReaction: string | null;
  counts: ReactionCounts;
  isUpdating: boolean;
}

export function useOptimisticReactions(
  postId: string,
  userId: string,
  initialUserReaction: string | null,
  initialCounts: ReactionCounts
) {
  const [state, setState] = useState<OptimisticReactionState>({
    userReaction: initialUserReaction,
    counts: initialCounts,
    isUpdating: false
  });

  const updateReaction = useCallback(async (emoji: string) => {
    if (state.isUpdating) return;

    const currentReaction = state.userReaction;
    const currentCounts = { ...state.counts };

    // Optimistic update
    setState(prev => ({
      ...prev,
      isUpdating: true,
      userReaction: currentReaction === emoji ? null : emoji,
      counts: (() => {
        const newCounts = { ...prev.counts };
        
        // Remove old reaction
        if (currentReaction && newCounts[currentReaction]) {
          newCounts[currentReaction] = Math.max(0, newCounts[currentReaction] - 1);
          if (newCounts[currentReaction] === 0) {
            delete newCounts[currentReaction];
          }
        }
        
        // Add new reaction (if different from current)
        if (currentReaction !== emoji) {
          newCounts[emoji] = (newCounts[emoji] || 0) + 1;
        }
        
        return newCounts;
      })()
    }));

    try {
      // Perform actual update
      if (currentReaction === emoji) {
        // Remove reaction
        await clearReaction(postId, userId);
      } else {
        // Set new reaction
        await setReaction(postId, userId, emoji);
      }
    } catch (error) {
      console.error('Error updating reaction:', error);
      
      // Rollback optimistic update on error
      setState(prev => ({
        ...prev,
        userReaction: currentReaction,
        counts: currentCounts,
        isUpdating: false
      }));
      return;
    }

    // Update completed successfully
    setState(prev => ({
      ...prev,
      isUpdating: false
    }));
  }, [postId, userId, state.isUpdating, state.userReaction, state.counts]);

  const updateCounts = useCallback((newCounts: ReactionCounts) => {
    setState(prev => ({
      ...prev,
      counts: newCounts
    }));
  }, []);

  const updateUserReaction = useCallback((newUserReaction: string | null) => {
    setState(prev => ({
      ...prev,
      userReaction: newUserReaction
    }));
  }, []);

  return {
    userReaction: state.userReaction,
    counts: state.counts,
    isUpdating: state.isUpdating,
    updateReaction,
    updateCounts,
    updateUserReaction
  };
}
