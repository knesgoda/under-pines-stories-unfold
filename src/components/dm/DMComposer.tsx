import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { sendMessage, sendTyping } from '@/services/dm';

interface DMComposerProps {
  dmId: string;
  onMessageSent?: (message: any) => void;
  className?: string;
}

export function DMComposer({ dmId, onMessageSent, className = '' }: DMComposerProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !user?.id || isSending) return;

    const messageText = message.trim();
    setMessage('');
    setIsSending(true);

    try {
      const sentMessage = await sendMessage(dmId, user.id, messageText);
      if (sentMessage) {
        onMessageSent?.(sentMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore message on error
      setMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Handle typing indicator
    if (value.trim() && user?.id) {
      if (!isTyping) {
        setIsTyping(true);
        sendTyping(dmId, user.id, true);
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        sendTyping(dmId, user.id, false);
      }, 2000);
    } else if (isTyping && user?.id) {
      setIsTyping(false);
      sendTyping(dmId, user.id, false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Cleanup typing indicator on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping && user?.id) {
        sendTyping(dmId, user.id, false);
      }
    };
  }, [dmId, user?.id, isTyping]);

  if (!user) return null;

  return (
    <div className={`border-t border-emerald-800/40 bg-emerald-950/50 ${className}`}>
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              maxLength={2000}
              className="w-full resize-none bg-emerald-900/50 border border-emerald-800/40 rounded-xl px-3 py-2 text-emerald-50 placeholder:text-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors"
              disabled={isSending}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-emerald-400/60">
                {message.length}/2000
              </span>
              {isTyping && (
                <span className="text-xs text-emerald-300/70">
                  Typing...
                </span>
              )}
            </div>
          </div>
          
          <button
            type="submit"
            disabled={!message.trim() || isSending}
            className="flex-shrink-0 h-10 w-10 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-emerald-800/50 disabled:text-emerald-400/50 text-emerald-950 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
