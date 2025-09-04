import { useState, useCallback } from 'react';

export interface CursorPaginationOptions<T> {
  fetchFunction: (cursor?: string, limit?: number) => Promise<{
    items: T[];
    hasMore: boolean;
    nextCursor?: string;
  }>;
  limit?: number;
}

export interface CursorPaginationResult<T> {
  items: T[];
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  error: string | null;
}

export function useCursorPagination<T>({
  fetchFunction,
  limit = 20
}: CursorPaginationOptions<T>): CursorPaginationResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFunction(nextCursor, limit);
      
      setItems(prev => nextCursor ? [...prev, ...result.items] : result.items);
      setHasMore(result.hasMore);
      setNextCursor(result.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunction, nextCursor, limit, isLoading, hasMore]);

  const refresh = useCallback(async () => {
    setItems([]);
    setNextCursor(undefined);
    setHasMore(true);
    setError(null);
    await loadMore();
  }, [loadMore]);

  return {
    items,
    isLoading,
    hasMore,
    loadMore,
    refresh,
    error
  };
}
