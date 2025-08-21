import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Filter, 
  Users, 
  FileText, 
  Hash, 
  MapPin,
  Calendar,
  Heart,
  MessageCircle,
  TrendingUp,
  User,
  UserPlus
} from 'lucide-react';
import { enhancedUserStorage, postStorage, groupStorage } from '@/lib/localStorage';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const AdvancedSearch: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'users' | 'posts' | 'groups'>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'popularity'>('relevance');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [results, setResults] = useState({
    users: [] as any[],
    posts: [] as any[],
    groups: [] as any[],
    hashtags: [] as string[]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState({
    trendingHashtags: [] as string[],
    suggestedUsers: [] as any[],
    popularPosts: [] as any[]
  });

  useEffect(() => {
    loadRecommendations();
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch();
    } else {
      setResults({ users: [], posts: [], groups: [], hashtags: [] });
    }
  }, [searchQuery, searchType, sortBy, dateFilter]);

  const loadRecommendations = () => {
    if (!user) return;

    // Get trending hashtags (mock implementation)
    const allPosts = postStorage.getAll();
    const hashtagCounts = new Map<string, number>();
    
    allPosts.forEach(post => {
      const hashtags = post.content.match(/#\w+/g) || [];
      hashtags.forEach(tag => {
        const cleanTag = tag.toLowerCase();
        hashtagCounts.set(cleanTag, (hashtagCounts.get(cleanTag) || 0) + 1);
      });
    });

    const trendingHashtags = Array.from(hashtagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);

    // Get suggested users based on mutual connections
    const suggestedUsers = enhancedUserStorage.getAll()
      .filter(u => u.id !== user.id)
      .slice(0, 5);

    // Get popular posts
    const popularPosts = allPosts
      .filter(post => post.likes && post.likes.length > 0)
      .sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
      .slice(0, 5);

    setRecommendations({
      trendingHashtags,
      suggestedUsers,
      popularPosts
    });
  };

  const performSearch = () => {
    if (!user || !searchQuery.trim()) return;

    setIsLoading(true);
    
    try {
      const query = searchQuery.toLowerCase().trim();
      let searchResults = { users: [] as any[], posts: [] as any[], groups: [] as any[], hashtags: [] as string[] };

      // Search users
      if (searchType === 'all' || searchType === 'users') {
        searchResults.users = enhancedUserStorage.searchUsers(query, user.id);
      }

      // Search posts
      if (searchType === 'all' || searchType === 'posts') {
        let posts = postStorage.getAll().filter(post => {
          return post.content.toLowerCase().includes(query) ||
                 (post.tags && post.tags.some(tag => tag.toLowerCase().includes(query)));
        });

        // Apply date filter
        if (dateFilter !== 'all') {
          const now = new Date();
          const filterDate = new Date();
          
          switch (dateFilter) {
            case 'today':
              filterDate.setDate(now.getDate() - 1);
              break;
            case 'week':
              filterDate.setDate(now.getDate() - 7);
              break;
            case 'month':
              filterDate.setMonth(now.getMonth() - 1);
              break;
          }
          
          posts = posts.filter(post => new Date(post.createdAt) >= filterDate);
        }

        // Apply sorting
        switch (sortBy) {
          case 'date':
            posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            break;
          case 'popularity':
            posts.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
            break;
          case 'relevance':
          default:
            // Keep original order for relevance
            break;
        }

        searchResults.posts = posts.slice(0, 20);
      }

      // Search groups
      if (searchType === 'all' || searchType === 'groups') {
        searchResults.groups = groupStorage.search(query).slice(0, 10);
      }

      // Search hashtags
      if (searchType === 'all' || searchQuery.startsWith('#')) {
        const hashtagQuery = searchQuery.startsWith('#') ? searchQuery.toLowerCase() : `#${query}`;
        searchResults.hashtags = recommendations.trendingHashtags
          .filter(tag => tag.includes(hashtagQuery))
          .slice(0, 10);
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalResults = () => {
    return results.users.length + results.posts.length + results.groups.length + results.hashtags.length;
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card className="card-gradient pine-shadow">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for people, posts, groups, or hashtags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <Select value={searchType} onValueChange={(value: any) => setSearchType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="users">Users</SelectItem>
                <SelectItem value="posts">Posts</SelectItem>
                <SelectItem value="groups">Groups</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="date">Most Recent</SelectItem>
                <SelectItem value="popularity">Most Popular</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Count */}
          {searchQuery && (
            <p className="text-sm text-muted-foreground">
              {isLoading ? 'Searching...' : `${getTotalResults()} results found`}
            </p>
          )}
        </CardContent>
      </Card>

      {searchQuery.trim() ? (
        /* Search Results */
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              All ({getTotalResults()})
            </TabsTrigger>
            <TabsTrigger value="users">
              Users ({results.users.length})
            </TabsTrigger>
            <TabsTrigger value="posts">
              Posts ({results.posts.length})
            </TabsTrigger>
            <TabsTrigger value="groups">
              Groups ({results.groups.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {/* All Results Mixed */}
            {isLoading ? (
              <Card className="card-gradient pine-shadow">
                <CardContent className="p-8 text-center">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Searching...</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Users Section */}
                {results.users.length > 0 && (
                  <Card className="card-gradient pine-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        People
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {results.users.slice(0, 3).map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-3 border border-border/50 rounded-lg hover:bg-muted/50 transition-smooth">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {user.displayName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{user.displayName}</p>
                                <p className="text-sm text-muted-foreground">@{user.username}</p>
                                {user.bio && (
                                  <p className="text-xs text-muted-foreground mt-1 max-w-md truncate">{user.bio}</p>
                                )}
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              <UserPlus className="h-4 w-4 mr-2" />
                              Add Friend
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Posts Section */}
                {results.posts.length > 0 && (
                  <Card className="card-gradient pine-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Posts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {results.posts.slice(0, 5).map((post) => {
                          const author = enhancedUserStorage.getById(post.userId);
                          return (
                            <div key={post.id} className="p-4 border border-border/50 rounded-lg hover:bg-muted/50 transition-smooth">
                              <div className="flex items-start gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                    {author?.displayName.charAt(0).toUpperCase() || '?'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <p className="font-medium text-sm">{author?.displayName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                                    </p>
                                  </div>
                                  <p className="text-sm">{post.content}</p>
                                  <div className="flex items-center gap-4 mt-2">
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Heart className="h-3 w-3" />
                                      {post.likes?.length || 0}
                                    </span>
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <MessageCircle className="h-3 w-3" />
                                      {post.comments?.length || 0}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users">
            <Card className="card-gradient pine-shadow">
              <CardContent className="p-6">
                {results.users.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No users found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {results.users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 border border-border/50 rounded-lg hover:bg-muted/50 transition-smooth">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {user.displayName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.displayName}</p>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                            {user.bio && (
                              <p className="text-xs text-muted-foreground mt-1 max-w-md truncate">{user.bio}</p>
                            )}
                            {user.interests && user.interests.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {user.interests.slice(0, 3).map((interest, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {interest}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Friend
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="posts">
            <Card className="card-gradient pine-shadow">
              <CardContent className="p-6">
                {results.posts.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No posts found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {results.posts.map((post) => {
                      const author = enhancedUserStorage.getById(post.userId);
                      return (
                        <div key={post.id} className="p-4 border border-border/50 rounded-lg hover:bg-muted/50 transition-smooth">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {author?.displayName.charAt(0).toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-medium text-sm">{author?.displayName}</p>
                                <p className="text-xs text-muted-foreground">@{author?.username}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                                </p>
                              </div>
                              <p className="text-sm mb-3">{post.content}</p>
                              <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Heart className="h-3 w-3" />
                                  {post.likes?.length || 0}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MessageCircle className="h-3 w-3" />
                                  {post.comments?.length || 0}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups">
            <Card className="card-gradient pine-shadow">
              <CardContent className="p-6">
                {results.groups.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No groups found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {results.groups.map((group) => (
                      <div key={group.id} className="p-4 border border-border/50 rounded-lg hover:bg-muted/50 transition-smooth">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">{group.name}</h3 >
                            <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>{group.memberCount || 0} members</span>
                              <span>{group.privacy}</span>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            Join Group
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        /* Recommendations when no search */
        <div className="space-y-6">
          {/* Trending Hashtags */}
          <Card className="card-gradient pine-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trending Hashtags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {recommendations.trendingHashtags.map((hashtag, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-secondary/80"
                    onClick={() => setSearchQuery(hashtag)}
                  >
                    <Hash className="h-3 w-3 mr-1" />
                    {hashtag.replace('#', '')}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Suggested Users */}
          <Card className="card-gradient pine-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                People You Might Know
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendations.suggestedUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border border-border/50 rounded-lg hover:bg-muted/50 transition-smooth">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.displayName}</p>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Friend
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
