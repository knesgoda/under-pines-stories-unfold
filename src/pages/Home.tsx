'use client'

import { useAuth } from '@/contexts/AuthContext'
import { AuthModal } from '@/components/auth/AuthModal'
import { FeedView } from '@/components/feed/FeedView'
import { Header } from '@/components/layout/Header'
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
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
                Under Pines
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                A simple social feed for our beta community
              </p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg text-lg font-medium transition-colors"
              >
                Join Beta
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
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-accent/20 border border-accent rounded-lg p-3 mb-6 text-center">
            <span className="inline-flex items-center gap-2 text-sm font-medium">
              🧪 <span className="bg-accent text-accent-foreground px-2 py-1 rounded-md text-xs">BETA</span>
              You are in a private beta
            </span>
          </div>
          <FeedView />
        </div>
      </main>
    </div>
  )
}