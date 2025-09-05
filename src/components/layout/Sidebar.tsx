import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Home,
  Search,
  Users,
  MessageCircle,
  Bookmark,
  Settings,
  LogOut
} from 'lucide-react'
import { BellMenu } from '@/components/notifications/BellMenu'

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Requests', href: '/requests', icon: Users },
  { name: 'Discovery', href: '/discovery', icon: Search },
  { name: 'Messages', href: '/messages', icon: MessageCircle },
  { name: 'Saved', href: '/saved', icon: Bookmark },
]

export function Sidebar() {
  const location = useLocation()
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="fixed left-0 top-0 h-full w-60 bg-secondary border-r border-border slide-in-left hidden md:block">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/lovable-uploads/1dcbdae2-1d4b-4db9-9b61-ff2f7de1ff1d.png"
              alt="Under Pines"
              className="w-10 h-10 rounded-full transition-transform group-hover:scale-105"
            />
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold text-secondary-foreground">Under Pines</span>
              <Badge variant="secondary" className="bg-primary text-primary-foreground text-xs px-2 py-0.5">
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
                      'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all',
                      'hover:bg-muted/20 hover:text-accent interactive-glow',
                      isActive
                        ? 'bg-primary/20 text-accent border-l-2 border-primary'
                        : 'text-secondary-foreground/80',
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              )
            })}
            <li>
              <BellMenu />
            </li>
          </ul>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-border">
          <Link
            to={`/${user.username}`}
            className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/20 transition-all interactive-glow"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {(user.display_name || user.username)[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-secondary-foreground truncate">
                {user.display_name || user.username}
              </p>
              <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
            </div>
          </Link>

          <Link
            to="/settings/profile"
            className="flex items-center gap-3 p-3 mt-2 rounded-md hover:bg-muted/20 transition-all interactive-glow text-secondary-foreground/80"
          >
            <Settings className="h-4 w-4" />
            <span className="text-sm">Settings</span>
          </Link>

          <Link
            to="/logout"
            className="flex items-center gap-3 p-3 mt-1 rounded-md hover:bg-destructive/20 hover:text-destructive transition-all interactive-glow text-secondary-foreground/80"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm">Sign Out</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
