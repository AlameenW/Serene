import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'
import { useAuth } from '../auth/AuthContext'
import { useAppState } from '../lib/AppContext'
import { buildForecast, stressMeta, typeCls, daysLabel, formatDue, formatWeight, getUpcoming, barColor } from '../lib/stress'

const dateLabel = new Date().toLocaleDateString('en-US', {
  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
})

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { courses, deadlines, loading, activeMood, setActiveMood } = useAppState()
  const displayName = user?.displayName || user?.email || 'User'
  const [showAlert, setShowAlert] = useState(true)

  const courseMap = useMemo(() => new Map(courses.map(c => [c.id, c])), [courses])
  const activeDeadlines = useMemo(() => deadlines.filter(d => !d.completed), [deadlines])
  const sorted = [...activeDeadlines].sort((a, b) => new Date(a.date) - new Date(b.date))
  const next7 = getUpcoming(deadlines, { days: 7 }).slice(0, 5)

  async function handleSignOut() {
    await signOut()
    navigate('/', { replace: true })
  }

  function dismissAlert() {
    setShowAlert(false)
  }

  function goToSupport() {
    dismissAlert()
    navigate('/support')
  }

  const forecast = useMemo(() => buildForecast(activeDeadlines, activeMood), [activeDeadlines, activeMood])
  const todayScore = forecast[0].score
  const stress = stressMeta(todayScore)

  const moods = [
    { label: 'Calm' },
    { label: 'Focused' },
    { label: 'Tired' },
    { label: 'Anxious' },
    { label: 'Overwhelmed' },
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
          <Link
            to="/dashboard"
            className="px-4 py-2 text-sm font-semibold rounded-full bg-[#5B5BD6] text-white"
          >
            Dashboard
          </Link>
          <Link
            to="/courses"
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
              <span className="text-[#5B5BD6] text-xs font-extrabold">{displayName[0].toUpperCase()}</span>
            </div>
            <span className="text-sm font-semibold text-[#0F0F0F]">{displayName}</span>
          </Link>
          <button onClick={handleSignOut} className="text-xs font-semibold text-[#9999AA] hover:text-[#0F0F0F] transition-colors">
            Sign out
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-8 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-[#EBEBF0] border-t-[#5B5BD6] animate-spin" />
          </div>
        ) : (
          <>
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
                {next7.length === 0 ? (
                  <p className="text-sm text-[#C8C8D0] text-center py-6">Nothing due this week</p>
                ) : (
                  <div className="space-y-4">
                    {next7.map((d) => (
                      <div key={d.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-[#0F0F0F]">{d.title}</p>
                          <p className="text-[11px] text-[#9999AA] font-medium">{courseMap.get(d.courseId)?.code ?? 'Unknown course'}</p>
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
                )}
              </div>
            </div>

            {/* All Deadlines */}
            <div className="bg-white border border-[#EBEBF0] rounded-2xl p-6">
              <p className="text-[11px] font-semibold text-[#9999AA] uppercase tracking-widest mb-5">All Deadlines</p>
              {sorted.length === 0 ? (
                <p className="text-sm text-[#C8C8D0] text-center py-6">No deadlines yet — add one from the Courses page</p>
              ) : (
                <div className="space-y-4">
                  {sorted.map((d) => {
                    const isUrgent = daysLabel(d.date) === 'Today' || daysLabel(d.date) === 'Tmrw'
                    return (
                      <div key={d.id} className="flex items-center gap-4">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md min-w-[72px] text-center ${typeCls(d.type)}`}>
                          {d.type}
                        </span>
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <span className="text-sm font-bold text-[#0F0F0F] truncate">{d.title}</span>
                          <span className="text-[11px] text-[#9999AA] shrink-0">{courseMap.get(d.courseId)?.code ?? 'Unknown course'}</span>
                        </div>
                        <span className="text-[11px] font-semibold shrink-0 text-[#9999AA]">{formatWeight(d.weight) ?? '—'}</span>
                        <span className={`text-sm font-semibold shrink-0 min-w-[44px] text-right ${
                          isUrgent ? 'text-orange-500' : 'text-[#9999AA]'
                        }`}>
                          {formatDue(d.date)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Stress alert — high or moderate */}
      {!loading && activeMood && todayScore >= 40 && showAlert && (() => {
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
