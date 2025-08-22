import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { updateProfile, uploadAvatar, getAvatarUrl } from '@/lib/profiles'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TagInput } from './TagInput'
import { ArrowLeft, Upload, Loader2, Camera } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import type { ProfileUpdateData } from '@/lib/profiles'

export function ProfileEditPage() {
  const { user, updateProfile: updateAuthProfile } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  
  const [formData, setFormData] = useState({
    display_name: user?.display_name || '',
    bio: user?.bio || '',
    hobbies: user?.hobbies || [],
    interests: user?.interests || [],
    places_lived: user?.places_lived || []
  })

  if (!user) {
    navigate('/')
    return null
  }

  const handleInputChange = (field: keyof typeof formData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAvatarUpload = async (file: File) => {
    setIsUploadingAvatar(true)
    try {
      const avatarUrl = await uploadAvatar(file)
      await updateProfile({ avatar_url: avatarUrl })
      
      // Update auth context
      await updateAuthProfile({ avatar_url: avatarUrl })
      
      toast({
        title: "Avatar updated!",
        description: "Your profile picture has been updated successfully.",
      })
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast({
        title: "Upload failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive",
        })
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        })
        return
      }

      handleAvatarUpload(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const updates: ProfileUpdateData = {
        display_name: formData.display_name || undefined,
        bio: formData.bio || undefined,
        hobbies: formData.hobbies,
        interests: formData.interests,
        places_lived: formData.places_lived
      }

      await updateProfile(updates)
      await updateAuthProfile(updates)

      toast({
        title: "Profile updated!",
        description: "Your profile has been saved successfully.",
      })

      navigate(`/${user.username}`)
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const displayName = user.display_name || user.username

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/${user.username}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to profile
          </Button>
          <h1 className="text-2xl font-bold">Edit Profile</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar section */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={getAvatarUrl(user.avatar_url)} />
                    <AvatarFallback className="text-xl">
                      {displayName[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                </div>
                
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Change Avatar
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG up to 5MB
                  </p>
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </CardContent>
          </Card>

          {/* Basic info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Username</label>
                <Input value={user.username} disabled className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">
                  Username cannot be changed
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Display Name</label>
                <Input
                  value={formData.display_name}
                  onChange={(e) => handleInputChange('display_name', e.target.value)}
                  placeholder="Your display name"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Bio</label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="mt-1 min-h-[100px]"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.bio.length}/500 characters
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tags sections */}
          <Card>
            <CardHeader>
              <CardTitle>Interests & Activities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <TagInput
                label="Hobbies"
                tags={formData.hobbies}
                onChange={(tags) => handleInputChange('hobbies', tags)}
                placeholder="Add a hobby..."
                maxTags={8}
              />

              <TagInput
                label="Interests"
                tags={formData.interests}
                onChange={(tags) => handleInputChange('interests', tags)}
                placeholder="Add an interest..."
                maxTags={8}
              />

              <TagInput
                label="Places Lived"
                tags={formData.places_lived}
                onChange={(tags) => handleInputChange('places_lived', tags)}
                placeholder="Add a place..."
                maxTags={10}
              />
              <p className="text-xs text-muted-foreground">
                Most recent first - the first entry will be shown as "Current"
              </p>
            </CardContent>
          </Card>

          {/* Submit button */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/${user.username}`)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}