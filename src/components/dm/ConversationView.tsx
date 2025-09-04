import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { Send } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import { fetchMessages, sendMessage, markThreadRead, type DMMessage } from '@/lib/dm'

export default function ConversationView() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const { user } = useAuth()
  const [messages, setMessages] = useState<DMMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (conversationId) {
      loadMessages()
      markAsRead()
    }
  }, [conversationId, loadMessages, markAsRead])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    if (!conversationId) return
    
    try {
      setLoading(true)
      const data = await fetchMessages(conversationId)
      setMessages(data)
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async () => {
    if (!conversationId) return
    
    try {
      await markThreadRead(conversationId)
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !conversationId || sending) return

    try {
      setSending(true)
      const message = await sendMessage(conversationId, newMessage.trim())
      setMessages(prev => [...prev, message])
      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwnMessage = message.sender_id === user?.id
          
          return (
            <div
              key={message.id}
              className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
            >
              {!isOwnMessage && (
                <Avatar className="w-8 h-8">
                  <AvatarImage src={message.sender.avatar_url || ''} />
                  <AvatarFallback className="text-xs">
                    {message.sender.display_name?.[0] || message.sender.username[0]}
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className={`max-w-[70%] ${isOwnMessage ? 'text-right' : ''}`}>
                <div
                  className={`inline-block p-3 rounded-lg ${
                    isOwnMessage
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{message.body}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 min-h-0 resize-none"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage(e)
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim() || sending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}