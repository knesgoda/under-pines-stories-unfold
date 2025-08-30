import { useState } from 'react'
import { Outlet, useParams, Link } from 'react-router-dom'
import { MessageCircle, UserPlus } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ThreadsList from '@/components/dm/ThreadsList'

export default function Messages() {
  const { conversationId } = useParams()
  const [activeTab, setActiveTab] = useState('inbox')

  if (conversationId) {
    // Show conversation view
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="ml-0 md:ml-60 pb-20 md:pb-0">
          <div className="h-screen flex flex-col">
            <div className="border-b p-4">
              <Link to="/messages" className="text-sm text-muted-foreground hover:text-foreground">
                ← Back to messages
              </Link>
            </div>
            <Outlet />
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
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Messages</h1>
            </div>
            
            <Link to="/search">
              <Button variant="outline" size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                New message
              </Button>
            </Link>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="inbox">Inbox</TabsTrigger>
              <TabsTrigger value="requests">Requests</TabsTrigger>
            </TabsList>
            
            <TabsContent value="inbox" className="mt-4">
              <ThreadsList type="inbox" />
            </TabsContent>
            
            <TabsContent value="requests" className="mt-4">
              <ThreadsList type="requests" />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <MobileNav />
    </div>
  )
}