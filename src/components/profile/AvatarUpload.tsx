import { useState, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Camera, Loader2, Trash2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { uploadAvatar, deleteAvatar } from '@/lib/profiles'

interface AvatarUploadProps {
  avatarUrl?: string
  displayName?: string
  username: string
  onAvatarChange: (url: string | null) => void
  canEdit?: boolean
}

export function AvatarUpload({ 
  avatarUrl, 
  displayName, 
  username, 
  onAvatarChange, 
  canEdit = false 
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log('File selected:', file.name, file.type, file.size)

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    console.log('Starting upload...')

    try {
      const url = await uploadAvatar(file)
      console.log('Upload successful, URL:', url)
      onAvatarChange(url)
      toast({
        title: "Avatar updated!",
        description: "Your profile picture has been updated",
      })
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast({
        title: "Upload failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      // Clear the input value so the same file can be selected again
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  const handleDeleteAvatar = async () => {
    setIsUploading(true)

    try {
      await deleteAvatar()
      onAvatarChange(null)
      toast({
        title: "Avatar removed",
        description: "Your profile picture has been removed",
      })
    } catch (error) {
      console.error('Error deleting avatar:', error)
      toast({
        title: "Delete failed",
        description: "Failed to remove avatar. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (canEdit && !isUploading) {
      console.log('Avatar clicked, triggering file input')
      fileInputRef.current?.click()
    }
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (canEdit && !isUploading) {
      console.log('Button clicked, triggering file input')
      fileInputRef.current?.click()
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar 
          className={`h-32 w-32 ${canEdit ? 'cursor-pointer hover:opacity-80' : ''} transition-opacity`}
          onClick={handleAvatarClick}
        >
          <AvatarImage src={avatarUrl} alt={`${displayName || username}'s avatar`} />
          <AvatarFallback className="text-2xl">
            {(displayName || username)?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        {canEdit && (
          <div className="absolute -bottom-2 -right-2">
            <Button
              size="sm"
              variant="secondary"
              className="rounded-full h-10 w-10"
              onClick={handleButtonClick}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>

      {canEdit && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleButtonClick}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                Change Photo
              </>
            )}
          </Button>
          
          {avatarUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteAvatar}
              disabled={isUploading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </Button>
          )}
        </div>
      )}

      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}