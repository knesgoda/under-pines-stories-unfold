import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getProfileByUsername, getAvatarUrl } from '@/lib/profiles'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { MapPin, Calendar, Settings, ArrowLeft, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { User as UserProfile } from '@/contexts/AuthContext'

export function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return
      
      setIsLoading(true)
      const profileData = await getProfileByUsername(username)
      
      if (profileData) {
        setProfile(profileData)
      } else {
        setNotFound(true)
      }
      
      setIsLoading(false)
    }

    fetchProfile()
  }, [username])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">User not found</h1>
          <p className="text-muted-foreground mb-4">
            The profile you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go back home
          </Button>
        </div>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === profile.id
  const displayName = profile.display_name || profile.username
  const joinedDate = new Date(profile.created_at)
  const lastSeen = profile.updated_at ? new Date(profile.updated_at) : joinedDate

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Back button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to feed
        </Button>

        {/* Profile header */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={getAvatarUrl(profile.avatar_url)} />
                  <AvatarFallback className="text-2xl">
                    {displayName[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h1 className="text-3xl font-bold">{displayName}</h1>
                  <p className="text-muted-foreground text-lg">@{profile.username}</p>
                  
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Joined {formatDistanceToNow(joinedDate, { addSuffix: true })}
                    </div>
                    {profile.updated_at && (
                      <div className="flex items-center gap-1">
                        Last seen {formatDistanceToNow(lastSeen, { addSuffix: true })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {isOwnProfile ? (
                <Button onClick={() => navigate('/settings/profile')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <Button variant="outline">
                  Follow
                </Button>
              )}
            </div>
          </CardHeader>

          {profile.bio && (
            <CardContent className="pt-0">
              <p className="text-foreground leading-relaxed">{profile.bio}</p>
            </CardContent>
          )}
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hobbies */}
          {profile.hobbies && profile.hobbies.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Hobbies</h2>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.hobbies.map((hobby, index) => (
                    <Badge key={index} variant="secondary">
                      {hobby}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Interests</h2>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, index) => (
                    <Badge key={index} variant="outline">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Places lived */}
        {profile.places_lived && profile.places_lived.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <h2 className="text-xl font-semibold">Places Lived</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profile.places_lived.map((place, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span>{place}</span>
                    {index === 0 && (
                      <Badge variant="secondary" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}