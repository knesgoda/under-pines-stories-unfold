import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Plus, TrendingUp } from 'lucide-react';
import { useGroups } from '@/contexts/GroupContextSupabase';

export const GroupDiscovery: React.FC = () => {
  const { groups, joinGroup, isLoading } = useGroups();
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const popularGroups = groups
    .filter(group => group.member_count && group.member_count > 0)
    .sort((a, b) => (b.member_count || 0) - (a.member_count || 0))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card className="card-gradient pine-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Discover Groups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search groups by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Popular Groups */}
      {!searchQuery && popularGroups.length > 0 && (
        <Card className="card-gradient pine-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Popular Groups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularGroups.map((group) => (
                <div key={group.id} className="p-4 rounded-lg border border-border/50 bg-background/30 space-y-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {group.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">{group.name}</h4>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{group.member_count || 0} members</span>
                        <span>•</span>
                        <span className="capitalize">{group.type}</span>
                      </div>
                    </div>
                  </div>
                  
                  {group.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {group.description}
                    </p>
                  )}
                  
                  {group.tags && group.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {group.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <Button
                    onClick={() => joinGroup(group.id)}
                    disabled={isLoading}
                    size="sm"
                    className="w-full"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Join Group
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      <Card className="card-gradient pine-shadow">
        <CardHeader>
          <CardTitle>
            {searchQuery ? `Search Results (${filteredGroups.length})` : `All Groups (${groups.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredGroups.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? 'No groups found' : 'No groups available'}
              </h3>
              <p className="text-muted-foreground text-sm">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Be the first to create a group!'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGroups.map((group) => (
                <div key={group.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/30">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {group.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold">{group.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {group.type}
                        </Badge>
                      </div>
                      
                      {group.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {group.description}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{group.member_count || 0} members</span>
                        </div>
                        
                        {group.tags && group.tags.length > 0 && (
                          <div className="flex space-x-1">
                            {group.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {group.tags.length > 2 && (
                              <span className="text-muted-foreground">+{group.tags.length - 2} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => joinGroup(group.id)}
                    disabled={isLoading}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Join
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};