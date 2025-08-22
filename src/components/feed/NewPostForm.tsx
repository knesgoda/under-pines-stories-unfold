import { useState } from 'react'
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
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback>
                {user.display_name?.[0] || user.username[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[80px] resize-none border-none p-0 text-lg placeholder:text-muted-foreground focus-visible:ring-0"
                disabled={isSubmitting}
              />
              
              <div className="flex items-center justify-between">
                <div className={`text-sm ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
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
                  className="px-6"
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