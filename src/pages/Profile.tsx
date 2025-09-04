import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { AvatarUpload } from '@/components/profile/AvatarUpload'
import ProfileCTA from '@/components/profile/ProfileCTA'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Settings, MapPin, Heart, Briefcase, Calendar, Globe, User, FileText } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getProfileByUsername } from '@/lib/profiles'
import { getUserPostsByUsername, getUserPostCountByUsername, type PostWithStats } from '@/services/posts'
import { renderRichText } from '@/lib/renderRichText'
import type { ProfileWithRelation } from '@/lib/profiles'

export default function Profile() {
  const { username } = useParams<{ username: string }>()
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState<ProfileWithRelation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState<'about' | 'posts'>('about')
  const [posts, setPosts] = useState<PostWithStats[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [postCount, setPostCount] = useState(0)

  const loadPosts = async () => {
    if (!username) return

    setPostsLoading(true)
    try {
      const [postsData, count] = await Promise.all([
        getUserPostsByUsername(username, 20),
        getUserPostCountByUsername(username)
      ])
      setPosts(postsData)
      setPostCount(count)
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setPostsLoading(false)
    }
  }

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

  useEffect(() => {
    if (activeTab === 'posts' && username) {
      loadPosts()
    }
  }, [activeTab, username])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="ml-0 md:ml-60 pb-20 md:pb-0">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
        </main>
        <MobileNav />
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="ml-0 md:ml-60 pb-20 md:pb-0">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold mb-4 text-text-light">User not found</h1>
              <p className="text-text-light/60 mb-6">
                The profile you're looking for doesn't exist.
              </p>
              <Link to="/">
                <Button className="bg-accent-warm hover:bg-accent-warm/90">Go home</Button>
              </Link>
            </div>
          </div>
        </main>
        <MobileNav />
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === profile.id
  const joinedDate = new Date(profile.created_at)
  const timeAgo = formatDistanceToNow(joinedDate, { addSuffix: true })
  const websiteUrl = profile.website
    ? (profile.website.startsWith('http') ? profile.website : `https://${profile.website}`)
    : null

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-0 md:ml-60 pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Cover Image */}
          <div className="relative h-48 md:h-64 bg-gradient-sunset rounded-lg mb-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-bg-pine/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-end gap-6">
                <div className="relative">
                  <AvatarUpload
                    avatarUrl={profile.avatar_url}
                    displayName={profile.display_name}
                    username={profile.username}
                    onAvatarChange={() => {}}
                    canEdit={false}
                  />
                </div>
                
                <div className="flex-1 pb-4">
                  <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-semibold text-text-light">
                        {profile.display_name || profile.username}
                      </h1>
                      <p className="text-text-light/80 text-lg">
                        @{profile.username}
                      </p>
                    </div>
                    
                    {isOwnProfile ? (
                      <Link to="/settings/profile">
                        <Button variant="secondary" className="gap-2 bg-bg-panel text-bg-dark hover:bg-bg-panel/90">
                          <Settings className="h-4 w-4" />
                          Edit Profile
                        </Button>
                      </Link>
                    ) : (
                      <ProfileCTA
                        profileUserId={profile.id}
                        relation={profile.relation}
                        isPrivate={profile.isPrivate}
                        requestId={profile.requestId}
                        isIncomingRequest={profile.isIncomingRequest}
                        onRelationChange={() => {
                          // Refresh profile data when relation changes
                          if (username) {
                            getProfileByUsername(username).then(profileData => {
                              if (profileData) setProfile(profileData)
                            })
                          }
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('about')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'about'
                  ? 'bg-emerald-800 text-emerald-50'
                  : 'bg-emerald-900/50 text-emerald-300 hover:bg-emerald-900/70'
              }`}
            >
              <User className="h-4 w-4" />
              About
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'posts'
                  ? 'bg-emerald-800 text-emerald-50'
                  : 'bg-emerald-900/50 text-emerald-300 hover:bg-emerald-900/70'
              }`}
            >
              <FileText className="h-4 w-4" />
              Posts
              {postCount > 0 && (
                <span className="px-2 py-0.5 bg-emerald-700/50 text-xs rounded-full">
                  {postCount}
                </span>
              )}
            </button>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'about' ? (
            <Card className="bg-card border-ink-muted shadow-soft">
            <CardContent className="p-8">
              {profile.bio && (
                <p className="text-lg mb-6 leading-relaxed text-card-foreground">
                  {profile.bio}
                </p>
              )}

              {profile.website && websiteUrl && (
                <div className="flex items-center gap-2 text-card-foreground/60 mb-4">
                  <Globe className="h-4 w-4" />
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-warm hover:underline"
                  >
                    {profile.website}
                  </a>
                </div>
              )}

              <div className="flex items-center gap-2 text-card-foreground/60 mb-8">
                <Calendar className="h-4 w-4" />
                <span>Joined {timeAgo}</span>
              </div>

              <Separator className="my-8" />

              {/* Content Sections */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* Hobbies */}
                {profile.hobbies && profile.hobbies.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Heart className="h-5 w-5 text-accent-warm" />
                      <h2 className="text-xl font-semibold text-card-foreground">Hobbies</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profile.hobbies.map((hobby) => (
                        <Badge key={hobby} variant="secondary" className="text-sm bg-bg-pine text-text-light">
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
                      <Briefcase className="h-5 w-5 text-accent-warm" />
                      <h2 className="text-xl font-semibold text-card-foreground">Interests</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((interest) => (
                        <Badge key={interest} variant="secondary" className="text-sm bg-bg-pine text-text-light">
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
                    <MapPin className="h-5 w-5 text-accent-warm" />
                    <h2 className="text-xl font-semibold text-card-foreground">Places I've Lived</h2>
                  </div>
                  <div className="space-y-3">
                    {profile.places_lived.map((place, index) => (
                      <div 
                        key={place} 
                        className="flex items-center gap-3 text-lg"
                      >
                        <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-accent-warm' : 'bg-card-foreground/40'}`} />
                        <span className={`${index === 0 ? 'font-medium text-card-foreground' : 'text-card-foreground/80'}`}>
                          {place}
                          {index === 0 && (
                            <span className="text-sm text-accent-warm ml-2">
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
                <div className="text-center py-8 text-card-foreground/60">
                  {isOwnProfile ? (
                    <div>
                      <p className="mb-4">Your profile is looking a bit empty.</p>
                      <Link to="/settings/profile">
                        <Button className="bg-accent-warm hover:bg-accent-warm/90">Complete your profile</Button>
                      </Link>
                    </div>
                  ) : (
                    <p>{profile.display_name || profile.username} hasn't added any details yet.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          ) : (
            /* Posts Tab */
            <div className="space-y-4">
              {postsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto mb-4"></div>
                  <p className="text-emerald-300">Loading posts...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-semibold text-emerald-50 mb-2">No posts yet</h3>
                  <p className="text-emerald-300">
                    {isOwnProfile 
                      ? "You haven't posted anything yet. Share your first post!"
                      : `${profile.display_name || profile.username} hasn't posted anything yet.`
                    }
                  </p>
                </div>
              ) : (
                posts.map((post) => (
                  <Card key={post.id} className="bg-emerald-950/50 border border-emerald-800/30">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Link to={`/@${post.author.username}`}>
                          <img
                            src={post.author.avatar_url || '/placeholder.svg'}
                            alt={post.author.username}
                            className="h-12 w-12 rounded-full object-cover hover:opacity-80 transition-opacity"
                          />
                        </Link>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Link
                              to={`/@${post.author.username}`}
                              className="text-emerald-50 font-medium hover:text-emerald-300 transition-colors"
                            >
                              {post.author.display_name || post.author.username}
                            </Link>
                            <span className="text-emerald-400/60">·</span>
                            <span className="text-sm text-emerald-400/70">
                              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          
                          <Link to={`/post/${post.id}`}>
                            <div className="text-emerald-200 leading-relaxed hover:text-emerald-100 transition-colors">
                              {renderRichText(post.content)}
                            </div>
                          </Link>

                          {/* Media */}
                          {post.media && post.media.length > 0 && (
                            <div className="mt-3">
                              {post.media.map((media, index) => (
                                <div key={index} className="relative overflow-hidden rounded-2xl border border-emerald-800/40 bg-black/30">
                                  {media.type === 'image' ? (
                                    <img 
                                      className="max-h-[540px] w-full object-cover" 
                                      src={media.url} 
                                      alt={media.alt_text || ''} 
                                    />
                                  ) : (
                                    <div className="aspect-video bg-emerald-900/50 flex items-center justify-center">
                                      <span className="text-emerald-300">🎥 Video</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Stats */}
                          <div className="flex items-center gap-4 mt-4 text-sm text-emerald-400/70">
                            {post.reaction_counts.length > 0 && (
                              <div className="flex items-center gap-1">
                                <span>Reactions:</span>
                                {post.reaction_counts.map((rc) => (
                                  <span key={rc.emoji} className="flex items-center gap-1">
                                    <span>{rc.emoji}</span>
                                    <span>{rc.count}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                            {post.comment_count > 0 && (
                              <div className="flex items-center gap-1">
                                <span>💬 {post.comment_count} comments</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </main>
      <MobileNav />
    </div>
  )
}