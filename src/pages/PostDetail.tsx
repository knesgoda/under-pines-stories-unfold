import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { PostCard } from '@/components/feed/PostCard'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { type Post } from '@/lib/posts'

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return

      try {
        // Fetch the post with profile information
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select(`
            *,
            profiles!posts_author_id_fkey(username, display_name, avatar_url)
          `)
          .eq('id', id)
          .eq('is_deleted', false)
          .single()

        if (postError) {
          setError('Post not found')
          return
        }

        // Check if current user liked this post
        let likedByUser = false
        if (user) {
          const { data: likeData } = await supabase
            .from('post_likes')
            .select('user_id')
            .eq('post_id', id)
            .eq('user_id', user.id)
            .single()

          likedByUser = !!likeData
        }

        const formattedPost: Post = {
          ...postData,
          media: postData.media as Post['media'],
          liked_by_user: likedByUser
        }

        setPost(formattedPost)
      } catch (error) {
        console.error('Error fetching post:', error)
        setError('Failed to load post')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPost()
  }, [id, user])

  useEffect(() => {
    // Update document meta tags for Open Graph
    if (post) {
      const excerpt = post.body.slice(0, 150) + (post.body.length > 150 ? '...' : '')
      const authorName = post.profiles.display_name || post.profiles.username
      
      document.title = `${authorName}: "${excerpt}" - Under Pines`
      
      // Update Open Graph meta tags
      const updateMeta = (property: string, content: string) => {
        let meta = document.querySelector(`meta[property="${property}"]`)
        if (!meta) {
          meta = document.createElement('meta')
          meta.setAttribute('property', property)
          document.head.appendChild(meta)
        }
        meta.setAttribute('content', content)
      }

      updateMeta('og:title', `${authorName} on Under Pines`)
      updateMeta('og:description', excerpt)
      updateMeta('og:url', window.location.href)
    }
  }, [post])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
            <p className="text-muted-foreground mb-6">
              {error || 'The post you are looking for does not exist or has been deleted.'}
            </p>
            <Button asChild>
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Feed
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" asChild>
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Feed
              </Link>
            </Button>
          </div>
          
          <PostCard post={post} />

          {/* Comments section disabled until comment feature is fully implemented */}
          <div className="mt-6 p-4 bg-background-panel rounded-lg text-center text-muted-foreground">
            Comments feature coming soon
          </div>
          {/* <CommentThread postId={post.id} /> */}
        </div>
      </main>
    </div>
  )
}