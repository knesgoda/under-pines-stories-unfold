import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { NewPostForm } from './NewPostForm'
import { PostCard } from './PostCard'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { fetchFeed, type Post } from '@/lib/posts'

export function FeedView() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const fetchPosts = async (cursorValue?: string) => {
    try {
      const newPosts = await fetchFeed(cursorValue)

      if (cursorValue) {
        setPosts(prev => [...prev, ...newPosts])
      } else {
        setPosts(newPosts)
      }

      if (newPosts.length < 20) {
        setHasMore(false)
      } else {
        setCursor(newPosts[newPosts.length - 1].created_at)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchPosts()
    }
  }, [user])

  const handleNewPost = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev])
  }

  const loadMore = async () => {
    if (!hasMore || isLoadingMore || !cursor) return
    
    setIsLoadingMore(true)
    await fetchPosts(cursor)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <NewPostForm onPostCreated={handleNewPost} />
      
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
          />
        ))}
        
        {hasMore && (
          <div className="flex justify-center py-4">
            <Button 
              onClick={loadMore} 
              disabled={isLoadingMore}
              variant="outline"
              className="border-ink-muted text-card-foreground hover:bg-ink-muted/20"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load more'
              )}
            </Button>
          </div>
        )}
        
        {!hasMore && posts.length > 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <span>🌲</span>
              <span>You've reached the end of your feed</span>
              <span>🌲</span>
            </div>
          </div>
        )}
        
              {posts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="mb-6">
                    <img 
                      src="/lovable-uploads/d686f771-cade-4bce-8c91-d54aa84ae0f5.png" 
                      alt="Under Pines" 
                      className="w-16 h-16 mx-auto mb-4 rounded-full opacity-60"
                    />
                    <p className="text-lg mb-2 text-foreground">Welcome to Under Pines</p>
                    <p>Share something to get the fire going 🔥</p>
                  </div>
                </div>
              )}
      </div>
    </div>
  )
}