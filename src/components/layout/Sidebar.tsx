import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  Home, 
  Search, 
  Users, 
  Bell, 
  MessageCircle, 
  Bookmark, 
  User,
  Settings 
} from 'lucide-react'

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Discovery', href: '/discovery', icon: Search },
  { name: 'Friends', href: '/friends', icon: Users },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Messages', href: '/messages', icon: MessageCircle },
  { name: 'Saved', href: '/saved', icon: Bookmark },
]

export function Sidebar() {
  const location = useLocation()
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="fixed left-0 top-0 h-full w-60 bg-background-panel border-r border-ink slide-in-left">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-4 border-b border-ink">
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src="/lovable-uploads/d686f771-cade-4bce-8c91-d54aa84ae0f5.png" 
              alt="Under Pines" 
              className="w-10 h-10 rounded-full transition-transform group-hover:scale-105"
            />
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold text-text-light">Under Pines</span>
              <Badge variant="secondary" className="bg-accent-warm text-black text-xs px-2 py-0.5">
                BETA
              </Badge>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all",
                      "hover:bg-ink/20 hover:text-accent-glow interactive-glow",
                      isActive
                        ? "bg-accent-warm/20 text-accent-glow border-l-2 border-accent-warm"
                        : "text-text-light/80"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-ink">
          <Link
            to={`/${user.username}`}
            className="flex items-center gap-3 p-3 rounded-md hover:bg-ink/20 transition-all interactive-glow"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback className="bg-accent-warm text-black">
                {(user.display_name || user.username)[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-light truncate">
                {user.display_name || user.username}
              </p>
              <p className="text-xs text-text-muted truncate">@{user.username}</p>
            </div>
          </Link>
          
          <Link
            to="/settings/profile"
            className="flex items-center gap-3 p-3 mt-2 rounded-md hover:bg-ink/20 transition-all interactive-glow text-text-light/80"
          >
            <Settings className="h-4 w-4" />
            <span className="text-sm">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  )
}