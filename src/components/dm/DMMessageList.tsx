import React, { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { listMessages, subscribeToDM, markAsRead, type DMMessage } from '@/services/dm';

interface DMMessageListProps {
  dmId: string;
  className?: string;
}

export function DMMessageList({ dmId, className = '' }: DMMessageListProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadMessages = async (offset = 0) => {
    if (!dmId) return;
    
    setIsLoading(true);
    try {
      const data = await listMessages(dmId, 50, offset);
      setMessages(prev => offset === 0 ? data : [...data, ...prev]);
      setHasMore(data.length === 50);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreMessages = () => {
    if (!isLoading && hasMore) {
      loadMessages(messages.length);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dmId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Subscribe to new messages
  useEffect(() => {
    if (!dmId || !user?.id) return;

    let unsubscribePromise: Promise<() => void>;
    
    const setupSubscription = async () => {
      unsubscribePromise = subscribeToDM(dmId, (message) => {
        setMessages(prev => [...prev, message]);
        if (message.sender_id !== user.id) {
          markAsRead(dmId, user.id);
        }
      });
    };

    setupSubscription();

    return () => {
      if (unsubscribePromise) {
        unsubscribePromise.then(unsubscribe => {
          if (typeof unsubscribe === 'function') {
            unsubscribe();
          }
        }).catch(() => {
          // Handle any errors silently
        });
      }
    };
  }, [dmId, user?.id]);

  // Mark messages as read when component mounts
  useEffect(() => {
    if (dmId && user?.id) {
      markAsRead(dmId, user.id);
    }
  }, [dmId, user?.id]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    if (scrollTop === 0 && hasMore && !isLoading) {
      loadMoreMessages();
    }
  };

  if (!user) return null;

  return (
    <div 
      ref={containerRef}
      className={`flex-1 overflow-y-auto ${className}`}
      onScroll={handleScroll}
    >
      {/* Load more indicator */}
      {isLoading && messages.length === 0 && (
        <div className="p-4 text-center text-emerald-300">
          Loading messages...
        </div>
      )}

      {/* Load more button */}
      {hasMore && messages.length > 0 && (
        <div className="p-4 text-center">
          <button
            onClick={loadMoreMessages}
            disabled={isLoading}
            className="text-sm text-emerald-300 hover:text-emerald-100 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load more messages'}
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="p-4 space-y-4">
        {messages.map((message) => {
          const isOwn = message.sender_id === user.id;
          
          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                {!isOwn && (
                  <div className="flex-shrink-0">
                    {message.author?.avatar_url ? (
                      <img
                        src={message.author.avatar_url}
                        alt={message.author.username}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-emerald-800/50 flex items-center justify-center">
                        <span className="text-xs text-emerald-300">
                          {message.author?.username?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Message bubble */}
                <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                  {!isOwn && (
                    <span className="text-xs text-emerald-400/60 mb-1">
                      {message.author?.display_name || message.author?.username}
                    </span>
                  )}
                  
                  <div
                    className={`px-3 py-2 rounded-2xl ${
                      isOwn
                        ? 'bg-amber-500 text-emerald-950'
                        : 'bg-emerald-900/50 text-emerald-50'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.body}
                    </p>
                  </div>
                  
                  <span className="text-xs text-emerald-400/60 mt-1">
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}
