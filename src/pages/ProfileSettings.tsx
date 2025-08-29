import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { AvatarUpload } from '@/components/profile/AvatarUpload'
import { TagInput } from '@/components/profile/TagInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { updateProfile } from '@/lib/profiles'
import { toast } from '@/hooks/use-toast'
import type { ProfileUpdateData } from '@/lib/profiles'

export default function ProfileSettings() {
  const { user, updateProfile: updateAuthProfile } = useAuth()
  const navigate = useNavigate()
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    website: '',
    hobbies: [] as string[],
    interests: [] as string[],
    places_lived: [] as string[],
    avatar_url: '',
  })

  useEffect(() => {
    if (user) {
      setFormData({
        display_name: user.display_name || '',
        bio: user.bio || '',
        website: user.website || '',
        hobbies: user.hobbies || [],
        interests: user.interests || [],
        places_lived: user.places_lived || [],
        avatar_url: user.avatar_url || '',
      })
    }
  }, [user])

  const handleInputChange = (field: keyof ProfileUpdateData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleArrayChange = (field: 'hobbies' | 'interests' | 'places_lived', value: string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAvatarChange = (url: string | null) => {
    console.log('Avatar changed to:', url)
    setFormData(prev => ({ ...prev, avatar_url: url || '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    console.log('Form submitted manually, form data:', formData)
    setIsSaving(true)

    try {
      const updates: ProfileUpdateData = {
        display_name: formData.display_name.trim() || undefined,
        bio: formData.bio.trim() || undefined,
        website: formData.website.trim() || undefined,
        hobbies: formData.hobbies,
        interests: formData.interests,
        places_lived: formData.places_lived,
        avatar_url: formData.avatar_url || undefined,
      }

      const updatedProfile = await updateProfile(updates)
      
      if (updatedProfile) {
        // Update the auth context with the new profile data
        await updateAuthProfile(updates)
        
        toast({
          title: "Profile updated!",
          description: "Your profile has been successfully updated.",
        })
        
        navigate(`/${user.username}`)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="ml-0 md:ml-60 pb-20 md:pb-0">
          <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="text-center py-12">
              <p className="text-text-light">Please log in to edit your profile.</p>
            </div>
          </div>
        </main>
        <MobileNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-0 md:ml-60 pb-20 md:pb-0">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(`/${user.username}`)}
              className="p-2 text-text-light hover:bg-ink-muted/20"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold text-text-light">Edit Profile</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="bg-card border-ink-muted shadow-soft">
              <CardHeader>
                <CardTitle className="text-card-foreground">Profile Picture</CardTitle>
              </CardHeader>
              <CardContent>
                <AvatarUpload
                  avatarUrl={formData.avatar_url}
                  displayName={formData.display_name}
                  username={user.username}
                  onAvatarChange={handleAvatarChange}
                  canEdit={true}
                />
              </CardContent>
            </Card>

            <Card className="bg-card border-ink-muted shadow-soft">
              <CardHeader>
                <CardTitle className="text-card-foreground">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="display_name" className="text-card-foreground">Display Name</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => handleInputChange('display_name', e.target.value)}
                    placeholder="Your display name"
                    maxLength={50}
                    className="bg-bg-pine border-ink-muted text-text-light placeholder:text-text-light/40"
                  />
                  <p className="text-sm text-card-foreground/60 mt-1">
                    This is how your name will appear to others
                  </p>
                </div>

                <div>
                  <Label htmlFor="website" className="text-card-foreground">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://example.com"
                    className="bg-bg-pine border-ink-muted text-text-light placeholder:text-text-light/40"
                  />
                </div>

                <div>
                  <Label htmlFor="bio" className="text-card-foreground">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell people a bit about yourself..."
                    rows={4}
                    maxLength={500}
                    className="bg-bg-pine border-ink-muted text-text-light placeholder:text-text-light/40"
                  />
                  <p className="text-sm text-card-foreground/60 mt-1">
                    {formData.bio.length}/500 characters
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-ink-muted shadow-soft">
              <CardHeader>
                <CardTitle className="text-card-foreground">Interests & Hobbies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <TagInput
                  label="Hobbies"
                  tags={formData.hobbies}
                  onTagsChange={(tags) => handleArrayChange('hobbies', tags)}
                  placeholder="Add a hobby (e.g., photography, cooking, hiking)"
                />

                <TagInput
                  label="Interests"
                  tags={formData.interests}
                  onTagsChange={(tags) => handleArrayChange('interests', tags)}
                  placeholder="Add an interest (e.g., technology, books, travel)"
                />
              </CardContent>
            </Card>

            <Card className="bg-card border-ink-muted shadow-soft">
              <CardHeader>
                <CardTitle className="text-card-foreground">Places I've Lived</CardTitle>
              </CardHeader>
              <CardContent>
                <TagInput
                  tags={formData.places_lived}
                  onTagsChange={(tags) => handleArrayChange('places_lived', tags)}
                  placeholder="Add a place (e.g., New York, London, Tokyo)"
                />
                <p className="text-sm text-card-foreground/60 mt-2">
                  Add places in chronological order - the first one will be shown as "current"
                </p>
              </CardContent>
            </Card>

            <Separator />

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/${user.username}`)}
                disabled={isSaving}
                className="border-ink-muted text-text-light hover:bg-ink-muted/20"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-accent-warm hover:bg-accent-warm/90 text-bg-dark"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
      <MobileNav />
    </div>
  )
}