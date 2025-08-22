import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocial } from '@/contexts/SocialContextSupabase';
import { supabase } from '@/integrations/supabase/client';

export const UserList: React.FC = () => {
  const { user } = useAuth();
  const { sendFriendRequest, friends, isLoading } = useSocial();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [user]);

  const loadUsers = async () => {
    if (!user) return;
    
    setIsLoadingUsers(true);
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .limit(10);

      if (error) {
        console.error('Error loading users:', error);
        return;
      }

      setUsers(profiles || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAlreadyFriend = (userId: string): boolean => {
    return friends.some(f => 
      (f.requester_id === userId || f.addressee_id === userId) && f.status === 'accepted'
    );
  };

  if (!user) return null;

  return (
    <Card className="card-gradient pine-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Discover People</CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoadingUsers ? (
          <p className="text-center text-muted-foreground text-sm py-4">Loading users...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-4">
            {searchTerm ? 'No users found' : 'No other users yet'}
          </p>
        ) : (
          filteredUsers.slice(0, 10).map((targetUser) => (
            <div key={targetUser.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {targetUser.display_name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{targetUser.display_name}</p>
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
      </CardContent>
    </Card>
  );
};