import { useAuth } from '../auth/AuthContext'

export default function Dashboard() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <p className="text-[#6B6B80]">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-xl font-bold text-[#0F0F0F]">Dashboard</h1>
      {user ? (
        <p className="mt-3 text-[#6B6B80]">
          Signed in as{' '}
          <span className="font-semibold text-[#0F0F0F]">
            {user.displayName || user.email || 'Google user'}
          </span>
          {user.email ? ` (${user.email})` : ''}.
        </p>
      ) : (
        <p className="mt-3 text-[#6B6B80]">You are not signed in with Google yet.</p>
      )}
    </div>
  )
}
