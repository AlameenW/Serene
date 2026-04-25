import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const mockDeadlines = [
  { id: 1,  course: 'CMPS 479', title: 'Pumping Lemma Assignment', date: '2026-04-30', weight: '10%', type: 'assignment' },
  { id: 2,  course: 'MATH 312', title: 'Midterm Exam',             date: '2026-04-29', weight: '25%', type: 'exam'       },
  { id: 3,  course: 'CMPS 479', title: 'PDA and CFG Assignment',   date: '2026-05-03', weight: '15%', type: 'assignment' },
  { id: 4,  course: 'CMPS 451', title: 'Final Project',            date: '2026-05-12', weight: '40%', type: 'project'    },
  { id: 5,  course: 'MATH 312', title: 'Problem Set 8',            date: '2026-05-02', weight: '5%',  type: 'assignment' },
  { id: 6,  course: 'HIST 154', title: 'History HW10',             date: '2026-04-28', weight: '5%',  type: 'assignment' },
  { id: 7,  course: 'HIST 154', title: 'Midterm Exam',             date: '2026-04-30', weight: '20%', type: 'exam'       },
  { id: 8,  course: 'CMPS 479', title: 'DFA and NFA',              date: '2026-04-26', weight: '15%', type: 'assignment' },
  { id: 9,  course: 'CMPS 285', title: 'Final Project',            date: '2026-05-10', weight: '40%', type: 'project'    },
  { id: 10, course: 'MATH 312', title: 'Problem Set 10',           date: '2026-05-08', weight: '10%', type: 'assignment' },
  { id: 11, course: 'HIST 154', title: 'Final Exam',               date: '2026-05-16', weight: '30%', type: 'exam'       },
  { id: 12, course: 'CMPS 451', title: 'ML Pipeline Submission',   date: '2026-04-27', weight: '30%', type: 'project'    },
  { id: 13, course: 'MATH 312', title: 'Final Exam',               date: '2026-05-14', weight: '35%', type: 'exam'       },
  { id: 14, course: 'CMPS 285', title: 'Final Prototype',          date: '2026-04-27', weight: '20%', type: 'project'    },
  { id: 15, course: 'CMPS 479', title: 'Final Exam',               date: '2026-05-15', weight: '35%', type: 'exam'       },
]

function parseLocal(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const today = new Date()
today.setHours(0, 0, 0, 0)

const upcomingDeadlines = mockDeadlines.filter(d => parseLocal(d.date) >= today)
const uniqueCourses     = [...new Set(upcomingDeadlines.map(d => d.course))]

// Reuse same stress scoring from Dashboard for consistency
const PROX = [1.0, 0.7, 0.4, 0.2, 0.1, 0.05, 0.02]
const MAX_PRESSURE = 2.0

function proximityFactor(n) {
  if (n < 0) return 0
  return n < PROX.length ? PROX[n] : 0.01
}

function weightFactor(d) {
  const pct = parseInt(d.weight)
  if (!isNaN(pct)) {
    if (pct >= 30) return 1.0
    if (pct >= 20) return 0.8
    if (pct >= 10) return 0.5
    return 0.2
  }
  return { exam: 0.9, project: 0.7, quiz: 0.4, assignment: 0.2 }[d.type] ?? 0.3
}

const pressure = upcomingDeadlines.reduce((sum, d) => {
  const days = Math.round((parseLocal(d.date) - today) / 86400000)
  return sum + proximityFactor(days) * weightFactor(d)
}, 0)
const clusterCount = upcomingDeadlines.filter(d =>
  Math.round((parseLocal(d.date) - today) / 86400000) <= 2
).length
const clusterMult  = 1 + 0.15 * Math.max(0, clusterCount - 1)
const stressScore  = Math.min((pressure * clusterMult) / MAX_PRESSURE, 1) * 100

function stressLabel(score) {
  if (score >= 70) return { label: 'High',     cls: 'text-red-500'    }
  if (score >= 40) return { label: 'Moderate', cls: 'text-yellow-600' }
  return               { label: 'Low',         cls: 'text-green-600'  }
}

const stress = stressLabel(stressScore)

export default function Profile() {
  const { user: authUser } = useAuth()
  const [info, setInfo]   = useState({ name: authUser?.displayName || '', email: authUser?.email || '', university: '', major: '', year: '' })
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState({ ...info })

  function handleSave() {
    setInfo({ ...draft })
    setEditing(false)
  }

  function handleCancel() {
    setDraft({ ...info })
    setEditing(false)
  }

  const fields = [
    { key: 'name',       label: 'Name',       readonly: false },
    { key: 'email',      label: 'Email',      readonly: true  },
    { key: 'university', label: 'University', readonly: false },
    { key: 'major',      label: 'Major',      readonly: false },
    { key: 'year',       label: 'Year',       readonly: false },
  ]

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Navbar */}
      <nav className="bg-white border-b border-[#F0F0F5] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#5B5BD6] flex items-center justify-center">
            <span className="text-white text-xs font-extrabold tracking-tight">S</span>
          </div>
          <span className="text-[#0F0F0F] font-bold text-lg tracking-tight">Serene</span>
        </div>

        <div className="flex items-center gap-1">
          <Link to="/dashboard" className="px-4 py-2 text-sm font-semibold rounded-full text-[#6B6B80] hover:text-[#0F0F0F] hover:bg-[#F7F7FA] transition-colors">
            Dashboard
          </Link>
          <Link to="/forecast" className="px-4 py-2 text-sm font-semibold rounded-full text-[#6B6B80] hover:text-[#0F0F0F] hover:bg-[#F7F7FA] transition-colors">
            Courses
          </Link>
          <Link to="/support" className="px-4 py-2 text-sm font-semibold rounded-full text-[#6B6B80] hover:text-[#0F0F0F] hover:bg-[#F7F7FA] transition-colors">
            Support Hub
          </Link>
        </div>

        <div className="w-8 h-8 rounded-full bg-[#EDEDFF] flex items-center justify-center">
          <span className="text-[#5B5BD6] text-xs font-extrabold">{(authUser?.displayName || authUser?.email || 'U')[0].toUpperCase()}</span>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-lg mx-auto px-6 py-10">
        {/* Back link */}
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-[#9999AA] hover:text-[#0F0F0F] transition-colors mb-8">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          back to dashboard
        </Link>

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
                onClick={() => setEditing(true)}
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
            {fields.map(({ key, label, readonly }) => (
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
              <p className="text-3xl font-extrabold text-[#5B5BD6]">{upcomingDeadlines.length}</p>
              <p className="text-xs text-[#9999AA] font-medium mt-1">Deadlines</p>
            </div>
            <div className="text-center border-x border-[#F2F2F7]">
              <p className="text-3xl font-extrabold text-[#5B5BD6]">{uniqueCourses.length}</p>
              <p className="text-xs text-[#9999AA] font-medium mt-1">Courses</p>
            </div>
            <div className="text-center">
              <p className={`text-3xl font-extrabold ${stress.cls}`}>{stress.label}</p>
              <p className="text-xs text-[#9999AA] font-medium mt-1">Stress Level</p>
            </div>
          </div>
        </div>

        {/* Sign out */}
        <Link
          to="/"
          className="block w-full text-center py-3 rounded-xl border border-red-200 text-red-500 text-sm font-bold hover:bg-red-50 transition-colors"
        >
          Sign out
        </Link>
      </main>
    </div>
  )
}
