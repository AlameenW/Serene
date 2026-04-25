import { Link, useLocation } from 'react-router-dom'

const links = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Forecast', to: '/forecast' },
  { label: 'Support', to: '/support' },
]

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-white border-b border-[#EBEBF0]">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-[#5B5BD6] flex items-center justify-center">
          <span className="text-white text-xs font-extrabold tracking-tight">S</span>
        </div>
        <span className="text-[#0F0F0F] font-bold text-lg tracking-tight">Serene</span>
      </div>

      <div className="flex items-center gap-1">
        {links.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              pathname === link.to
                ? 'bg-[#EDEDFF] text-[#5B5BD6]'
                : 'text-[#6B6B80] hover:text-[#0F0F0F] hover:bg-[#F7F7FA]'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="w-8 h-8 rounded-full bg-[#EDEDFF] flex items-center justify-center">
        <span className="text-xs font-bold text-[#5B5BD6]">A</span>
      </div>
    </nav>
  )
}
