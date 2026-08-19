import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useAppState } from '../lib/AppContext'
import { buildForecast, stressMeta, getUpcoming } from '../lib/stress'
import Navbar from '../components/Navbar'

const FIELDS = [
  { key: 'name', label: 'Name', readonly: false },
  { key: 'email', label: 'Email', readonly: true },
  { key: 'university', label: 'University', readonly: false },
  { key: 'major', label: 'Major', readonly: false },
  { key: 'year', label: 'Year', readonly: false },
]

export default function Profile() {
  const navigate = useNavigate()
  const { user: authUser, signOut } = useAuth()
  const { deadlines, courses, profile, updateProfile, activeMood, loading } = useAppState()

  const [name, setName] = useState('')          // local-only display-name override, not persisted
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(null)

  const info = {
    name: name || authUser?.displayName || '',
    email: authUser?.email || '',
    university: profile.university,
    major: profile.major,
    year: profile.year,
  }

  async function handleSignOut() {
    await signOut()
    navigate('/', { replace: true })
  }

  function startEditing() {
    setDraft({ ...info })
    setEditing(true)
  }

  function handleSave() {
    setName(draft.name)
    updateProfile({ university: draft.university, major: draft.major, year: draft.year })
    setEditing(false)
  }

  function handleCancel() {
    setDraft(null)
    setEditing(false)
  }

  const activeDeadlines = deadlines.filter(d => !d.completed)
  const upcomingCount = getUpcoming(deadlines).length
  const todayScore = buildForecast(activeDeadlines, activeMood)[0].score
  const stress = stressMeta(todayScore)

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar variant="compact" />

      {/* Main */}
      <main className="max-w-lg mx-auto px-4 md:px-6 py-10">
        {/* Back link */}
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-[#9999AA] hover:text-[#0F0F0F] transition-colors mb-8">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          back to dashboard
        </Link>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-[#EBEBF0] border-t-[#5B5BD6] animate-spin" />
          </div>
        ) : (
          <>
            {/* Avatar + name */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 rounded-full bg-[#5B5BD6] flex items-center justify-center mb-3 shadow-lg">
                <span className="text-white text-3xl font-extrabold">{info.name[0]?.toUpperCase()}</span>
              </div>
              <h1 className="text-xl font-extrabold text-[#0F0F0F] tracking-tight">{info.name || 'Student'}</h1>
              <p className="text-sm text-[#9999AA] mt-0.5">{info.university || 'University'}</p>
            </div>

            {/* Personal Info */}
            <div className="bg-white border border-[#EBEBF0] rounded-2xl p-6 mb-5">
              <div className="flex items-center justify-between mb-5">
                <p className="text-[11px] font-semibold text-[#9999AA] uppercase tracking-widest">Personal Info</p>
                {!editing ? (
                  <button
                    onClick={startEditing}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[#5B5BD6] text-[#5B5BD6] hover:bg-[#5B5BD6] hover:text-white transition-colors"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[#E2E2E9] text-[#6B6B80] hover:bg-[#F7F7FA] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#5B5BD6] text-white hover:bg-[#4A4AC4] transition-colors"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>

              <div className="divide-y divide-[#F2F2F7]">
                {FIELDS.map(({ key, label, readonly }) => (
                  <div key={key} className="flex items-center justify-between py-3.5">
                    <span className="text-sm text-[#9999AA] font-medium w-28 shrink-0">{label}</span>
                    {editing && !readonly ? (
                      <input
                        type={key === 'year' ? 'number' : 'text'}
                        value={draft[key]}
                        onChange={e => setDraft(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder={`Enter ${label.toLowerCase()}`}
                        className="flex-1 text-sm font-semibold text-[#0F0F0F] text-right bg-transparent border-b border-[#5B5BD6] outline-none pb-0.5 placeholder:text-[#C8C8D0] placeholder:font-normal"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-[#0F0F0F]">
                        {info[key] || <span className="text-[#C8C8D0]">—</span>}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Summary */}
            <div className="bg-white border border-[#EBEBF0] rounded-2xl p-6 mb-8">
              <p className="text-[11px] font-semibold text-[#9999AA] uppercase tracking-widest mb-5">Activity Summary</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-extrabold text-[#5B5BD6]">{upcomingCount}</p>
                  <p className="text-xs text-[#9999AA] font-medium mt-1">Deadlines</p>
                </div>
                <div className="text-center border-x border-[#F2F2F7]">
                  <p className="text-3xl font-extrabold text-[#5B5BD6]">{courses.length}</p>
                  <p className="text-xs text-[#9999AA] font-medium mt-1">Courses</p>
                </div>
                <div className="text-center">
                  <p className={`text-3xl font-extrabold ${stress.text}`}>{stress.label}</p>
                  <p className="text-xs text-[#9999AA] font-medium mt-1">Stress Level</p>
                </div>
              </div>
            </div>

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              className="block w-full text-center py-3 rounded-xl border border-red-200 text-red-500 text-sm font-bold hover:bg-red-50 transition-colors"
            >
              Sign out
            </button>
          </>
        )}
      </main>
    </div>
  )
}
