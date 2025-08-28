import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from '@/components/ui/toaster'
import { RouteGuard } from '@/components/auth/RouteGuard'
import Home from '@/pages/Home'
import PostDetail from '@/pages/PostDetail'
import Profile from '@/pages/Profile'
import ProfileSettings from '@/pages/ProfileSettings'
import DataSettings from '@/pages/DataSettings'
import Discovery from '@/pages/Discovery'
import Signup from '@/pages/Signup'
import Login from '@/pages/Login'
import Logout from '@/pages/Logout'
import AuthUpgrade from '@/pages/AuthUpgrade'
import FollowRequests from '@/pages/FollowRequests'
import Search from '@/pages/Search'
import NotificationsPage from '@/pages/Notifications'
import Messages from '@/pages/Messages'
import MessageRequests from '@/pages/MessageRequests'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-background">
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/signup" 
              element={
                <RouteGuard requireAuth={false}>
                  <Signup />
                </RouteGuard>
              } 
            />
            <Route 
              path="/login" 
              element={
                <RouteGuard requireAuth={false}>
                  <Login />
                </RouteGuard>
              } 
            />
            <Route path="/logout" element={<Logout />} />
            
            {/* Protected Routes */}
            <Route 
              path="/" 
              element={
                <RouteGuard>
                  <Home />
                </RouteGuard>
              } 
            />
            <Route 
              path="/discovery" 
              element={
                <RouteGuard>
                  <Discovery />
                </RouteGuard>
              } 
            />
            <Route 
              path="/post/:id" 
              element={
                <RouteGuard>
                  <PostDetail />
                </RouteGuard>
              } 
            />
            <Route
              path="/settings/profile"
              element={
                <RouteGuard>
                  <ProfileSettings />
                </RouteGuard>
              }
            />
            <Route
              path="/settings/data"
              element={
                <RouteGuard>
                  <DataSettings />
                </RouteGuard>
              }
            />
            <Route
              path="/search"
              element={
                <RouteGuard>
                  <Search />
                </RouteGuard>
              }
            />
            <Route
              path="/notifications"
              element={
                <RouteGuard>
                  <NotificationsPage />
                </RouteGuard>
              }
            />
            <Route
              path="/messages"
              element={
                <RouteGuard>
                  <Messages />
                </RouteGuard>
              }
            />
            <Route
              path="/messages/requests"
              element={
                <RouteGuard>
                  <MessageRequests />
                </RouteGuard>
              }
            />
            <Route
              path="/requests"
              element={
                <RouteGuard>
                  <FollowRequests />
                </RouteGuard>
              } 
            />
            <Route 
              path="/auth/upgrade" 
              element={
                <RouteGuard>
                  <AuthUpgrade />
                </RouteGuard>
              } 
            />
            <Route 
              path="/:username" 
              element={
                <RouteGuard>
                  <Profile />
                </RouteGuard>
              } 
            />
          </Routes>
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
