import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Group {
  id: string;
  name: string;
  description: string;
  avatar_url: string | null;
  cover_image_url: string | null;
  privacy: 'public' | 'private';
  category: string;
  created_by: string;
  member_count: number;
  post_count: number;
  created_at: string;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export interface GroupJoinRequest {
  id: string;
  group_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

interface GroupContextType {
  groups: Group[];
  userGroups: Group[];
  groupMembers: { [groupId: string]: GroupMember[] };
  joinRequests: GroupJoinRequest[];
  isLoading: boolean;
  createGroup: (groupData: Omit<Group, 'id' | 'created_by' | 'member_count' | 'post_count' | 'created_at'>) => Promise<boolean>;
  updateGroup: (groupId: string, updates: Partial<Group>) => Promise<boolean>;
  deleteGroup: (groupId: string) => Promise<boolean>;
  joinGroup: (groupId: string) => Promise<boolean>;
  leaveGroup: (groupId: string) => Promise<boolean>;
  requestToJoin: (groupId: string) => Promise<boolean>;
  approveJoinRequest: (requestId: string) => Promise<boolean>;
  rejectJoinRequest: (requestId: string) => Promise<boolean>;
  updateMemberRole: (groupId: string, userId: string, role: 'admin' | 'moderator' | 'member') => Promise<boolean>;
  removeMember: (groupId: string, userId: string) => Promise<boolean>;
  searchGroups: (query: string) => Group[];
  getGroupsByCategory: (category: string) => Group[];
  getUserRole: (groupId: string) => 'admin' | 'moderator' | 'member' | null;
  canManageGroup: (groupId: string) => boolean;
  refreshData: () => Promise<void>;
}

const GroupContext = createContext<GroupContextType | null>(null);

export const useGroups = () => {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroups must be used within a GroupProvider');
  }
  return context;
};

export const GroupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [groupMembers, setGroupMembers] = useState<{ [groupId: string]: GroupMember[] }>({});
  const [joinRequests, setJoinRequests] = useState<GroupJoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      refreshData();
      
      // Subscribe to real-time updates
      const groupsSubscription = supabase
        .channel('groups_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, () => {
          refreshData();
        })
        .subscribe();

      const membersSubscription = supabase
        .channel('group_members_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members' }, () => {
          refreshData();
        })
        .subscribe();

      return () => {
        groupsSubscription.unsubscribe();
        membersSubscription.unsubscribe();
      };
    }
  }, [user]);

  const refreshData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Load all public groups
      const { data: allGroups, error: groupsError } = await supabase
        .from('groups')
        .select(`
          *,
          profiles:created_by (username, display_name, avatar_url)
        `)
        .eq('privacy', 'public')
        .order('created_at', { ascending: false });

      if (groupsError) {
        console.error('Error loading groups:', groupsError);
      } else {
        setGroups(allGroups || []);
      }

      // Load user's groups (including private ones they're members of)
      const { data: membershipData, error: membershipError } = await supabase
        .from('group_members')
        .select(`
          groups (
            *,
            profiles:created_by (username, display_name, avatar_url)
          )
        `)
        .eq('user_id', user.id);

      if (membershipError) {
        console.error('Error loading user groups:', membershipError);
      } else {
        const userGroupsData = membershipData?.map(m => m.groups).filter(Boolean) || [];
        setUserGroups(userGroupsData.flat() as Group[]);
      }

      // Load members for each group the user is in
      const groupIds = membershipData?.map(m => (m.groups as any)?.id).filter(Boolean) || [];
      const membersData: { [groupId: string]: GroupMember[] } = {};

      for (const groupId of groupIds) {
        const { data: members } = await supabase
          .from('group_members')
          .select(`
            *,
            profiles:user_id (username, display_name, avatar_url)
          `)
          .eq('group_id', groupId);

        if (members) {
          membersData[groupId] = members;
        }
      }
      setGroupMembers(membersData);

      // Load pending join requests for groups the user manages
      const adminGroups = Object.entries(membersData)
        .filter(([_, members]) => 
          members.some(m => m.user_id === user.id && ['admin', 'moderator'].includes(m.role))
        )
        .map(([groupId]) => groupId);

      if (adminGroups.length > 0) {
        const { data: requests } = await supabase
          .from('group_join_requests')
          .select(`
            *,
            profiles:user_id (username, display_name, avatar_url)
          `)
          .in('group_id', adminGroups)
          .eq('status', 'pending');

        setJoinRequests(requests || []);
      }

    } catch (error) {
      console.error('Error refreshing group data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createGroup = async (groupData: Omit<Group, 'id' | 'created_by' | 'member_count' | 'post_count' | 'created_at'>): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('groups')
        .insert({
          ...groupData,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create group",
          variant: "destructive",
        });
        return false;
      }

      // Add creator as admin
      await supabase
        .from('group_members')
        .insert({
          group_id: data.id,
          user_id: user.id,
          role: 'admin',
        });

      toast({
        title: "Success",
        description: "Group created successfully",
      });

      await refreshData();
      return true;
    } catch (error) {
      console.error('Error creating group:', error);
      return false;
    }
  };

  const updateGroup = async (groupId: string, updates: Partial<Group>): Promise<boolean> => {
    if (!user || !canManageGroup(groupId)) return false;

    try {
      const { error } = await supabase
        .from('groups')
        .update(updates)
        .eq('id', groupId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update group",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Group updated successfully",
      });

      await refreshData();
      return true;
    } catch (error) {
      console.error('Error updating group:', error);
      return false;
    }
  };

  const deleteGroup = async (groupId: string): Promise<boolean> => {
    if (!user || getUserRole(groupId) !== 'admin') return false;

    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete group",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Group deleted successfully",
      });

      await refreshData();
      return true;
    } catch (error) {
      console.error('Error deleting group:', error);
      return false;
    }
  };

  const joinGroup = async (groupId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const group = groups.find(g => g.id === groupId);
      if (!group) return false;

      if (group.privacy === 'private') {
        return await requestToJoin(groupId);
      }

      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member',
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to join group",
          variant: "destructive",
        });
        return false;
      }

      // Update member count
      await supabase
        .from('groups')
        .update({ member_count: group.member_count + 1 })
        .eq('id', groupId);

      toast({
        title: "Success",
        description: "Joined group successfully",
      });

      await refreshData();
      return true;
    } catch (error) {
      console.error('Error joining group:', error);
      return false;
    }
  };

  const leaveGroup = async (groupId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to leave group",
          variant: "destructive",
        });
        return false;
      }

      // Update member count
      const group = groups.find(g => g.id === groupId);
      if (group) {
        await supabase
          .from('groups')
          .update({ member_count: Math.max(0, group.member_count - 1) })
          .eq('id', groupId);
      }

      toast({
        title: "Success",
        description: "Left group successfully",
      });

      await refreshData();
      return true;
    } catch (error) {
      console.error('Error leaving group:', error);
      return false;
    }
  };

  const requestToJoin = async (groupId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('group_join_requests')
        .insert({
          group_id: groupId,
          user_id: user.id,
          status: 'pending',
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to send join request",
          variant: "destructive",
        });
        return false;
      }

      // Notify group admins
      const admins = groupMembers[groupId]?.filter(m => m.role === 'admin') || [];
      for (const admin of admins) {
        await supabase
          .from('notifications')
          .insert({
            user_id: admin.user_id,
            type: 'group_join',
            from_user_id: user.id,
            group_id: groupId,
            message: `${user.display_name} requested to join your group`,
          });
      }

      toast({
        title: "Success",
        description: "Join request sent",
      });

      return true;
    } catch (error) {
      console.error('Error requesting to join group:', error);
      return false;
    }
  };

  const approveJoinRequest = async (requestId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const request = joinRequests.find(r => r.id === requestId);
      if (!request || !canManageGroup(request.group_id)) return false;

      // Add user to group
      await supabase
        .from('group_members')
        .insert({
          group_id: request.group_id,
          user_id: request.user_id,
          role: 'member',
        });

      // Update request status
      await supabase
        .from('group_join_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);

      // Update member count
      const group = groups.find(g => g.id === request.group_id);
      if (group) {
        await supabase
          .from('groups')
          .update({ member_count: group.member_count + 1 })
          .eq('id', request.group_id);
      }

      // Notify user
      await supabase
        .from('notifications')
        .insert({
          user_id: request.user_id,
          type: 'group_invite',
          from_user_id: user.id,
          group_id: request.group_id,
          message: `Your request to join the group was approved`,
        });

      toast({
        title: "Success",
        description: "Join request approved",
      });

      await refreshData();
      return true;
    } catch (error) {
      console.error('Error approving join request:', error);
      return false;
    }
  };

  const rejectJoinRequest = async (requestId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const request = joinRequests.find(r => r.id === requestId);
      if (!request || !canManageGroup(request.group_id)) return false;

      await supabase
        .from('group_join_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      toast({
        title: "Success",
        description: "Join request rejected",
      });

      await refreshData();
      return true;
    } catch (error) {
      console.error('Error rejecting join request:', error);
      return false;
    }
  };

  const updateMemberRole = async (groupId: string, userId: string, role: 'admin' | 'moderator' | 'member'): Promise<boolean> => {
    if (!user || !canManageGroup(groupId)) return false;

    try {
      const { error } = await supabase
        .from('group_members')
        .update({ role })
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update member role",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Member role updated",
      });

      await refreshData();
      return true;
    } catch (error) {
      console.error('Error updating member role:', error);
      return false;
    }
  };

  const removeMember = async (groupId: string, userId: string): Promise<boolean> => {
    if (!user || !canManageGroup(groupId)) return false;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to remove member",
          variant: "destructive",
        });
        return false;
      }

      // Update member count
      const group = groups.find(g => g.id === groupId);
      if (group) {
        await supabase
          .from('groups')
          .update({ member_count: Math.max(0, group.member_count - 1) })
          .eq('id', groupId);
      }

      toast({
        title: "Success",
        description: "Member removed",
      });

      await refreshData();
      return true;
    } catch (error) {
      console.error('Error removing member:', error);
      return false;
    }
  };

  const searchGroups = (query: string): Group[] => {
    const searchTerm = query.toLowerCase();
    return groups.filter(group =>
      group.name.toLowerCase().includes(searchTerm) ||
      group.description.toLowerCase().includes(searchTerm) ||
      group.category.toLowerCase().includes(searchTerm)
    );
  };

  const getGroupsByCategory = (category: string): Group[] => {
    return groups.filter(group => group.category === category);
  };

  const getUserRole = (groupId: string): 'admin' | 'moderator' | 'member' | null => {
    if (!user || !groupMembers[groupId]) return null;
    const member = groupMembers[groupId].find(m => m.user_id === user.id);
    return member ? member.role : null;
  };

  const canManageGroup = (groupId: string): boolean => {
    const role = getUserRole(groupId);
    return role === 'admin' || role === 'moderator';
  };

  const value: GroupContextType = {
    groups,
    userGroups,
    groupMembers,
    joinRequests,
    isLoading,
    createGroup,
    updateGroup,
    deleteGroup,
    joinGroup,
    leaveGroup,
    requestToJoin,
    approveJoinRequest,
    rejectJoinRequest,
    updateMemberRole,
    removeMember,
    searchGroups,
    getGroupsByCategory,
    getUserRole,
    canManageGroup,
    refreshData,
  };

  return (
    <GroupContext.Provider value={value}>
      {children}
    </GroupContext.Provider>
  );
};