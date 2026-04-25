import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'

const user = { name: 'Sofia' }

// ─── Stress scoring ──────────────────────────────────────────────────────────

// Proximity pressure: drops off sharply after day 2
const PROX = [1.0, 0.7, 0.4, 0.2, 0.1, 0.05, 0.02]
const MAX_PRESSURE = 2.0

function proximityFactor(daysUntil) {
  if (daysUntil < 0) return 0
  return daysUntil < PROX.length ? PROX[daysUntil] : 0.01
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

function computeDeadlineScore(dayOffset, deadlines) {
  const base = new Date()
  base.setHours(0, 0, 0, 0)
  const day = new Date(base)
  day.setDate(day.getDate() + dayOffset)

  const upcoming = deadlines.filter(d => parseLocal(d.date) >= day)

  const pressure = upcoming.reduce((sum, d) => {
    const daysUntil = Math.round((parseLocal(d.date) - day) / 86400000)
    return sum + proximityFactor(daysUntil) * weightFactor(d)
  }, 0)

  // Clustering: multiple deadlines in the same 3-day window add a multiplier
  const clusterCount = upcoming.filter(d =>
    Math.round((parseLocal(d.date) - day) / 86400000) <= 2
  ).length
  const clusterMult = 1 + 0.15 * Math.max(0, clusterCount - 1)

  return Math.min((pressure * clusterMult) / MAX_PRESSURE, 1) * 10 // 0–10
}

// Mood bumps only today's score; future days have no known mood
const MOOD_MOD = { Calm: 0, Focused: 0, Tired: 1, Anxious: 2, Overwhelmed: 3 }

function buildForecast(deadlines, activeMood) {
  return Array.from({ length: 7 }, (_, i) => {
    const ds = computeDeadlineScore(i, deadlines)
    const score = i === 0 && activeMood
      ? ds * 0.7 + (MOOD_MOD[activeMood] / 3) * 10 * 0.3
      : ds

    const d = new Date()
    d.setDate(d.getDate() + i)
    const day = d.toLocaleDateString('en-US', { weekday: 'short' })

    return { day, score: Math.round(score * 10) } // ×10 → 0–100 for chart
  })
}

const mockDeadlines = [
  { id: 1,  course: 'CMPS 479', title: 'Pumping Lemma Assignment', date: '2026-04-30', weight: '10%', type: 'assignment' },
  { id: 2,  course: 'MATH 312', title: 'Midterm Exam',             date: '2026-04-29', weight: '25%', type: 'exam' },
  { id: 3,  course: 'CMPS 479', title: 'PDA and CFG Assignment',   date: '2026-05-03', weight: '15%', type: 'assignment' },
  { id: 4,  course: 'CMPS 451', title: 'Final Project',            date: '2026-05-12', weight: '40%', type: 'project' },
  { id: 5,  course: 'MATH 312', title: 'Problem Set 8',            date: '2026-05-02', weight: '5%',  type: 'assignment' },
  { id: 6,  course: 'HIST 154', title: 'History HW10',             date: '2026-04-28', weight: '5%',  type: 'assignment' },
  { id: 7,  course: 'HIST 154', title: 'Midterm Exam',             date: '2026-04-30', weight: '20%', type: 'exam' },
  { id: 8,  course: 'CMPS 479', title: 'DFA and NFA',              date: '2026-04-26', weight: '15%', type: 'assignment' },
  { id: 9,  course: 'CMPS 285', title: 'Final Project',            date: '2026-05-10', weight: '40%', type: 'project' },
  { id: 10, course: 'MATH 312', title: 'Problem Set 10',           date: '2026-05-08', weight: '10%', type: 'assignment' },
  { id: 11, course: 'HIST 154', title: 'Final Exam',               date: '2026-05-16', weight: '30%', type: 'exam' },
  { id: 12, course: 'CMPS 451', title: 'ML Pipeline Submission',   date: '2026-04-27', weight: '30%', type: 'project' },
  { id: 13, course: 'MATH 312', title: 'Final Exam',               date: '2026-05-14', weight: '35%', type: 'exam' },
  { id: 14, course: 'CMPS 285', title: 'Final Prototype',          date: '2026-04-27', weight: '20%', type: 'project' },
  { id: 15, course: 'CMPS 479', title: 'Final Exam',               date: '2026-05-15', weight: '35%', type: 'exam' },
]

const sorted = [...mockDeadlines].sort((a, b) => new Date(a.date) - new Date(b.date))

const moods = [
  { label: 'Calm',},
  { label: 'Focused',},
  { label: 'Anxious' },
  { label: 'Overwhelmed'},
  { label: 'Tired',},
]

function barColor(score) {  // score 0–100; thresholds match 7/4 on 0–10 scale
  if (score >= 70) return '#ef4444'
  if (score >= 40) return '#eab308'
  return '#22c55e'
}

function stressMeta(score) {
  if (score >= 70) return { label: 'High',     dot: 'bg-red-500',    text: 'text-red-500'    }
  if (score >= 40) return { label: 'Moderate', dot: 'bg-yellow-500', text: 'text-yellow-600' }
  return               { label: 'Low',         dot: 'bg-green-500',  text: 'text-green-600'  }
}

function typeCls(type) {
  if (type === 'exam')       return 'bg-orange-100 text-orange-600'
  if (type === 'project')    return 'bg-green-100  text-green-700'
  return                            'bg-blue-100   text-blue-600'
}

// 'YYYY-MM-DD' strings are UTC midnight when passed to new Date(),
// which shifts the date back one day in US timezones. Always parse as local.
function parseLocal(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function daysLabel(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((parseLocal(dateStr) - today) / 86400000)
  if (diff <= 0) return 'Today'
  if (diff === 1) return 'Tmrw'
  return `${diff}d`
}

function formatDue(dateStr) {
  return parseLocal(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

let alertDismissed = false

const dateLabel = new Date().toLocaleDateString('en-US', {
  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
})

export default function Dashboard() {
  const navigate = useNavigate()
  const [activeMood, setActiveMood] = useState(null)
  const [showAlert, setShowAlert] = useState(!alertDismissed)

  function dismissAlert() {
    alertDismissed = true
    setShowAlert(false)
  }

  function goToSupport() {
    dismissAlert()
    navigate('/support')
  }

  const forecast   = useMemo(() => buildForecast(mockDeadlines, activeMood), [activeMood])
  const todayScore = forecast[0].score
  const stress     = stressMeta(todayScore)

  const today0 = new Date()
  today0.setHours(0, 0, 0, 0)
  const next7 = sorted.filter(d => {
    const diff = Math.round((parseLocal(d.date) - today0) / 86400000)
    return diff >= 0 && diff <= 7
  }).slice(0, 5)

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
          <Link
            to="/dashboard"
            className="px-4 py-2 text-sm font-semibold rounded-full bg-[#5B5BD6] text-white"
          >
            Dashboard
          </Link>
          <Link
            to="/forecast"
            className="px-4 py-2 text-sm font-semibold rounded-full text-[#6B6B80] hover:text-[#0F0F0F] hover:bg-[#F7F7FA] transition-colors"
          >
            Courses
          </Link>
          <Link
            to="/support"
            className="px-4 py-2 text-sm font-semibold rounded-full text-[#6B6B80] hover:text-[#0F0F0F] hover:bg-[#F7F7FA] transition-colors"
          >
            Support Hub
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/profile" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-[#EDEDFF] flex items-center justify-center">
              <span className="text-[#5B5BD6] text-xs font-extrabold">{user.name[0]}</span>
            </div>
            <span className="text-sm font-semibold text-[#0F0F0F]">{user.name}</span>
          </Link>
          <Link to="/" className="text-xs font-semibold text-[#9999AA] hover:text-[#0F0F0F] transition-colors">
            Sign out
          </Link>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-8 py-10">
        {/* Date + stress level */}
        <div className="flex items-start justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-[#0F0F0F] tracking-tight">{dateLabel}</h1>
          <div className="flex items-center gap-2 bg-white border border-[#EBEBF0] rounded-xl px-4 py-2.5 mt-1 shadow-sm">
            <span className="text-[11px] font-semibold text-[#9999AA] uppercase tracking-widest">Stress Level</span>
            {activeMood ? (
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${stress.dot}`} />
                <span className={`text-sm font-bold ${stress.text}`}>{stress.label}</span>
              </div>
            ) : (
              <span className="text-sm font-semibold text-[#C8C8D0]">check in first</span>
            )}
          </div>
        </div>

        {/* Daily check-in */}
        <div className="bg-white border border-[#EBEBF0] rounded-2xl p-6 mb-5">
          <p className="text-[11px] font-semibold text-[#9999AA] uppercase tracking-widest mb-1">Daily Check-in</p>
          <p className="text-sm font-bold text-[#0F0F0F] mb-4">How are you feeling right now?</p>
          <div className="flex items-center gap-2 flex-wrap">
            {moods.map((m) => (
              <button
                key={m.label}
                onClick={() => setActiveMood(prev => prev === m.label ? null : m.label)}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                  activeMood === m.label
                    ? 'bg-[#5B5BD6] text-white border-[#5B5BD6]'
                    : 'border-[#E2E2E9] text-[#6B6B80] hover:border-[#5B5BD6] hover:text-[#5B5BD6]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Forecast + Next 7 Days */}
        <div className="grid grid-cols-5 gap-5 mb-5">
          <div className="col-span-3 bg-white border border-[#EBEBF0] rounded-2xl p-6">
            <p className="text-[11px] font-semibold text-[#9999AA] uppercase tracking-widest mb-5">
              Stress Forecast / 7 Days
            </p>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={forecast} barCategoryGap="28%">
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#9999AA', fontWeight: 600 }}
                />
                <YAxis hide domain={[0, 100]} />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {forecast.map((entry) => (
                    <Cell key={entry.day} fill={barColor(entry.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#F2F2F7]">
              {[['#22c55e', 'Low'], ['#eab308', 'Moderate'], ['#ef4444', 'High']].map(([color, label]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[11px] text-[#9999AA] font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-2 bg-white border border-[#EBEBF0] rounded-2xl p-6">
            <p className="text-[11px] font-semibold text-[#9999AA] uppercase tracking-widest mb-5">Next 7 Days</p>
            <div className="space-y-4">
              {next7.map((d) => (
                <div key={d.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#0F0F0F]">{d.title}</p>
                    <p className="text-[11px] text-[#9999AA] font-medium">{d.course}</p>
                  </div>
                  <span className={`text-sm font-bold shrink-0 ml-3 ${
                    daysLabel(d.date) === 'Tmrw' || daysLabel(d.date) === 'Today'
                      ? 'text-red-500'
                      : 'text-[#9999AA]'
                  }`}>
                    {daysLabel(d.date)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* All Deadlines */}
        <div className="bg-white border border-[#EBEBF0] rounded-2xl p-6">
          <p className="text-[11px] font-semibold text-[#9999AA] uppercase tracking-widest mb-5">All Deadlines</p>
          <div className="space-y-4">
            {sorted.map((d) => {
              const pct = parseInt(d.weight)
              const isUrgent = daysLabel(d.date) === 'Today' || daysLabel(d.date) === 'Tmrw'
              return (
                <div key={d.id} className="flex items-center gap-4">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md min-w-[72px] text-center ${typeCls(d.type)}`}>
                    {d.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-bold text-[#0F0F0F] truncate">{d.title}</span>
                      <span className="text-[11px] text-[#9999AA] shrink-0">{d.course}</span>
                    </div>
                    <div className="w-full bg-[#F4F4F8] rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-[#5B5BD6]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold shrink-0 text-[#9999AA]">{d.weight}</span>
                  <span className={`text-sm font-semibold shrink-0 min-w-[44px] text-right ${
                    isUrgent ? 'text-orange-500' : 'text-[#9999AA]'
                  }`}>
                    {formatDue(d.date)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </main>

      {/* Stress alert — high or moderate */}
      {activeMood && todayScore >= 40 && showAlert && (() => {
        const high = todayScore >= 70
        return (
          <div className={`fixed bottom-6 right-6 w-72 bg-white rounded-2xl p-5 shadow-2xl border ${
            high ? 'border-red-300' : 'border-yellow-300'
          }`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${high ? 'bg-red-500' : 'bg-yellow-500'}`} />
                <span className={`text-xs font-extrabold uppercase tracking-widest ${high ? 'text-red-500' : 'text-yellow-600'}`}>
                  {high ? 'High Stress' : 'Heads Up'}
                </span>
              </div>
              <button
                onClick={dismissAlert}
                className="text-[#9999AA] hover:text-[#0F0F0F] transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>
            <p className={`text-sm leading-relaxed mb-4 ${high ? 'text-[#3D3D4D]' : 'text-[#6B6B80]'}`}>
              {high
                ? "Your plate looks really full right now. The Support Hub has resources and a space to talk things through."
                : "Things are picking up this week. A quick check-in might help you stay on track."}
            </p>
            <button
              onClick={goToSupport}
              className={`w-full py-2.5 rounded-xl text-white text-sm font-bold transition-colors ${
                high ? 'bg-[#EF4444] hover:bg-[#DC2626]' : 'bg-yellow-500 hover:bg-yellow-600'
              }`}
            >
              Go to Support Hub
            </button>
          </div>
        )
      })()}
    </div>
  )
}