import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getPendingRequests, acceptRequest, declineRequest, removeFriend, type Relationship } from '@/services/relationships'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { Loader2, Check, X, UserMinus } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'

interface FollowRequest {
  user_id: string
  target_user_id: string
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

  const fetchRequests = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true)
      
      const pendingRequests = await getPendingRequests(user.id)
      
      // Fetch profile data for each requester
      const requestsWithProfiles = await Promise.all(
        pendingRequests.map(async (req) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .eq('id', req.user_id)
            .single()
          
          return {
            user_id: req.user_id,
            target_user_id: req.target_user_id,
            created_at: req.created_at,
            profiles: profile || {
              id: req.user_id,
              username: 'Unknown',
              display_name: undefined,
              avatar_url: undefined
            }
          }
        })
      )
      
      setIncomingRequests(requestsWithProfiles)
      setOutgoingRequests([])
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user) {
      fetchRequests()
    }
  }, [user, fetchRequests])

  async function handleRequest(requestId: string, action: 'accept' | 'decline' | 'cancel') {
    if (!user?.id) return;
    
    try {
      setProcessingIds(prev => new Set(prev).add(requestId))
      
      let success = false;
      if (action === 'accept') {
        success = await acceptRequest(user.id, requestId)
      } else if (action === 'decline') {
        success = await declineRequest(user.id, requestId)
      }
      
      if (success) {
        // Remove from appropriate list
        if (action === 'accept' || action === 'decline') {
          setIncomingRequests(prev => prev.filter(req => req.user_id !== requestId))
        } else {
          setOutgoingRequests(prev => prev.filter(req => req.user_id !== requestId))
        }
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
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="ml-0 md:ml-60 pb-20 md:pb-0">
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </main>
        <MobileNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-0 md:ml-60 pb-20 md:pb-0">
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
                      key={request.user_id}
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
                          onClick={() => handleRequest(request.user_id, 'accept')}
                          disabled={processingIds.has(request.user_id)}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRequest(request.user_id, 'decline')}
                          disabled={processingIds.has(request.user_id)}
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
                      key={request.user_id}
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
                        onClick={() => handleRequest(request.user_id, 'cancel')}
                        disabled={processingIds.has(request.user_id)}
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
      </main>

      <MobileNav />
    </div>
  )
}