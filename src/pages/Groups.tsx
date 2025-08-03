import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGroups } from '@/contexts/GroupContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateGroupModal } from '@/components/groups/CreateGroupModal';
import { GroupCard } from '@/components/groups/GroupCard';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Plus, Users, LogOut } from 'lucide-react';

const Groups: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { groups, userGroups, searchGroups, getGroupsByCategory, loading } = useGroups();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const categories = ['Technology', 'Gaming', 'Lifestyle', 'Education', 'Sports', 'Arts', 'Business'];

  const filteredGroups = searchQuery 
    ? searchGroups(searchQuery)
    : selectedCategory 
    ? getGroupsByCategory(selectedCategory)
    : groups;

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Under Pines Groups
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary">
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            <Tabs defaultValue="discover" className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <TabsList className="grid w-full sm:w-auto grid-cols-2">
                  <TabsTrigger value="discover">Discover Groups</TabsTrigger>
                  <TabsTrigger value="my-groups">My Groups</TabsTrigger>
                </TabsList>
                
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Group
                </Button>
              </div>

              <TabsContent value="discover" className="space-y-6">
                {/* Search and Filters */}
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search groups..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge 
                      variant={selectedCategory === '' ? 'default' : 'secondary'}
                      className="cursor-pointer"
                      onClick={() => setSelectedCategory('')}
                    >
                      All Categories
                    </Badge>
                    {categories.map((category) => (
                      <Badge
                        key={category}
                        variant={selectedCategory === category ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => setSelectedCategory(category)}
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Groups Grid */}
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardHeader>
                          <div className="h-4 bg-muted rounded w-3/4" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                        </CardHeader>
                        <CardContent>
                          <div className="h-16 bg-muted rounded" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredGroups.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No groups found</h3>
                      <p className="text-muted-foreground text-center">
                        {searchQuery || selectedCategory 
                          ? 'Try adjusting your search or filters'
                          : 'Be the first to create a group!'
                        }
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredGroups.map((group) => (
                      <GroupCard key={group.id} group={group} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="my-groups" className="space-y-6">
                {userGroups.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No groups yet</h3>
                      <p className="text-muted-foreground text-center mb-4">
                        Join or create groups to connect with like-minded people
                      </p>
                      <Button onClick={() => setShowCreateModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Group
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {userGroups.map((group) => (
                      <GroupCard key={group.id} group={group} showManageButton />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Groups</span>
                  <span className="font-medium">{groups.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">My Groups</span>
                  <span className="font-medium">{userGroups.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Popular Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.slice(0, 5).map((category) => {
                  const count = getGroupsByCategory(category).length;
                  return (
                    <div key={category} className="flex justify-between items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start p-0 h-auto font-normal"
                        onClick={() => setSelectedCategory(category)}
                      >
                        {category}
                      </Button>
                      <span className="text-sm text-muted-foreground">{count}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <CreateGroupModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal} 
      />
    </div>
  );
};

export default Groups;