import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/hooks/use-toast'
import { createDraftPost, publishPost, type Post } from '@/lib/posts'
import { MediaPicker } from '@/components/media/MediaPicker'
import { uploadImage, uploadVideo, type MediaItem } from '@/lib/media'
import PostComposer from '@/components/PostComposer'

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

  const handleSubmit = async () => {
    if (!content.trim() || content.length > 2500) return

    setIsSubmitting(true)

    try {
      // Phase 1: Create draft post
      const postId = await createDraftPost()
      
      // Phase 2: Upload media files if any
      let media: MediaItem[] = []
      if (selectedFiles.length > 0 && user) {        
        if (mediaType === 'image') {
          const uploadPromises = selectedFiles.map((file, index) => 
            uploadImage(file, user.id, postId, index)
          )
          media = await Promise.all(uploadPromises)
        } else if (mediaType === 'video' && selectedFiles[0]) {
          const videoMedia = await uploadVideo(selectedFiles[0], user.id, postId)
          media = [videoMedia]
        }
      }
      
      // Phase 3: Publish post with media data
      const newPost = await publishPost(postId, content.trim(), media)
      
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
    <div className="space-y-4">
      <PostComposer
        avatarUrl={user.avatar_url || '/placeholder.svg'}
        placeholder="Share something..."
        value={content}
        onChange={setContent}
        onAddPhotos={() => setMediaType('image')}
        onAddVideo={() => setMediaType('video')}
        onSubmit={handleSubmit}
        maxChars={2500}
        disabled={isSubmitting}
      />
      
      {mediaType && (
        <MediaPicker
          selectedFiles={selectedFiles}
          onFilesSelected={setSelectedFiles}
          mediaType={mediaType}
          onMediaTypeChange={setMediaType}
          isUploading={isSubmitting}
          uploadedMedia={uploadedMedia}
        />
      )}
    </div>
  )
}