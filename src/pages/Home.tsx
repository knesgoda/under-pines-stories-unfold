import { useAuth } from '@/contexts/AuthContext'
import { FeedView } from '@/components/feed/FeedView'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'

export default function Home() {
  const { user } = useAuth()

  // Note: RouteGuard now handles authentication protection
  // This component will only render for authenticated users

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-0 md:ml-60 pb-20 md:pb-0">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Beta Banner */}
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-6 text-center fade-in">
            <div className="flex items-center justify-center gap-2 text-accent-foreground">
              <span className="inline-flex items-center gap-2 text-sm font-medium">
                🧪 <span className="bg-accent text-accent-foreground px-2 py-1 rounded-md text-xs font-semibold">BETA</span>
                Welcome to Under Pines, {user?.display_name || user?.username}!
              </span>
            </div>
          </div>
          
          <FeedView />
        </div>
      </main>

      <MobileNav />
    </div>
  )
}