import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGroups } from '@/contexts/GroupContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Crown, Shield, MoreVertical, UserMinus, UserCog } from 'lucide-react';
import type { GroupMember, User } from '@/lib/localStorage';

interface GroupMembersProps {
  groupId: string;
  members: (GroupMember & { user: User })[];
  canManage: boolean;
  currentUserRole: GroupMember['role'] | null;
  onMemberUpdate: () => void;
}

export const GroupMembers: React.FC<GroupMembersProps> = ({
  groupId,
  members,
  canManage,
  currentUserRole,
  onMemberUpdate,
}) => {
  const { user } = useAuth();
  const { updateMemberRole, removeMember } = useGroups();
  const [showRemoveDialog, setShowRemoveDialog] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const getRoleIcon = (role: GroupMember['role']) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'moderator':
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getRoleBadgeVariant = (role: GroupMember['role']) => {
    switch (role) {
      case 'admin':
        return 'default' as const;
      case 'moderator':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  const canModifyMember = (memberRole: GroupMember['role'], targetUserId: string) => {
    if (!canManage || !user || targetUserId === user.id) return false;
    if (currentUserRole === 'admin') return true;
    if (currentUserRole === 'moderator' && memberRole === 'member') return true;
    return false;
  };

  const handleRoleChange = async (memberId: string, targetUserId: string, newRole: GroupMember['role']) => {
    if (!canModifyMember(newRole, targetUserId)) return;

    setLoading(memberId);
    try {
      await updateMemberRole(groupId, targetUserId, newRole);
      onMemberUpdate();
    } finally {
      setLoading(null);
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    setLoading(targetUserId);
    try {
      await removeMember(groupId, targetUserId);
      onMemberUpdate();
      setShowRemoveDialog(null);
    } finally {
      setLoading(null);
    }
  };

  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder = { admin: 0, moderator: 1, member: 2 };
    const aOrder = roleOrder[a.role];
    const bOrder = roleOrder[b.role];
    
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.user.username.localeCompare(b.user.username);
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Members ({members.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {member.user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{member.user.username}</span>
                      {getRoleIcon(member.role)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={getRoleBadgeVariant(member.role)}>
                    {member.role}
                  </Badge>

                  {canModifyMember(member.role, member.userId) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          disabled={loading === member.id}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {member.role !== 'moderator' && currentUserRole === 'admin' && (
                          <DropdownMenuItem 
                            onClick={() => handleRoleChange(member.id, member.userId, 'moderator')}
                          >
                            <UserCog className="h-4 w-4 mr-2" />
                            Make Moderator
                          </DropdownMenuItem>
                        )}
                        
                        {member.role === 'moderator' && currentUserRole === 'admin' && (
                          <DropdownMenuItem 
                            onClick={() => handleRoleChange(member.id, member.userId, 'member')}
                          >
                            <UserCog className="h-4 w-4 mr-2" />
                            Remove Moderator
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem 
                          onClick={() => setShowRemoveDialog(member.userId)}
                          className="text-destructive"
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          Remove from Group
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!showRemoveDialog} onOpenChange={() => setShowRemoveDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member from the group? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => showRemoveDialog && handleRemoveMember(showRemoveDialog)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};