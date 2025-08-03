import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGroups } from '@/contexts/GroupContext';
import { groupStorage, groupMemberStorage, userStorage } from '@/lib/localStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { GroupSettings } from '@/components/groups/GroupSettings';
import { GroupMembers } from '@/components/groups/GroupMembers';
import { ArrowLeft, Users, Crown, Shield, Settings, UserPlus } from 'lucide-react';
import type { Group, User, GroupMember } from '@/lib/localStorage';

const GroupDetail: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { joinGroup, leaveGroup, requestToJoin, getUserRole, canManageGroup } = useGroups();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<(GroupMember & { user: User })[]>([]);
  const [userRole, setUserRole] = useState<GroupMember['role'] | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!groupId || !user) {
      navigate('/groups');
      return;
    }

    loadGroupData();
  }, [groupId, user]);

  const loadGroupData = () => {
    if (!groupId) return;

    setLoading(true);
    try {
      // Load group
      const groupData = groupStorage.getById(groupId);
      if (!groupData) {
        navigate('/groups');
        return;
      }
      setGroup(groupData);

      // Load members
      const groupMembers = groupMemberStorage.getByGroupId(groupId);
      const membersWithUsers = groupMembers.map(member => {
        const memberUser = userStorage.getById(member.userId);
        return { ...member, user: memberUser! };
      }).filter(m => m.user);
      setMembers(membersWithUsers);

      // Check user role and membership
      if (user) {
        const role = getUserRole(groupId);
        setUserRole(role);
        setIsMember(role !== null);
      }
    } catch (error) {
      console.error('Failed to load group data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!groupId) return;
    await joinGroup(groupId);
    loadGroupData();
  };

  const handleLeaveGroup = async () => {
    if (!groupId) return;
    await leaveGroup(groupId);
    loadGroupData();
  };

  const handleRequestJoin = async () => {
    if (!groupId) return;
    await requestToJoin(groupId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!group || !user) {
    return null;
  }

  const isAdmin = userRole === 'admin';
  const isModerator = userRole === 'moderator';
  const canManage = canManageGroup(group.id);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/groups')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Groups
          </Button>
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {group.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h1 className="text-2xl font-bold">{group.name}</h1>
                <p className="text-muted-foreground">{group.description}</p>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant="outline">{group.category}</Badge>
                  <Badge variant={group.privacy === 'public' ? 'default' : 'secondary'}>
                    {group.privacy}
                  </Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {group.memberCount} members
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-auto">
              {isMember ? (
                <>
                  {canManage && (
                    <Button variant="outline" onClick={() => setShowSettings(true)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                  )}
                  <Button variant="outline" onClick={handleLeaveGroup}>
                    Leave Group
                  </Button>
                </>
              ) : (
                <Button onClick={group.privacy === 'public' ? handleJoinGroup : handleRequestJoin}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {group.privacy === 'public' ? 'Join Group' : 'Request to Join'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="about" className="space-y-6">
          <TabsList>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            {isMember && <TabsTrigger value="feed">Feed</TabsTrigger>}
          </TabsList>

          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About {group.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>{group.description}</p>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Category</h4>
                    <Badge variant="outline">{group.category}</Badge>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Privacy</h4>
                    <Badge variant={group.privacy === 'public' ? 'default' : 'secondary'}>
                      {group.privacy}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Created</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(group.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members">
            <GroupMembers 
              groupId={group.id} 
              members={members}
              canManage={canManage}
              currentUserRole={userRole}
              onMemberUpdate={loadGroupData}
            />
          </TabsContent>

          {isMember && (
            <TabsContent value="feed">
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Group Feed Coming Soon</h3>
                  <p className="text-muted-foreground text-center">
                    Group-specific posts and discussions will be available here soon.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {showSettings && (
        <GroupSettings
          group={group}
          open={showSettings}
          onOpenChange={setShowSettings}
          onUpdate={loadGroupData}
        />
      )}
    </div>
  );
};

export default GroupDetail;