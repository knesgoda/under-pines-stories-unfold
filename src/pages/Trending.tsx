import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, Hash } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type TrendingHashtag = {
  tag: string
  recent_uses: number
  last_used_at: string
}

export default function Trending() {
  const [hashtags, setHashtags] = useState<TrendingHashtag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTrendingHashtags() {
      try {
        setLoading(true)
        
        // For now, show some mock trending data since trending_hashtags table doesn't exist
        const mockTrending: TrendingHashtag[] = [
          { tag: 'nature', recent_uses: 42, last_used_at: new Date().toISOString() },
          { tag: 'photography', recent_uses: 38, last_used_at: new Date().toISOString() },
          { tag: 'travel', recent_uses: 35, last_used_at: new Date().toISOString() },
          { tag: 'food', recent_uses: 28, last_used_at: new Date().toISOString() },
          { tag: 'art', recent_uses: 25, last_used_at: new Date().toISOString() },
        ]
        
        setHashtags(mockTrending)
      } catch (error) {
        console.error('Error loading trending hashtags:', error)
        setHashtags([])
      } finally {
        setLoading(false)
      }
    }

    loadTrendingHashtags()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-2xl mx-auto p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="grid gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
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
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Trending</h1>
        </div>

        {hashtags.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Hash className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No trending hashtags yet</h3>
              <p className="text-muted-foreground">
                Start using hashtags in your posts to see trending topics here!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {hashtags.map((hashtag, index) => (
              <Card key={hashtag.tag} className="hover:bg-accent/50 transition-colors">
                <CardContent className="p-4">
                  <Link 
                    to={`/tag/${hashtag.tag}`}
                    className="flex items-center justify-between w-full"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">#{hashtag.tag}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {hashtag.recent_uses} posts
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-auto">
                      Trending
                    </Badge>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Want to create a trending topic?
          </p>
          <Link to="/">
            <Button>
              Create a Post
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}