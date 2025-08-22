import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from '@/components/ui/toaster'
import Home from '@/pages/Home'
import PostDetail from '@/pages/PostDetail'
import { ProfilePage } from '@/components/profile/ProfilePage'
import { ProfileEditPage } from '@/components/profile/ProfileEditPage'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-background">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/settings/profile" element={<ProfileEditPage />} />
            <Route path="/:username" element={<ProfilePage />} />
          </Routes>
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App