import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGroups } from '@/contexts/GroupContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Lock, Globe, UserPlus, Settings } from 'lucide-react';
import type { Group } from '@/lib/localStorage';

interface GroupCardProps {
  group: Group;
  showManageButton?: boolean;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group, showManageButton = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { joinGroup, requestToJoin, getUserRole, canManageGroup } = useGroups();
  
  const userRole = user ? getUserRole(group.id) : null;
  const isMember = userRole !== null;
  const canManage = user ? canManageGroup(group.id) : false;

  const handleCardClick = () => {
    navigate(`/groups/${group.id}`);
  };

  const handleJoinClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    if (group.privacy === 'public') {
      await joinGroup(group.id);
    } else {
      await requestToJoin(group.id);
    }
  };

  const handleManageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/groups/${group.id}`);
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleCardClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {group.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">{group.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {group.category}
                </Badge>
                {group.privacy === 'private' ? (
                  <Lock className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <Globe className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <CardDescription className="line-clamp-2 mb-4">
          {group.description}
        </CardDescription>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{group.memberCount} members</span>
          </div>
          
          <div className="flex items-center gap-2">
            {userRole && (
              <Badge variant="secondary" className="text-xs">
                {userRole}
              </Badge>
            )}
            
            {showManageButton && canManage ? (
              <Button size="sm" variant="outline" onClick={handleManageClick}>
                <Settings className="h-3 w-3 mr-1" />
                Manage
              </Button>
            ) : !isMember && user ? (
              <Button size="sm" onClick={handleJoinClick}>
                <UserPlus className="h-3 w-3 mr-1" />
                {group.privacy === 'public' ? 'Join' : 'Request'}
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};