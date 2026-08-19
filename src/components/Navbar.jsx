import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const links = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Courses', to: '/courses' },
  { label: 'Support Hub', to: '/support' },
]

const linkCls = (active) =>
  `px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
    active ? 'bg-[#5B5BD6] text-white' : 'text-[#6B6B80] hover:text-[#0F0F0F] hover:bg-[#F7F7FA]'
  }`

export default function Navbar({ variant }) {
  const compact = variant === 'compact'
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const displayName = user?.displayName || user?.email || 'User'
  const [open, setOpen] = useState(false)

  async function handleSignOut() {
    setOpen(false)
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <>
      <nav className="bg-white border-b border-[#F0F0F5] px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#5B5BD6] flex items-center justify-center">
            <span className="text-white text-xs font-extrabold tracking-tight">S</span>
          </div>
          <span className="text-[#0F0F0F] font-bold text-lg tracking-tight">Serene</span>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(link => (
            <Link key={link.to} to={link.to} className={linkCls(pathname === link.to)}>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop user cluster */}
        <div className="hidden md:flex items-center gap-3">
          {compact ? (
            <div className="w-8 h-8 rounded-full bg-[#EDEDFF] flex items-center justify-center">
              <span className="text-[#5B5BD6] text-xs font-extrabold">{displayName[0].toUpperCase()}</span>
            </div>
          ) : (
            <>
              <Link to="/profile" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-[#EDEDFF] flex items-center justify-center">
                  <span className="text-[#5B5BD6] text-xs font-extrabold">{displayName[0].toUpperCase()}</span>
                </div>
                <span className="text-sm font-semibold text-[#0F0F0F]">{displayName}</span>
              </Link>
              <button onClick={handleSignOut} className="text-xs font-semibold text-[#9999AA] hover:text-[#0F0F0F] transition-colors">
                Sign out
              </button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(o => !o)}
          className="md:hidden p-2 -mr-2 text-[#0F0F0F]"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-b border-[#F0F0F5] bg-white px-4 py-3 flex flex-col gap-1">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={`px-4 py-3 text-sm font-semibold rounded-xl transition-colors ${
                pathname === link.to ? 'bg-[#5B5BD6] text-white' : 'text-[#6B6B80] hover:text-[#0F0F0F] hover:bg-[#F7F7FA]'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {!compact && (
            <div className="border-t border-[#F0F0F5] mt-2 pt-3 flex items-center justify-between">
              <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#EDEDFF] flex items-center justify-center">
                  <span className="text-[#5B5BD6] text-xs font-extrabold">{displayName[0].toUpperCase()}</span>
                </div>
                <span className="text-sm font-semibold text-[#0F0F0F]">{displayName}</span>
              </Link>
              <button onClick={handleSignOut} className="text-xs font-semibold text-[#9999AA] hover:text-[#0F0F0F] transition-colors">
                Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
