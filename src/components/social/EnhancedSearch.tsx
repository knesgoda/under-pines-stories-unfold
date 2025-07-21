import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, Heart, MessageCircle, Hash, TrendingUp } from 'lucide-react';
import { User, Post, userStorage, postStorage, friendshipStorage } from '@/lib/localStorage';
import { useAuth } from '@/contexts/AuthContext';
import { useSocial } from '@/contexts/SocialContext';
import { formatDistanceToNow } from 'date-fns';

export const EnhancedSearch: React.FC = () => {
  const { user } = useAuth();
  const { sendFriendRequest, isLoading } = useSocial();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [searchResults, setSearchResults] = useState({
    users: [] as User[],
    posts: [] as Post[],
    tags: [] as string[],
  });

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults({ users: [], posts: [], tags: [] });
      return;
    }

    const search = searchTerm.toLowerCase();

    // Search users
    const users = userStorage.getAll().filter(u => 
      u.id !== user?.id &&
      (u.displayName.toLowerCase().includes(search) ||
       u.username.toLowerCase().includes(search) ||
       u.bio?.toLowerCase().includes(search))
    );

    // Search posts
    const posts = postStorage.getAll().filter(post => {
      const author = userStorage.getById(post.userId);
      const canViewPost = post.privacy === 'public' || 
        (post.privacy === 'friends' && user && friendshipStorage.areFriends(user.id, post.userId)) ||
        (user && post.userId === user.id);
      
      return canViewPost && (
        post.content.toLowerCase().includes(search) ||
        post.tags?.some(tag => tag.toLowerCase().includes(search)) ||
        author?.displayName.toLowerCase().includes(search)
      );
    });

    // Extract trending tags
    const allTags = postStorage.getAll()
      .flatMap(post => post.tags || [])
      .filter(tag => tag.toLowerCase().includes(search));
    
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([tag]) => tag)
      .slice(0, 10);

    setSearchResults({ users, posts, tags: sortedTags });
  }, [searchTerm, user]);

  const isAlreadyFriend = (userId: string): boolean => {
    if (!user) return false;
    return friendshipStorage.areFriends(user.id, userId);
  };

  const getTrendingTags = () => {
    const allTags = postStorage.getAll().flatMap(post => post.tags || []);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
  };

  const handleTagClick = (tag: string) => {
    setSearchTerm(tag);
    setActiveTab('posts');
  };

  return (
    <Card className="card-gradient pine-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Search className="h-5 w-5 mr-2" />
          Discover & Search
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users, posts, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {!searchTerm.trim() ? (
          // Show trending tags when not searching
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Trending Tags</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {getTrendingTags().map(({ tag, count }) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary/10 transition-smooth"
                  onClick={() => handleTagClick(tag)}
                >
                  <Hash className="h-3 w-3 mr-1" />
                  {tag} <span className="ml-1 text-xs">({count})</span>
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          // Show search results
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users">
                Users ({searchResults.users.length})
              </TabsTrigger>
              <TabsTrigger value="posts">
                Posts ({searchResults.posts.length})
              </TabsTrigger>
              <TabsTrigger value="tags">
                Tags ({searchResults.tags.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-3 mt-4">
              {searchResults.users.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-4">
                  No users found
                </p>
              ) : (
                searchResults.users.slice(0, 10).map((targetUser) => (
                  <div key={targetUser.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {targetUser.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{targetUser.displayName}</p>
                        <p className="text-xs text-muted-foreground">@{targetUser.username}</p>
                        {targetUser.bio && (
                          <p className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">
                            {targetUser.bio}
                          </p>
                        )}
                      </div>
                    </div>
                    {isAlreadyFriend(targetUser.id) ? (
                      <span className="text-xs text-primary font-medium px-3 py-1 rounded-full bg-primary/10">
                        Friends
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendFriendRequest(targetUser.id)}
                        disabled={isLoading}
                        className="h-8 px-3"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="posts" className="space-y-3 mt-4">
              {searchResults.posts.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-4">
                  No posts found
                </p>
              ) : (
                searchResults.posts.slice(0, 10).map((post) => {
                  const author = userStorage.getById(post.userId);
                  if (!author) return null;

                  return (
                    <div key={post.id} className="p-3 rounded-lg bg-background/50 border border-border/50 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                            {author.displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm">{author.displayName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm line-clamp-3">{post.content}</p>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {post.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center space-x-4 text-muted-foreground">
                        <span className="flex items-center space-x-1 text-xs">
                          <Heart className="h-3 w-3" />
                          <span>{post.likes.length}</span>
                        </span>
                        <span className="flex items-center space-x-1 text-xs">
                          <MessageCircle className="h-3 w-3" />
                          <span>{post.commentCount}</span>
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="tags" className="space-y-3 mt-4">
              {searchResults.tags.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-4">
                  No tags found
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {searchResults.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary/10 transition-smooth"
                      onClick={() => handleTagClick(tag)}
                    >
                      <Hash className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};