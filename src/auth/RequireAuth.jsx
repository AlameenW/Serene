import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function RequireAuth() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="w-8 h-8 rounded-full border-2 border-[#EBEBF0] border-t-[#5B5BD6] animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/" replace />

  return <Outlet />
}
