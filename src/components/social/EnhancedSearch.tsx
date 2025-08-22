import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const EnhancedSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [trendingTags] = useState(['nature', 'hiking', 'photography', 'adventure', 'forest']);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // Search for posts containing the query
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles(username, display_name, avatar_url)
        `)
        .or(`content.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`)
        .eq('privacy', 'public')
        .limit(5);

      if (error) {
        console.error('Search error:', error);
        return;
      }

      setSearchResults(posts || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search Input */}
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search posts, tags, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isSearching}
              size="sm"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Search Results</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="text-xs"
                >
                  Clear
                </Button>
              </div>
              {searchResults.map((post) => (
                <div key={post.id} className="p-3 rounded-lg bg-muted/30 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                        {post.profiles?.display_name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">{post.profiles?.display_name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {post.content}
                  </p>
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 3).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Trending Tags */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Trending Topics
            </h4>
            <div className="flex flex-wrap gap-2">
              {trendingTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-smooth"
                  onClick={() => {
                    setSearchQuery(tag);
                    handleSearch();
                  }}
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};