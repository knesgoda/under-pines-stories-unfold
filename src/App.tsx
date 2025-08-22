import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from '@/components/ui/toaster'
import Home from '@/pages/Home'
import PostDetail from '@/pages/PostDetail'
import Profile from '@/pages/Profile'
import ProfileSettings from '@/pages/ProfileSettings'
import Discovery from '@/pages/Discovery'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-background">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/discovery" element={<Discovery />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/settings/profile" element={<ProfileSettings />} />
            <Route path="/:username" element={<Profile />} />
          </Routes>
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App