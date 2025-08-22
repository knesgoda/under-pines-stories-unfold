import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  Home, 
  Search, 
  Plus, 
  MessageCircle, 
  User 
} from 'lucide-react'

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Discover', href: '/discovery', icon: Search },
  { name: 'Create', href: '/create', icon: Plus, isAction: true },
  { name: 'Inbox', href: '/messages', icon: MessageCircle },
  { name: 'Profile', href: '/profile', icon: User, isProfile: true },
]

export function MobileNav() {
  const location = useLocation()
  const { user } = useAuth()

  if (!user) return null

  const handleCreateClick = () => {
    // Focus on the post composer or open a modal
    const composer = document.querySelector('[data-composer]') as HTMLTextAreaElement
    if (composer) {
      composer.focus()
      composer.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background-panel border-t border-ink safe-bottom md:hidden">
      <nav className="flex items-center justify-around px-4 py-2">
        {navigation.map((item) => {
          const href = item.isProfile ? `/${user.username}` : item.href
          const isActive = item.isProfile 
            ? location.pathname === `/${user.username}`
            : location.pathname === item.href

          if (item.isAction) {
            return (
              <Button
                key={item.name}
                onClick={handleCreateClick}
                size="sm"
                className="bg-accent-warm hover:bg-accent-glow text-black p-3 rounded-full shadow-glow"
              >
                <item.icon className="h-5 w-5" />
                <span className="sr-only">{item.name}</span>
              </Button>
            )
          }

          return (
            <Link
              key={item.name}
              to={href}
              className={cn(
                "flex flex-col items-center gap-1 p-2 min-w-[44px] min-h-[44px] rounded-md transition-colors",
                isActive
                  ? "text-accent-glow"
                  : "text-text-light/60 hover:text-text-light"
              )}
            >
              {item.isProfile ? (
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="text-xs bg-accent-warm text-black">
                    {(user.display_name || user.username)[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <item.icon className="h-6 w-6" />
              )}
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}