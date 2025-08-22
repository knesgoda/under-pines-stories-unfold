import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { createPost, type Post } from '@/lib/posts'

interface NewPostFormProps {
  onPostCreated: (post: Post) => void
}

export function NewPostForm({ onPostCreated }: NewPostFormProps) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim() || content.length > 280) return

    setIsSubmitting(true)

    try {
      const newPost = await createPost(content.trim())
      
      onPostCreated(newPost)
      setContent('')
      
      console.info('Post created successfully')
      
      toast({
        title: "Post created!",
        description: "Your post has been shared with the community.",
      })
    } catch (error) {
      console.error('Error creating post:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create post',
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) return null

  const charCount = content.length
  const isOverLimit = charCount > 280
  const isEmpty = content.trim().length === 0

  return (
        <Card className="bg-card border-ink-muted shadow-soft hover:shadow-glow transition-all duration-200 fade-in">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-3">
                <Link to={`/${user.username}`}>
                  <Avatar className="h-10 w-10 flex-shrink-0 hover:opacity-80 transition-opacity">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="bg-accent-warm text-bg-dark">
                      {user.display_name?.[0] || user.username[0]}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                
                <div className="flex-1 space-y-3">
                  <Textarea
                    data-composer
                    placeholder="Share something..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[80px] resize-none border-none p-0 text-lg placeholder:text-card-foreground/40 focus-visible:ring-0 bg-transparent text-card-foreground"
                    disabled={isSubmitting}
                  />
                  
                  <div className="flex items-center justify-between">
                    <div className={`text-sm ${isOverLimit ? 'text-destructive' : 'text-card-foreground/60'}`}>
                      {charCount}/280
                      {isOverLimit && (
                        <span className="ml-2 text-destructive">
                          Character limit exceeded
                        </span>
                      )}
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={isEmpty || isOverLimit || isSubmitting}
                      className="px-6 bg-accent-warm hover:bg-accent-warm/90 text-bg-dark font-medium"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        'Post'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
  )
}