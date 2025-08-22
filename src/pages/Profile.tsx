import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { Header } from '@/components/layout/Header'
import { AvatarUpload } from '@/components/profile/AvatarUpload'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Settings, MapPin, Heart, Briefcase, Calendar } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getProfileByUsername } from '@/lib/profiles'
import type { User } from '@/contexts/AuthContext'

export default function Profile() {
  const { username } = useParams<{ username: string }>()
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return

      setIsLoading(true)
      setNotFound(false)

      try {
        const profileData = await getProfileByUsername(username)
        if (profileData) {
          setProfile(profileData)
        } else {
          setNotFound(true)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        setNotFound(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [username])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold mb-4">User not found</h1>
              <p className="text-muted-foreground mb-6">
                The profile you're looking for doesn't exist.
              </p>
              <Link to="/">
                <Button>Go home</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === profile.id
  const joinedDate = new Date(profile.created_at)
  const timeAgo = formatDistanceToNow(joinedDate, { addSuffix: true })

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8">
              {/* Header Section */}
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex flex-col items-center md:items-start">
                  <AvatarUpload
                    avatarUrl={profile.avatar_url}
                    displayName={profile.display_name}
                    username={profile.username}
                    onAvatarChange={() => {}}
                    canEdit={false}
                  />
                </div>
                
                <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold">
                    {profile.display_name || profile.username}
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    @{profile.username}
                  </p>
                </div>
                
                {isOwnProfile && (
                  <Link to="/settings/profile">
                    <Button variant="outline" className="gap-2">
                      <Settings className="h-4 w-4" />
                      Edit Profile
                    </Button>
                  </Link>
                )}
              </div>
                  
                  {profile.bio && (
                    <p className="text-lg mb-4 leading-relaxed">
                      {profile.bio}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {timeAgo}</span>
                  </div>
                </div>
              </div>

              <Separator className="my-8" />

              {/* Content Sections */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* Hobbies */}
                {profile.hobbies && profile.hobbies.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Heart className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-semibold">Hobbies</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profile.hobbies.map((hobby) => (
                        <Badge key={hobby} variant="secondary" className="text-sm">
                          {hobby}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interests */}
                {profile.interests && profile.interests.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Briefcase className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-semibold">Interests</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((interest) => (
                        <Badge key={interest} variant="secondary" className="text-sm">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Places Lived */}
              {profile.places_lived && profile.places_lived.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Places I've Lived</h2>
                  </div>
                  <div className="space-y-2">
                    {profile.places_lived.map((place, index) => (
                      <div 
                        key={place} 
                        className="flex items-center gap-3 text-lg"
                      >
                        <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-primary' : 'bg-muted-foreground'}`} />
                        <span className={index === 0 ? 'font-medium' : ''}>
                          {place}
                          {index === 0 && (
                            <span className="text-sm text-muted-foreground ml-2">
                              (current)
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {(!profile.bio && 
                (!profile.hobbies || profile.hobbies.length === 0) &&
                (!profile.interests || profile.interests.length === 0) &&
                (!profile.places_lived || profile.places_lived.length === 0)) && (
                <div className="text-center py-8 text-muted-foreground">
                  {isOwnProfile ? (
                    <div>
                      <p className="mb-4">Your profile is looking a bit empty.</p>
                      <Link to="/settings/profile">
                        <Button>Complete your profile</Button>
                      </Link>
                    </div>
                  ) : (
                    <p>{profile.display_name || profile.username} hasn't added any details yet.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}