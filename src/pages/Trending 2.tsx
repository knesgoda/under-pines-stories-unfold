import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Hash, ArrowUp } from 'lucide-react';

interface TrendingHashtag {
  tag: string;
  recent_uses: number;
  last_used_at: string;
}

export default function Trending() {
  const { user } = useAuth();
  const [trending, setTrending] = useState<TrendingHashtag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTrending = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('trending_hashtags')
        .select('*')
        .limit(50);

      if (error) {
        console.error('Error loading trending hashtags:', error);
        return;
      }

      setTrending(data || []);
    } catch (error) {
      console.error('Error loading trending hashtags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrending();
  }, []);

  const getTrendingIcon = (index: number) => {
    if (index === 0) return '🔥';
    if (index === 1) return '⚡';
    if (index === 2) return '💫';
    return '📈';
  };

  const getTrendingColor = (index: number) => {
    if (index === 0) return 'text-amber-400';
    if (index === 1) return 'text-orange-400';
    if (index === 2) return 'text-yellow-400';
    return 'text-emerald-400';
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-0 md:ml-60 pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-emerald-50">
                  Trending Hashtags
                </h1>
                <p className="text-emerald-300/70">
                  Most popular hashtags in the last 24 hours
                </p>
              </div>
            </div>
          </div>

          {/* Trending List */}
          <div className="bg-emerald-950/50 border border-emerald-800/40 rounded-2xl overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto mb-4"></div>
                <p className="text-emerald-300">Loading trending hashtags...</p>
              </div>
            ) : trending.length === 0 ? (
              <div className="p-8 text-center">
                <TrendingUp className="h-16 w-16 text-emerald-400/50 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-emerald-50 mb-2">
                  No trending hashtags
                </h2>
                <p className="text-emerald-300/70">
                  Check back later for trending topics!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-emerald-800/40">
                {trending.map((hashtag, index) => (
                  <Link
                    key={hashtag.tag}
                    to={`/tag/${hashtag.tag}`}
                    className="block p-4 hover:bg-emerald-900/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="flex-shrink-0 w-8 text-center">
                        <span className={`text-lg font-bold ${getTrendingColor(index)}`}>
                          {index + 1}
                        </span>
                      </div>

                      {/* Trending Icon */}
                      <div className="flex-shrink-0">
                        <span className="text-2xl">
                          {getTrendingIcon(index)}
                        </span>
                      </div>

                      {/* Hashtag Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-emerald-400" />
                          <span className="text-lg font-semibold text-emerald-50">
                            {hashtag.tag}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-emerald-300">
                            {hashtag.recent_uses} {hashtag.recent_uses === 1 ? 'use' : 'uses'}
                          </span>
                          <span className="text-xs text-emerald-400/60">
                            Last used {new Date(hashtag.last_used_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Growth Indicator */}
                      <div className="flex-shrink-0">
                        <div className="flex items-center gap-1 text-emerald-400">
                          <ArrowUp className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            #{index + 1}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-emerald-900/20 border border-emerald-800/40 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-emerald-800/50 flex items-center justify-center">
                <span className="text-xs text-emerald-300">ℹ</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-emerald-50 mb-1">
                  How trending works
                </h3>
                <p className="text-xs text-emerald-300/70 leading-relaxed">
                  Trending hashtags are ranked by the number of posts using them in the last 24 hours. 
                  The more people use a hashtag, the higher it appears on this list.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
