import { useAuth } from '@/contexts/AuthContext'
import { AuthModal } from '@/components/auth/AuthModal'
import { FeedView } from '@/components/feed/FeedView'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { useState } from 'react'

export default function Home() {
  const { user, isLoading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="text-center max-w-md w-full">
            <div className="mb-8">
              <img 
                src="/lovable-uploads/d686f771-cade-4bce-8c91-d54aa84ae0f5.png" 
                alt="Under Pines" 
                className="w-24 h-24 mx-auto mb-6 rounded-full shadow-glow"
              />
              <h1 className="text-4xl md:text-6xl font-semibold mb-4 text-text-light">
                Under Pines
              </h1>
              <p className="text-xl text-text-light/80 mb-8">
                A cozy social community for outdoor enthusiasts
              </p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-accent-warm hover:bg-accent-warm/90 text-bg-dark px-8 py-4 rounded-lg text-lg font-medium transition-all shadow-glow hover:shadow-soft interactive-glow"
              >
                Join the Community
              </button>
            </div>
          </div>
        </div>
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-0 md:ml-60 pb-20 md:pb-0">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Beta Banner */}
          <div className="bg-accent-warm/10 border border-accent-warm/20 rounded-lg p-4 mb-6 text-center fade-in">
            <div className="flex items-center justify-center gap-2 text-accent-warm">
              <span className="inline-flex items-center gap-2 text-sm font-medium">
                🧪 <span className="bg-accent-warm text-bg-dark px-2 py-1 rounded-md text-xs font-semibold">BETA</span>
                Welcome to the Under Pines community
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