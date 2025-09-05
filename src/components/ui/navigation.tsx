import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, Home, Search, Bell, Settings, Menu, X } from "lucide-react";

interface NavigationProps {
  onAuthClick?: () => void;
}

export function Navigation({ onAuthClick }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navigationItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Search, label: "Discover", path: "/discover" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="glass-effect border-b border-border/50 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-8 h-8 rounded-full overflow-hidden group-hover:pine-glow transition-smooth">
            <img
                src="/lovable-uploads/1dcbdae2-1d4b-4db9-9b61-ff2f7de1ff1d.png"
                alt="Under Pines Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-bold text-xl text-foreground group-hover:text-primary transition-smooth">
              Under Pines
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-smooth ${
                  isActive(item.path)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* User Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="sm" onClick={onAuthClick}>
              Sign In
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border/50 mt-4 pt-4 pb-4">
            <div className="flex flex-col space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-smooth ${
                    isActive(item.path)
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
              <div className="flex flex-col space-y-2 pt-4 border-t border-border/50">
                <Button variant="ghost" className="justify-start">
                  <Settings className="w-5 h-5 mr-3" />
                  Settings
                </Button>
                <Button variant="outline" className="justify-center" onClick={onAuthClick}>
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}