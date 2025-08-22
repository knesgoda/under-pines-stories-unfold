import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Check, X, Users } from 'lucide-react';
import { useSocial } from '@/contexts/SocialContextSupabase';

export const FriendRequests: React.FC = () => {
  const { friendRequests, acceptFriendRequest, rejectFriendRequest, isLoading } = useSocial();

  if (friendRequests.length === 0) {
    return null;
  }

  return (
    <Card className="card-gradient pine-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Friend Requests ({friendRequests.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {friendRequests.map((request) => {
          const requester = request.profiles;
          
          return (
            <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {requester?.display_name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{requester?.display_name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">@{requester?.username}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => acceptFriendRequest(request.id)}
                  disabled={isLoading}
                  className="h-8 px-3"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => rejectFriendRequest(request.id)}
                  disabled={isLoading}
                  className="h-8 px-3 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};