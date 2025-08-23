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
import { MediaPicker } from '@/components/media/MediaPicker'
import { uploadImage, uploadVideo, type MediaItem } from '@/lib/media'

interface NewPostFormProps {
  onPostCreated: (post: Post) => void
}

export function NewPostForm({ onPostCreated }: NewPostFormProps) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null)
  const [uploadedMedia, setUploadedMedia] = useState<MediaItem[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim() || content.length > 2500) return

    setIsSubmitting(true)

    try {
      let media: MediaItem[] = []
      
      // Upload media files if any
      if (selectedFiles.length > 0 && user) {
        const tempPostId = `temp-${Date.now()}`
        
        if (mediaType === 'image') {
          const uploadPromises = selectedFiles.map((file, index) => 
            uploadImage(file, user.id, tempPostId, index)
          )
          media = await Promise.all(uploadPromises)
        } else if (mediaType === 'video' && selectedFiles[0]) {
          const videoMedia = await uploadVideo(selectedFiles[0], user.id, tempPostId)
          media = [videoMedia]
        }
      }
      
      const newPost = await createPost(content.trim(), media)
      
      onPostCreated(newPost)
      setContent('')
      setSelectedFiles([])
      setMediaType(null)
      setUploadedMedia([])
      
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
  const isOverLimit = charCount > 2500
  const isEmpty = content.trim().length === 0 && selectedFiles.length === 0

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
                  
                  <MediaPicker
                    selectedFiles={selectedFiles}
                    onFilesSelected={setSelectedFiles}
                    mediaType={mediaType}
                    onMediaTypeChange={setMediaType}
                    isUploading={isSubmitting}
                    uploadedMedia={uploadedMedia}
                  />
                  
                  <div className="flex items-center justify-between">
                    <div className={`text-sm ${isOverLimit ? 'text-destructive' : 'text-card-foreground/60'}`}>
                      {charCount}/2500
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