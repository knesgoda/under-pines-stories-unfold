import * as React from 'react';
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Hash, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface Post {
  id: string;
  content: string;
  created_at: string;
  author: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

interface HashtagInfo {
  tag: string;
  uses_count: number;
  created_at: string;
}

export default function HashtagPage() {
  const { tag } = useParams<{ tag: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [hashtagInfo, setHashtagInfo] = useState<HashtagInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tag) return;

    const loadHashtagData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Load hashtag info
        const { data: hashtagData, error: hashtagError } = await supabase
          .from('hashtags')
          .select('tag, uses_count, created_at')
          .eq('tag', tag.toLowerCase())
          .single();

        if (hashtagError) {
          setError('Hashtag not found');
          return;
        }

        setHashtagInfo(hashtagData);

        // Load posts with this hashtag
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`
            id,
            content,
            created_at,
            author:profiles!posts_author_id_fkey(
              id,
              username,
              display_name,
              avatar_url
            )
          `)
          .eq('post_hashtags.hashtags.tag', tag.toLowerCase())
          .order('created_at', { ascending: false })
          .limit(50);

        if (postsError) {
          console.error('Error loading posts:', postsError);
          setError('Failed to load posts');
          return;
        }

        setPosts(postsData || []);
      } catch (err) {
        console.error('Error loading hashtag data:', err);
        setError('An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    loadHashtagData();
  }, [tag]);

  if (!tag) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-emerald-50 mb-4">Invalid hashtag</h1>
          <p className="text-emerald-300">The hashtag URL is invalid.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center py-12">
              <Hash className="h-16 w-16 text-emerald-400/50 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-emerald-50 mb-4">Hashtag not found</h1>
              <p className="text-emerald-300 mb-6">
                The hashtag <span className="font-mono text-emerald-200">#{tag}</span> doesn't exist yet.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 text-emerald-50 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Feed
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-100 transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Feed
            </Link>
            
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-emerald-800 flex items-center justify-center">
                <Hash className="h-8 w-8 text-emerald-300" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-emerald-50">
                  #{hashtagInfo?.tag || tag}
                </h1>
                {hashtagInfo && (
                  <p className="text-emerald-300">
                    {hashtagInfo.uses_count} {hashtagInfo.uses_count === 1 ? 'use' : 'uses'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Posts */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto mb-4"></div>
                <p className="text-emerald-300">Loading posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-emerald-50 mb-2">No posts yet</h3>
                <p className="text-emerald-300">
                  Be the first to post with <span className="font-mono text-emerald-200">#{tag}</span>
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  className="p-6 bg-emerald-950/50 border border-emerald-800/30 rounded-2xl"
                >
                  <div className="flex items-start gap-4">
                    <Link to={`/@${post.author.username}`}>
                      <img
                        src={post.author.avatar_url || '/placeholder.svg'}
                        alt={post.author.username}
                        className="h-12 w-12 rounded-full object-cover hover:opacity-80 transition-opacity"
                      />
                    </Link>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Link
                          to={`/@${post.author.username}`}
                          className="text-emerald-50 font-medium hover:text-emerald-300 transition-colors"
                        >
                          {post.author.display_name || post.author.username}
                        </Link>
                        <span className="text-emerald-400/60">·</span>
                        <span className="text-sm text-emerald-400/70">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <Link to={`/post/${post.id}`}>
                        <p className="text-emerald-200 leading-relaxed hover:text-emerald-100 transition-colors">
                          {post.content}
                        </p>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
