import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/hooks/use-toast'
import { createDraftPost, publishPost, type Post } from '@/lib/posts'
import { MediaPicker } from '@/components/media/MediaPicker'
import { uploadImage, uploadVideo, type MediaItem } from '@/lib/media'
import PostComposer from '@/components/PostComposer'
import { validateFormInput, rateLimiter } from '@/lib/security'

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

  console.log('NewPostForm render - user:', user?.id, 'username:', user?.username)

  const handleSubmit = async () => {
    if ((content.trim().length === 0 && selectedFiles.length === 0) || content.length > 2500) return

    // Rate limiting check
    const userId = user?.id || 'anonymous';
    if (!rateLimiter.isAllowed(`post-${userId}`, 5, 300000)) { // 5 posts per 5 minutes
      toast({
        title: "Too many posts",
        description: "Please wait a few minutes before posting again.",
        variant: "destructive"
      });
      return;
    }

    // Validate and sanitize input
    const validation = validateFormInput(content, {
      maxLength: 2500,
      minLength: selectedFiles.length > 0 ? 0 : 1,
      required: selectedFiles.length > 0 ? false : true
    });

    if (!validation.isValid) {
      toast({
        title: "Invalid input",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

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
      const newPost = await publishPost(postId, validation.sanitized, media)
      
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

  if (!user) {
    console.log('NewPostForm: No user, returning null')
    return null
  }

  console.log('NewPostForm: Rendering form for user', user.username)

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
        disabled={isSubmitting || isEmpty}
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