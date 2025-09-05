import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Users, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { sendRequest, acceptRequest, declineRequest, getRelationshipStatus, type RelationshipState } from '@/services/relationships';

interface SuggestedUser {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  mutual_friends?: number;
}

export function SuggestedPeople({ className = '' }: { className?: string }) {
  const { user } = useAuth();
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [relationships, setRelationships] = useState<Map<string, RelationshipState>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  const loadSuggestedUsers = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Get users who are not already friends or have pending requests
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          display_name,
          avatar_url,
          bio,
          discoverable
        `)
        .eq('discoverable', true)
        .neq('id', user.id)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error('Error loading suggested users:', error);
        return;
      }

      setSuggestedUsers(data || []);

      // Load relationship statuses
      const relationshipPromises = (data || []).map(async (person) => {
        const relationship = await getRelationshipStatus(person.id);
        return { userId: person.id, relationship };
      });

      const relationshipResults = await Promise.all(relationshipPromises);
      const relationshipMap = new Map<string, RelationshipState>();
      relationshipResults.forEach(({ userId, relationship }) => {
        if (relationship?.state) {
          relationshipMap.set(userId, relationship.state);
        }
      });

      setRelationships(relationshipMap);
    } catch (error) {
      console.error('Error loading suggested users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestedUsers();
  }, [user?.id, loadSuggestedUsers]);

  const handleSendRequest = async (targetUserId: string) => {
    if (!user?.id) return;

    const success = await sendRequest(targetUserId);
    if (success) {
      setRelationships(prev => new Map(prev.set(targetUserId, 'requested')));
    }
  };

  const handleAcceptRequest = async (requesterId: string) => {
    if (!user?.id) return;

    const success = await acceptRequest(requesterId);
    if (success) {
      setRelationships(prev => new Map(prev.set(requesterId, 'accepted')));
    }
  };

  const handleDeclineRequest = async (requesterId: string) => {
    if (!user?.id) return;

    const success = await declineRequest(requesterId);
    if (success) {
      setRelationships(prev => {
        const newMap = new Map(prev);
        newMap.delete(requesterId);
        return newMap;
      });
    }
  };

  const getActionButton = (person: SuggestedUser) => {
    const relationship = relationships.get(person.id);

    if (!relationship) {
      return (
        <button
          onClick={() => handleSendRequest(person.id)}
          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-800/50 hover:bg-emerald-800/70 text-emerald-100 rounded-lg text-sm transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Add Friend
        </button>
      );
    }

    switch (relationship) {
      case 'requested':
        return (
          <span className="text-sm text-emerald-300/70 px-3 py-1.5">
            Request sent
          </span>
        );
      case 'accepted':
        return (
          <span className="text-sm text-emerald-300/70 px-3 py-1.5">
            Friends
          </span>
        );
      case 'blocked':
        return (
          <span className="text-sm text-emerald-300/70 px-3 py-1.5">
            Blocked
          </span>
        );
      default:
        return null;
    }
  };

  if (!user) return null;

  return (
    <div className={`bg-emerald-950/50 border border-emerald-800/40 rounded-2xl ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-emerald-800/40">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-emerald-50 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Suggested People
          </h2>
          <Link
            to="/search?tab=people"
            className="text-sm text-emerald-300 hover:text-emerald-100 transition-colors"
          >
            View all
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-emerald-900/50" />
                <div className="flex-1">
                  <div className="h-4 bg-emerald-900/50 rounded w-24 mb-1" />
                  <div className="h-3 bg-emerald-900/50 rounded w-16" />
                </div>
                <div className="h-8 w-20 bg-emerald-900/50 rounded" />
              </div>
            ))}
          </div>
        ) : suggestedUsers.length === 0 ? (
          <div className="text-center py-4">
            <Users className="h-8 w-8 text-emerald-400/50 mx-auto mb-2" />
            <p className="text-sm text-emerald-300/70">
              No suggestions right now
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestedUsers.map((person) => (
              <div key={person.id} className="flex items-center gap-3">
                <Link
                  to={`/@${person.username}`}
                  className="flex-shrink-0"
                >
                  {person.avatar_url ? (
                    <img
                      src={person.avatar_url}
                      alt={person.display_name || person.username}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-emerald-800/50 flex items-center justify-center">
                      <span className="text-sm text-emerald-300">
                        {(person.display_name || person.username)[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <Link
                    to={`/@${person.username}`}
                    className="block hover:text-emerald-100 transition-colors"
                  >
                    <p className="text-sm font-medium text-emerald-50 truncate">
                      {person.display_name || person.username}
                    </p>
                    <p className="text-xs text-emerald-300/70 truncate">
                      @{person.username}
                    </p>
                  </Link>
                  {person.bio && (
                    <p className="text-xs text-emerald-400/60 mt-1 line-clamp-1">
                      {person.bio}
                    </p>
                  )}
                </div>

                {getActionButton(person)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
