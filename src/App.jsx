import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import RequireAuth from './auth/RequireAuth'
import { AppProvider } from './lib/AppContext'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Courses from './pages/Courses'
import Support from './pages/Support'
import Profile from './pages/Profile'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route element={<RequireAuth />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/support" element={<Support />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Routes>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
