import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Users } from 'lucide-react';
import { useMessages } from '@/contexts/MessageContextSupabase';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  onSelectConversation: (conversationId: string) => void;
  selectedConversationId?: string;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  onSelectConversation,
  selectedConversationId
}) => {
  const { conversations, isLoading } = useMessages();

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageCircle className="h-5 w-5 mr-2" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Loading conversations...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageCircle className="h-5 w-5 mr-2" />
          Messages ({conversations.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {conversations.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 px-4">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs mt-1">Send a friend request to start messaging!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conversation) => {
              const isSelected = selectedConversationId === conversation.id;
              const otherParticipant = conversation.participants?.[0]; // Assuming direct messages for now
              
              return (
                <div
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`p-4 cursor-pointer transition-smooth hover:bg-muted/50 border-b border-border/50 ${
                    isSelected ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {conversation.type === 'group' ? (
                            <Users className="h-6 w-6" />
                          ) : (
                            otherParticipant?.display_name?.charAt(0).toUpperCase() || 'U'
                          )}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.unread_count && conversation.unread_count > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                        >
                          {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm truncate">
                          {conversation.name || otherParticipant?.display_name || 'Unknown User'}
                        </h4>
                        {conversation.last_activity_at && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conversation.last_activity_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.messages && conversation.messages.length > 0 ? (
                            <span>{conversation.messages[0].content}</span>
                          ) : (
                            <span className="italic">No messages yet</span>
                          )}
                        </p>
                        {conversation.unread_count && conversation.unread_count > 0 && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};