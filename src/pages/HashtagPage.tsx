import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PostCard } from '@/components/feed/PostCard'
import { useAuth } from '@/contexts/AuthContext'
import type { Post } from '@/lib/posts'
import { supabase } from '@/integrations/supabase/client'

export default function HashtagPage() {
  const { tag } = useParams<{ tag: string }>()
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadHashtagPosts() {
      if (!tag) return

      try {
        setLoading(true)
        setError(null)

        // For now, search for hashtags in post body content
        // since hashtag tables don't exist in current schema
        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select(`
            id,
            author_id,
            body,
            created_at,
            like_count,
            share_count,
            is_deleted,
            media,
            has_media,
            profiles!posts_author_id_fkey (
              username,
              display_name,
              avatar_url
            )
          `)
          .ilike('body', `%#${tag}%`)
          .eq('status', 'published')
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(50)

        if (postsError) {
          throw postsError
        }

        const formattedPosts: Post[] = posts?.map(post => ({
          ...post,
          media: Array.isArray(post.media) ? (post.media as Post['media']) : [],
          has_media: Array.isArray(post.media) && post.media.length > 0,
          profiles: Array.isArray(post.profiles) ? post.profiles[0] : post.profiles,
          liked_by_user: false,
          comment_count: 0
        })) || []

        setPosts(formattedPosts)
      } catch (err) {
        console.error('Error loading hashtag posts:', err)
        setError('Failed to load posts for this hashtag')
      } finally {
        setLoading(false)
      }
    }

    loadHashtagPosts()
  }, [tag])

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-2xl mx-auto p-4">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">#{tag}</h1>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {posts.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No posts found for #{tag}</p>
            <p className="text-sm mt-2">Be the first to use this hashtag!</p>
          </div>
        )}

        <div className="space-y-4">
          {posts.map(post => (
            <PostCard 
              key={post.id} 
              post={post}
            />
          ))}
        </div>
      </div>
    </div>
  )
}