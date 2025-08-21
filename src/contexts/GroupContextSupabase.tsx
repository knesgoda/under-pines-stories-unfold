import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Group {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private';
  owner_id: string;
  avatar_url: string | null;
  banner_url: string | null;
  category: string;
  tags: string[] | null;
  member_count: number;
  privacy: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joined_at: string;
}

interface GroupContextType {
  groups: Group[];
  userGroups: Group[];
  groupMembers: { [groupId: string]: GroupMember[] };
  isLoading: boolean;
  createGroup: (groupData: Omit<Group, 'id' | 'owner_id' | 'member_count' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updateGroup: (groupId: string, updates: Partial<Group>) => Promise<boolean>;
  deleteGroup: (groupId: string) => Promise<boolean>;
  joinGroup: (groupId: string) => Promise<boolean>;
  leaveGroup: (groupId: string) => Promise<boolean>;
  updateMemberRole: (groupId: string, userId: string, role: 'owner' | 'admin' | 'moderator' | 'member') => Promise<boolean>;
  removeMember: (groupId: string, userId: string) => Promise<boolean>;
  searchGroups: (query: string) => Group[];
  getGroupsByCategory: (category: string) => Group[];
  getUserRole: (groupId: string) => 'owner' | 'admin' | 'moderator' | 'member' | null;
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
        .select('*')
        .eq('type', 'public')
        .order('created_at', { ascending: false });

      if (groupsError) {
        console.error('Error loading groups:', groupsError);
      } else {
        setGroups(allGroups || []);
      }

      // Load user's groups
      const { data: membershipData, error: membershipError } = await supabase
        .from('group_members')
        .select(`
          *,
          groups (*)
        `)
        .eq('user_id', user.id);

      if (membershipError) {
        console.error('Error loading user groups:', membershipError);
      } else {
        const userGroupsData = membershipData?.map(m => m.groups).filter(Boolean) || [];
        setUserGroups(userGroupsData as Group[]);
      }

      // Load members for each group the user is in
      const groupIds = membershipData?.map(m => m.group_id).filter(Boolean) || [];
      const membersData: { [groupId: string]: GroupMember[] } = {};

      for (const groupId of groupIds) {
        const { data: members } = await supabase
          .from('group_members')
          .select('*')
          .eq('group_id', groupId);

        if (members) {
          membersData[groupId] = members;
        }
      }
      setGroupMembers(membersData);

    } catch (error) {
      console.error('Error refreshing group data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createGroup = async (groupData: Omit<Group, 'id' | 'owner_id' | 'member_count' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('groups')
        .insert({
          ...groupData,
          owner_id: user.id,
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

      // Add creator as owner
      await supabase
        .from('group_members')
        .insert({
          group_id: data.id,
          user_id: user.id,
          role: 'owner',
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
    if (!user || getUserRole(groupId) !== 'owner') return false;

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
      const group = groups.find(g => g.id === groupId);
      if (group) {
        await supabase
          .from('groups')
          .update({ member_count: group.member_count + 1 })
          .eq('id', groupId);
      }

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

  const updateMemberRole = async (groupId: string, userId: string, role: 'owner' | 'admin' | 'moderator' | 'member'): Promise<boolean> => {
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
      (group.category && group.category.toLowerCase().includes(searchTerm))
    );
  };

  const getGroupsByCategory = (category: string): Group[] => {
    return groups.filter(group => group.category === category);
  };

  const getUserRole = (groupId: string): 'owner' | 'admin' | 'moderator' | 'member' | null => {
    if (!user || !groupMembers[groupId]) return null;
    const member = groupMembers[groupId].find(m => m.user_id === user.id);
    return member ? member.role : null;
  };

  const canManageGroup = (groupId: string): boolean => {
    const role = getUserRole(groupId);
    return role === 'owner' || role === 'admin';
  };

  const value: GroupContextType = {
    groups,
    userGroups,
    groupMembers,
    isLoading,
    createGroup,
    updateGroup,
    deleteGroup,
    joinGroup,
    leaveGroup,
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