import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { AvatarUpload } from '@/components/profile/AvatarUpload'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import ProfileCTA from '@/components/profile/ProfileCTA'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Settings, MapPin, Heart, Briefcase, Calendar, Globe, User, FileText } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getProfileByUsername } from '@/lib/profiles'
import { getUserPostsByUsername, getUserPostCountByUsername, type PostWithStats } from '@/services/posts'
import type { ProfileWithRelation } from '@/lib/profiles'
import { PostCard } from '@/components/feed/PostCard'
import type { Post } from '@/lib/posts'

export default function Profile() {
  const { username } = useParams<{ username: string }>()
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState<ProfileWithRelation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState<'about' | 'posts' | 'media' | 'mentions'>('about')
  const [gridMode, setGridMode] = useState<'list' | 'grid'>('list')
  const [posts, setPosts] = useState<PostWithStats[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [postCount, setPostCount] = useState(0)

  // Convert PostWithStats to Post interface for PostCard compatibility
  const convertToPostCard = (postWithStats: PostWithStats): Post => ({
    id: postWithStats.id,
    author_id: postWithStats.author_id,
    body: postWithStats.body,
    created_at: postWithStats.created_at,
    like_count: postWithStats.reaction_counts.reduce((sum, rc) => sum + rc.count, 0),
    share_count: 0, // Not tracked in current system
    comment_count: postWithStats.comment_count,
    is_deleted: false,
    media: (postWithStats.media || []).map(m => ({
      type: m.type,
      url: m.url,
      width: 800,
      height: 600,
      bytes: 0,
      alt_text: m.alt_text,
      poster_url: m.poster_url,
      duration: undefined
    })),
    has_media: (postWithStats.media && postWithStats.media.length > 0) || false,
    profiles: {
      username: postWithStats.author.username,
      display_name: postWithStats.author.display_name,
      avatar_url: postWithStats.author.avatar_url
    },
    liked_by_user: false // Will be determined by PostCard component
  })

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
  }, [activeTab, username, loadPosts])

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
          {/* Header */}
          <ProfileHeader profile={profile} isOwnProfile={isOwnProfile} />

          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
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
            <button
              onClick={() => setActiveTab('media')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'media'
                  ? 'bg-emerald-800 text-emerald-50'
                  : 'bg-emerald-900/50 text-emerald-300 hover:bg-emerald-900/70'
              }`}
            >
              Media
            </button>
            <button
              onClick={() => setActiveTab('mentions')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'mentions'
                  ? 'bg-emerald-800 text-emerald-50'
                  : 'bg-emerald-900/50 text-emerald-300 hover:bg-emerald-900/70'
              }`}
            >
              Mentions
            </button>

            {activeTab === 'posts' && (
              <div className="ml-auto flex items-center gap-2">
                <Button variant={gridMode === 'list' ? 'default' : 'secondary'} size="sm" onClick={() => setGridMode('list')}>List</Button>
                <Button variant={gridMode === 'grid' ? 'default' : 'secondary'} size="sm" onClick={() => setGridMode('grid')}>Grid</Button>
              </div>
            )}
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
          ) : activeTab === 'posts' ? (
            /* Posts Tab */
            <div className={gridMode === 'grid' ? 'grid grid-cols-3 gap-2' : 'space-y-4'}>
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
                  gridMode === 'grid' ? (
                    <img key={post.id} src={(post.media?.[0]?.url) || '/placeholder.svg'} alt="Post media" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <PostCard key={post.id} post={convertToPostCard(post)} />
                  )
                ))
              )}
            </div>
          ) : activeTab === 'media' ? (
            <div className="grid grid-cols-3 gap-2">
              {postsLoading ? (
                <div className="col-span-3 text-center py-12 text-emerald-300">Loading media…</div>
              ) : posts.filter(p => (p.media?.length || 0) > 0).length === 0 ? (
                <div className="col-span-3 text-center py-12 text-emerald-300">No media yet</div>
              ) : (
                posts.filter(p => (p.media?.length || 0) > 0).map(p => (
                  <img key={p.id} src={p.media![0].url} alt="Media" className="w-full h-full object-cover rounded-lg" />
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4 text-emerald-300">
              View mentions at /@{profile.username}
            </div>
          )}
        </div>
      </main>
      <MobileNav />
    </div>
  )
}