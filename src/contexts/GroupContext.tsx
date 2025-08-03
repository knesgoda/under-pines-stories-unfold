import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Group, 
  GroupMember, 
  GroupJoinRequest,
  groupStorage, 
  groupMemberStorage, 
  groupJoinRequestStorage 
} from '@/lib/localStorage';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface GroupContextType {
  // State
  groups: Group[];
  userGroups: Group[];
  groupMembers: Record<string, GroupMember[]>;
  joinRequests: GroupJoinRequest[];
  loading: boolean;

  // Actions
  createGroup: (groupData: Omit<Group, 'id' | 'createdAt' | 'memberCount' | 'postCount' | 'createdBy'>) => Promise<Group>;
  updateGroup: (groupId: string, updates: Partial<Pick<Group, 'name' | 'description' | 'avatar' | 'coverImage' | 'privacy' | 'category'>>) => Promise<Group | null>;
  deleteGroup: (groupId: string) => Promise<boolean>;
  
  joinGroup: (groupId: string) => Promise<boolean>;
  leaveGroup: (groupId: string) => Promise<boolean>;
  requestToJoin: (groupId: string) => Promise<boolean>;
  
  approveJoinRequest: (requestId: string) => Promise<boolean>;
  rejectJoinRequest: (requestId: string) => Promise<boolean>;
  
  updateMemberRole: (groupId: string, userId: string, role: GroupMember['role']) => Promise<boolean>;
  removeMember: (groupId: string, userId: string) => Promise<boolean>;
  
  searchGroups: (query: string) => Group[];
  getGroupsByCategory: (category: string) => Group[];
  getUserRole: (groupId: string) => GroupMember['role'] | null;
  canManageGroup: (groupId: string) => boolean;
  
  refreshData: () => void;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

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
  const [groupMembers, setGroupMembers] = useState<Record<string, GroupMember[]>>({});
  const [joinRequests, setJoinRequests] = useState<GroupJoinRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshData = () => {
    if (!user) {
      setGroups([]);
      setUserGroups([]);
      setGroupMembers({});
      setJoinRequests([]);
      return;
    }

    setLoading(true);
    try {
      // Load all groups
      const allGroups = groupStorage.getAll();
      setGroups(allGroups);

      // Load user's groups
      const userGroupIds = groupMemberStorage.getUserGroups(user.id);
      const userGroupsData = allGroups.filter(group => userGroupIds.includes(group.id));
      setUserGroups(userGroupsData);

      // Load group members for all groups
      const membersData: Record<string, GroupMember[]> = {};
      allGroups.forEach(group => {
        membersData[group.id] = groupMemberStorage.getByGroupId(group.id);
      });
      setGroupMembers(membersData);

      // Load join requests
      const userRequests = groupJoinRequestStorage.getByUserId(user.id);
      setJoinRequests(userRequests);
    } catch (error) {
      console.error('Failed to refresh group data:', error);
      toast.error('Failed to load group data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [user]);

  const createGroup = async (groupData: Omit<Group, 'id' | 'createdAt' | 'memberCount' | 'postCount' | 'createdBy'>): Promise<Group> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const newGroup = groupStorage.create({
        ...groupData,
        createdBy: user.id,
      });

      toast.success(`Group "${newGroup.name}" created successfully!`);
      refreshData();
      return newGroup;
    } catch (error) {
      console.error('Failed to create group:', error);
      toast.error('Failed to create group');
      throw error;
    }
  };

  const updateGroup = async (groupId: string, updates: Partial<Pick<Group, 'name' | 'description' | 'avatar' | 'coverImage' | 'privacy' | 'category'>>): Promise<Group | null> => {
    if (!user) return null;

    try {
      const updatedGroup = groupStorage.update(groupId, updates);
      if (updatedGroup) {
        toast.success('Group updated successfully!');
        refreshData();
      }
      return updatedGroup;
    } catch (error) {
      console.error('Failed to update group:', error);
      toast.error('Failed to update group');
      return null;
    }
  };

  const deleteGroup = async (groupId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const success = groupStorage.delete(groupId);
      if (success) {
        toast.success('Group deleted successfully');
        refreshData();
      }
      return success;
    } catch (error) {
      console.error('Failed to delete group:', error);
      toast.error('Failed to delete group');
      return false;
    }
  };

  const joinGroup = async (groupId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const group = groupStorage.getById(groupId);
      if (!group) return false;

      if (group.privacy === 'private') {
        // For private groups, create join request
        return requestToJoin(groupId);
      }

      // For public groups, join immediately
      groupMemberStorage.create({
        groupId,
        userId: user.id,
        role: 'member',
      });

      toast.success(`Joined "${group.name}" successfully!`);
      refreshData();
      return true;
    } catch (error) {
      console.error('Failed to join group:', error);
      toast.error('Failed to join group');
      return false;
    }
  };

  const leaveGroup = async (groupId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const success = groupMemberStorage.remove(groupId, user.id);
      if (success) {
        const group = groupStorage.getById(groupId);
        toast.success(`Left "${group?.name}" successfully`);
        refreshData();
      }
      return success;
    } catch (error) {
      console.error('Failed to leave group:', error);
      toast.error('Failed to leave group');
      return false;
    }
  };

  const requestToJoin = async (groupId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Check if request already exists
      if (groupJoinRequestStorage.hasPendingRequest(groupId, user.id)) {
        toast.info('Join request already pending');
        return false;
      }

      groupJoinRequestStorage.create(groupId, user.id);
      const group = groupStorage.getById(groupId);
      toast.success(`Join request sent to "${group?.name}"`);
      refreshData();
      return true;
    } catch (error) {
      console.error('Failed to request join:', error);
      toast.error('Failed to send join request');
      return false;
    }
  };

  const approveJoinRequest = async (requestId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const request = groupJoinRequestStorage.updateStatus(requestId, 'approved');
      if (request) {
        toast.success('Join request approved');
        refreshData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to approve request:', error);
      toast.error('Failed to approve join request');
      return false;
    }
  };

  const rejectJoinRequest = async (requestId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const request = groupJoinRequestStorage.updateStatus(requestId, 'rejected');
      if (request) {
        toast.success('Join request rejected');
        refreshData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to reject request:', error);
      toast.error('Failed to reject join request');
      return false;
    }
  };

  const updateMemberRole = async (groupId: string, userId: string, role: GroupMember['role']): Promise<boolean> => {
    if (!user) return false;

    try {
      const updatedMember = groupMemberStorage.updateRole(groupId, userId, role);
      if (updatedMember) {
        toast.success(`Member role updated to ${role}`);
        refreshData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update member role:', error);
      toast.error('Failed to update member role');
      return false;
    }
  };

  const removeMember = async (groupId: string, userId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const success = groupMemberStorage.remove(groupId, userId);
      if (success) {
        toast.success('Member removed from group');
        refreshData();
      }
      return success;
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast.error('Failed to remove member');
      return false;
    }
  };

  const searchGroups = (query: string): Group[] => {
    return groupStorage.search(query);
  };

  const getGroupsByCategory = (category: string): Group[] => {
    return groupStorage.getByCategory(category);
  };

  const getUserRole = (groupId: string): GroupMember['role'] | null => {
    if (!user) return null;
    return groupMemberStorage.getMemberRole(groupId, user.id);
  };

  const canManageGroup = (groupId: string): boolean => {
    if (!user) return false;
    const role = getUserRole(groupId);
    return role === 'admin' || role === 'moderator';
  };

  const value: GroupContextType = {
    groups,
    userGroups,
    groupMembers,
    joinRequests,
    loading,
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