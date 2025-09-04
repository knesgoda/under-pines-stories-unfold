import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { PostCard } from '@/components/feed/PostCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Hash, ArrowLeft } from 'lucide-react';
import type { Post } from '@/lib/posts';

export default function HashtagPage() {
  const { tag } = useParams<{ tag: string }>();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const loadPosts = async (reset = false) => {
    if (!tag) return;

    const currentOffset = reset ? 0 : offset;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          body,
          created_at,
          author_id,
          media,
          profiles!posts_author_id_fkey(
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('visibility', 'public')
        .in('id', 
          supabase
            .from('post_hashtags')
            .select('post_id')
            .in('hashtag_id', 
              supabase
                .from('hashtags')
                .select('id')
                .eq('tag', tag)
            )
        )
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + 19);

      if (error) {
        console.error('Error loading hashtag posts:', error);
        return;
      }

      const formattedPosts: Post[] = (data || []).map(post => ({
        id: post.id,
        author_id: post.author_id,
        body: post.body,
        created_at: post.created_at,
        like_count: 0, // Will be loaded separately
        share_count: 0,
        comment_count: 0, // Will be loaded separately
        is_deleted: false,
        media: post.media || [],
        has_media: (post.media && post.media.length > 0) || false,
        profiles: {
          username: post.profiles.username,
          display_name: post.profiles.display_name,
          avatar_url: post.profiles.avatar_url
        },
        liked_by_user: false // Will be determined by PostCard
      }));

      if (reset) {
        setPosts(formattedPosts);
        setOffset(20);
      } else {
        setPosts(prev => [...prev, ...formattedPosts]);
        setOffset(prev => prev + 20);
      }

      setHasMore(formattedPosts.length === 20);
    } catch (error) {
      console.error('Error loading hashtag posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tag) {
      loadPosts(true);
    }
  }, [tag, loadPosts]);

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      loadPosts(false);
    }
  };

  if (!tag) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="ml-0 md:ml-60 pb-20 md:pb-0">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-emerald-50 mb-4">Hashtag not found</h1>
              <p className="text-emerald-300">The hashtag you're looking for doesn't exist.</p>
            </div>
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-0 md:ml-60 pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Link
                to="/search"
                className="p-2 rounded-full hover:bg-emerald-900/50 text-emerald-100/90 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-800/50 flex items-center justify-center">
                  <Hash className="h-5 w-5 text-emerald-300" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-emerald-50">
                    #{tag}
                  </h1>
                  <p className="text-emerald-300/70">
                    {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Posts */}
          <div className="space-y-4">
            {isLoading && posts.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto mb-4"></div>
                <p className="text-emerald-300">Loading posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-8">
                <Hash className="h-16 w-16 text-emerald-400/50 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-emerald-50 mb-2">
                  No posts found
                </h2>
                <p className="text-emerald-300/70">
                  No posts have been tagged with #{tag} yet.
                </p>
              </div>
            ) : (
              <>
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}

                {/* Load More */}
                {hasMore && (
                  <div className="text-center py-4">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoading}
                      className="px-6 py-2 bg-emerald-800/50 hover:bg-emerald-800/70 text-emerald-100 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Loading...' : 'Load more posts'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}