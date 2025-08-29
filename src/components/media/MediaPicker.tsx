import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Image, Video, X } from 'lucide-react'
import { validateImageFile, validateVideoFile, formatFileSize, type MediaItem } from '@/lib/media'
import { toast } from '@/hooks/use-toast'

interface MediaPickerProps {
  selectedFiles: File[]
  onFilesSelected: (files: File[]) => void
  mediaType: 'image' | 'video' | null
  onMediaTypeChange: (type: 'image' | 'video' | null) => void
  isUploading?: boolean
  uploadedMedia: MediaItem[]
}

export function MediaPicker({ 
  selectedFiles, 
  onFilesSelected, 
  mediaType, 
  onMediaTypeChange,
  isUploading = false,
  uploadedMedia
}: MediaPickerProps) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles: File[] = []
    
    for (const file of files) {
      const error = validateImageFile(file)
      if (error) {
        toast({
          title: "Invalid image",
          description: error,
          variant: "destructive"
        })
        continue
      }
      validFiles.push(file)
    }
    
    if (validFiles.length + selectedFiles.length > 10) {
      toast({
        title: "Too many images",
        description: "Maximum 10 images per post",
        variant: "destructive"
      })
      return
    }
    
    onFilesSelected([...selectedFiles, ...validFiles])
    onMediaTypeChange('image')
  }

  const handleVideoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return
    
    const file = files[0]
    const error = validateVideoFile(file)
    if (error) {
      toast({
        title: "Invalid video",
        description: error,
        variant: "destructive"
      })
      return
    }
    
    onFilesSelected([file])
    onMediaTypeChange('video')
  }

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    onFilesSelected(newFiles)
    if (newFiles.length === 0) {
      onMediaTypeChange(null)
    }
  }

  const canAddImages = mediaType !== 'video' && selectedFiles.length < 10
  const canAddVideo = mediaType !== 'image' && selectedFiles.length === 0

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => imageInputRef.current?.click()}
          disabled={!canAddImages || isUploading}
          className="flex items-center gap-2"
        >
          <Image className="h-4 w-4" />
          Photos
          {selectedFiles.length > 0 && mediaType === 'image' && (
            <span className="bg-accent-warm text-bg-dark rounded-full px-2 py-0.5 text-xs">
              {selectedFiles.length}
            </span>
          )}
        </Button>
        
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => videoInputRef.current?.click()}
          disabled={!canAddVideo || isUploading}
          className="flex items-center gap-2"
        >
          <Video className="h-4 w-4" />
          Video
        </Button>
      </div>

      {selectedFiles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {selectedFiles.map((file, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square bg-card-foreground/10 rounded-lg overflow-hidden">
                {file.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Selected"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={URL.createObjectURL(file)}
                    className="w-full h-full object-cover"
                    muted
                  />
                )}
              </div>
              
              <button
                type="button"
                onClick={() => removeFile(index)}
                disabled={isUploading}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
              
              <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
                {formatFileSize(file.size)}
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic"
        multiple
        onChange={handleImageSelect}
        className="hidden"
      />
      
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm"
        onChange={handleVideoSelect}
        className="hidden"
      />
    </div>
  )
}