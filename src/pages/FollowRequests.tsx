import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { Loader2 } from 'lucide-react'

interface FollowRequest {
  request_id: string
  created_at: string
  profiles: {
    id: string
    username: string
    display_name?: string
    avatar_url?: string
  }
}

export default function FollowRequests() {
  const { user } = useAuth()
  const [incomingRequests, setIncomingRequests] = useState<FollowRequest[]>([])
  const [outgoingRequests, setOutgoingRequests] = useState<FollowRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (user) {
      fetchRequests()
    }
  }, [user])

  async function fetchRequests() {
    try {
      setLoading(true)
      
      const [incomingRes, outgoingRes] = await Promise.all([
        supabase.functions.invoke('follow-requests', {
          method: 'GET',
          body: { box: 'incoming' }
        }),
        supabase.functions.invoke('follow-requests', {
          method: 'GET', 
          body: { box: 'outgoing' }
        })
      ])

      if (incomingRes.error) throw incomingRes.error
      if (outgoingRes.error) throw outgoingRes.error

      setIncomingRequests(incomingRes.data.requests || [])
      setOutgoingRequests(outgoingRes.data.requests || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleRequest(requestId: string, action: 'accept' | 'decline' | 'cancel') {
    try {
      setProcessingIds(prev => new Set(prev).add(requestId))
      
      const { error } = await supabase.functions.invoke(`follow-requests/${action}`, {
        body: { requestId }
      })
      
      if (error) throw error
      
      // Remove from appropriate list
      if (action === 'accept' || action === 'decline') {
        setIncomingRequests(prev => prev.filter(req => req.request_id !== requestId))
      } else {
        setOutgoingRequests(prev => prev.filter(req => req.request_id !== requestId))
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error)
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(requestId)
        return newSet
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Follow Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="incoming" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="incoming">
                  Incoming ({incomingRequests.length})
                </TabsTrigger>
                <TabsTrigger value="outgoing">
                  Sent ({outgoingRequests.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="incoming" className="space-y-4">
                {incomingRequests.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No incoming requests
                  </p>
                ) : (
                  incomingRequests.map((request) => (
                    <div
                      key={request.request_id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={request.profiles.avatar_url} />
                          <AvatarFallback>
                            {request.profiles.display_name?.[0] || request.profiles.username[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {request.profiles.display_name || request.profiles.username}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            @{request.profiles.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleRequest(request.request_id, 'accept')}
                          disabled={processingIds.has(request.request_id)}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRequest(request.request_id, 'decline')}
                          disabled={processingIds.has(request.request_id)}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="outgoing" className="space-y-4">
                {outgoingRequests.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No sent requests
                  </p>
                ) : (
                  outgoingRequests.map((request) => (
                    <div
                      key={request.request_id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={request.profiles.avatar_url} />
                          <AvatarFallback>
                            {request.profiles.display_name?.[0] || request.profiles.username[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {request.profiles.display_name || request.profiles.username}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            @{request.profiles.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRequest(request.request_id, 'cancel')}
                        disabled={processingIds.has(request.request_id)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}