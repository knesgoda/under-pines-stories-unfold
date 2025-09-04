import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { listThreads, type DMThread } from '@/services/dm';
import { formatDistanceToNow } from 'date-fns';

interface DMThreadListProps {
  className?: string;
}

export function DMThreadList({ className = '' }: DMThreadListProps) {
  const { user } = useAuth();
  const [threads, setThreads] = useState<DMThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadThreads = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const data = await listThreads(user.id);
      setThreads(data);
    } catch (error) {
      console.error('Error loading DM threads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, [user?.id]);

  const getOtherMembers = (thread: DMThread) => {
    return thread.members.filter(member => member.user_id !== user?.id);
  };

  const getThreadTitle = (thread: DMThread) => {
    const otherMembers = getOtherMembers(thread);
    
    if (otherMembers.length === 1) {
      const member = otherMembers[0];
      return member.user?.display_name || member.user?.username || 'Unknown User';
    } else if (otherMembers.length > 1) {
      return `${otherMembers.length} people`;
    }
    
    return 'Group Chat';
  };

  const getThreadAvatar = (thread: DMThread) => {
    const otherMembers = getOtherMembers(thread);
    
    if (otherMembers.length === 1) {
      return otherMembers[0].user?.avatar_url;
    }
    
    return null; // Group chat - could show multiple avatars or default icon
  };

  if (!user) return null;

  return (
    <div className={`bg-emerald-950/50 border border-emerald-800/40 rounded-2xl ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-emerald-800/40">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-emerald-50 flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Messages
          </h2>
          <Link
            to="/messages"
            className="text-sm text-emerald-300 hover:text-emerald-100 transition-colors"
          >
            View all
          </Link>
        </div>
      </div>

      {/* Threads List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-emerald-300">
            Loading messages...
          </div>
        ) : threads.length === 0 ? (
          <div className="p-4 text-center text-emerald-300">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs text-emerald-400/60 mt-1">
              Start a conversation with someone
            </p>
          </div>
        ) : (
          <div className="divide-y divide-emerald-800/40">
            {threads.map((thread) => (
              <Link
                key={thread.id}
                to={`/messages/${thread.id}`}
                className="block p-4 hover:bg-emerald-900/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {getThreadAvatar(thread) ? (
                      <img
                        src={getThreadAvatar(thread)}
                        alt={getThreadTitle(thread)}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-emerald-800/50 flex items-center justify-center">
                        <Users className="h-5 w-5 text-emerald-300" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-emerald-50 truncate">
                        {getThreadTitle(thread)}
                      </h3>
                      {thread.unread_count > 0 && (
                        <span className="flex-shrink-0 h-5 w-5 rounded-full bg-amber-400 text-emerald-950 text-xs font-bold flex items-center justify-center">
                          {thread.unread_count > 9 ? '9+' : thread.unread_count}
                        </span>
                      )}
                    </div>

                    {thread.last_message && (
                      <>
                        <p className="text-xs text-emerald-300/70 mt-1 truncate">
                          {thread.last_message.author?.username}: {thread.last_message.body}
                        </p>
                        <p className="text-xs text-emerald-400/60 mt-1">
                          {formatDistanceToNow(new Date(thread.last_message.created_at), { addSuffix: true })}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
