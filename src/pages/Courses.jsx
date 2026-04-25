import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useAppState } from '../lib/AppContext'
import { mockCourses } from '../data/mockCourses'

const BLANK_FORM = { course: mockCourses[0]?.id ?? '', title: '', date: '', weight: '', type: 'assignment' }

const PROX = [1.0, 0.7, 0.4, 0.2, 0.1, 0.05, 0.02]
const MAX_PRESSURE = 2.0

function parseLocal(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

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

function courseStressScore(courseId, today, deadlines, completed) {
  const upcoming = deadlines.filter(d =>
    d.course === courseId && !completed.has(d.id) && parseLocal(d.date) >= today
  )
  const pressure = upcoming.reduce((sum, d) => {
    const days = Math.round((parseLocal(d.date) - today) / 86400000)
    return sum + proximityFactor(days) * weightFactor(d)
  }, 0)
  const clusterCount = upcoming.filter(d => Math.round((parseLocal(d.date) - today) / 86400000) <= 2).length
  const clusterMult  = 1 + 0.15 * Math.max(0, clusterCount - 1)
  return Math.min((pressure * clusterMult) / MAX_PRESSURE, 1) * 100
}

function stressMeta(score) {
  if (score >= 70) return { label: 'High',     dot: 'bg-red-500',    text: 'text-red-500',    bar: 'bg-red-400'    }
  if (score >= 40) return { label: 'Moderate', dot: 'bg-yellow-500', text: 'text-yellow-600', bar: 'bg-yellow-400' }
  return               { label: 'Low',         dot: 'bg-green-500',  text: 'text-green-600',  bar: 'bg-green-400'  }
}

function typeCls(type) {
  if (type === 'exam')    return 'bg-orange-100 text-orange-600'
  if (type === 'project') return 'bg-green-100  text-green-700'
  return                         'bg-blue-100   text-blue-600'
}

function formatDue(dateStr) {
  return parseLocal(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function daysLabel(dateStr, today) {
  const diff = Math.round((parseLocal(dateStr) - today) / 86400000)
  if (diff <= 0) return 'Today'
  if (diff === 1) return 'Tmrw'
  return `${diff}d`
}

let nextId = 100

export default function Courses() {
  const { user } = useAuth()
  const { deadlines, addDeadline, updateDeadline, deleteDeadline, completed, toggleComplete } = useAppState()
  const displayName = user?.displayName || user?.email || 'User'

  const [selected, setSelected] = useState(null)
  const [domain,   setDomain]   = useState('')
  const [token,    setToken]    = useState('')
  const [modal,    setModal]    = useState(null)
  const [form,     setForm]     = useState(BLANK_FORM)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  function openAdd() {
    setForm(BLANK_FORM)
    setModal('add')
  }

  function openEdit(d) {
    setForm({ course: d.course, title: d.title, date: d.date, weight: d.weight, type: d.type })
    setModal(d)
  }

  function closeModal() { setModal(null) }

  function handleSave() {
    if (!form.title.trim() || !form.date) return
    const weight = form.weight.trim().replace('%', '') + '%'
    if (modal === 'add') {
      addDeadline({ id: nextId++, ...form, weight })
    } else {
      updateDeadline(modal.id, { ...form, weight })
    }
    closeModal()
  }

  const activeDeadlines = deadlines.filter(d => !completed.has(d.id))

  const visibleDeadlines = (selected
    ? activeDeadlines.filter(d => d.course === selected)
    : activeDeadlines
  )
    .filter(d => parseLocal(d.date) >= today)
    .sort((a, b) => parseLocal(a.date) - parseLocal(b.date))

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
          <Link to="/courses" className="px-4 py-2 text-sm font-semibold rounded-full bg-[#5B5BD6] text-white">
            Courses
          </Link>
          <Link to="/support" className="px-4 py-2 text-sm font-semibold rounded-full text-[#6B6B80] hover:text-[#0F0F0F] hover:bg-[#F7F7FA] transition-colors">
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
          <Link to="/" className="text-xs font-semibold text-[#9999AA] hover:text-[#0F0F0F] transition-colors">
            Sign out
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-8 py-10">
        <h1 className="text-3xl font-extrabold text-[#0F0F0F] tracking-tight mb-8">My Courses</h1>

        {/* Canvas LMS */}
        <div className="bg-white border border-[#EBEBF0] rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
                <span className="text-white font-extrabold text-base">C</span>
              </div>
              <div>
                <p className="text-sm font-extrabold text-[#0F0F0F]">Canvas LMS</p>
                <p className="text-[11px] text-[#9999AA]">Instructure Canvas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled
                className="px-4 py-2 bg-[#5B5BD6]/40 text-white text-sm font-bold rounded-xl cursor-not-allowed"
              >
                Connect Canvas
              </button>
              <span className="text-[11px] font-bold text-[#9999AA] uppercase tracking-widest">Coming Soon</span>
            </div>
          </div>

          <p className="text-sm text-[#6B6B80] mb-4">
            Automatically pull all upcoming assignments, quizzes, and exams from your enrolled courses. Deadlines sync in real-time.
          </p>
          <div className="space-y-2.5">
            <input
              type="text"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder="Canvas domain (e.g. selu.instructure.com)"
              className="w-full px-4 py-2.5 border border-[#EBEBF0] rounded-xl text-sm text-[#0F0F0F] placeholder:text-[#C8C8D0] outline-none focus:border-[#5B5BD6] transition-colors"
            />
            <input
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="Access Token (Settings > New Access Token)"
              className="w-full px-4 py-2.5 border border-[#EBEBF0] rounded-xl text-sm text-[#0F0F0F] placeholder:text-[#C8C8D0] outline-none focus:border-[#5B5BD6] transition-colors"
            />
          </div>
          <p className="text-[11px] text-[#9999AA] mt-2.5">
            Find your token under Account → Settings → Approved Integrations
          </p>
        </div>

        {/* Course cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {mockCourses.map((course) => {
            const score    = courseStressScore(course.id, today, deadlines, completed)
            const meta     = stressMeta(score)
            const upcoming = activeDeadlines.filter(d => d.course === course.id && parseLocal(d.date) >= today)
            const next     = [...upcoming].sort((a, b) => parseLocal(a.date) - parseLocal(b.date))[0]
            const isActive = selected === course.id

            return (
              <button
                key={course.id}
                onClick={() => setSelected(prev => prev === course.id ? null : course.id)}
                className={`text-left bg-white border rounded-2xl p-5 transition-all hover:shadow-md ${
                  isActive ? 'border-[#5B5BD6] shadow-md ring-1 ring-[#5B5BD6]/20' : 'border-[#EBEBF0]'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <p className="text-xs font-bold text-[#5B5BD6]">{course.id}</p>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                    <span className={`text-[11px] font-bold ${meta.text}`}>{meta.label}</span>
                  </div>
                </div>

                <p className="text-sm font-extrabold text-[#0F0F0F] leading-tight mb-1">{course.name}</p>
                <p className="text-[11px] text-[#9999AA] mb-3">{course.instructor} · {course.credits} cr</p>

                <div className="w-full bg-[#F4F4F8] rounded-full h-1 mb-3">
                  <div
                    className={`h-1 rounded-full transition-all ${meta.bar}`}
                    style={{ width: `${Math.round(score)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#9999AA] font-medium">{upcoming.length} upcoming</span>
                  {next && (
                    <span className="text-[11px] text-[#9999AA] font-medium">
                      Next: <span className="font-bold text-[#6B6B80]">{formatDue(next.date)}</span>
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Deadlines list */}
        <div className="bg-white border border-[#EBEBF0] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="text-[11px] font-semibold text-[#9999AA] uppercase tracking-widest">
              {selected ? `${selected} — Upcoming Deadlines` : 'All Upcoming Deadlines'}
            </p>
            <div className="flex items-center gap-3">
              {selected && (
                <button
                  onClick={() => setSelected(null)}
                  className="text-xs font-semibold text-[#9999AA] hover:text-[#0F0F0F] transition-colors"
                >
                  Show all
                </button>
              )}
              <button
                onClick={openAdd}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5B5BD6] text-white text-xs font-bold rounded-lg hover:bg-[#4A4AC4] transition-colors"
              >
                <span className="text-sm leading-none">+</span> Add Deadline
              </button>
            </div>
          </div>

          {visibleDeadlines.length === 0 ? (
            <p className="text-sm text-[#C8C8D0] text-center py-6">No upcoming deadlines</p>
          ) : (
            <div className="space-y-3">
              {visibleDeadlines.map((d) => {
                const pct      = parseInt(d.weight)
                const label    = daysLabel(d.date, today)
                const isUrgent = label === 'Today' || label === 'Tmrw'
                return (
                  <div key={d.id} className="flex items-center gap-4 group">
                    {/* Complete check */}
                    <div className="relative shrink-0 group/check">
                      <button
                        onClick={() => toggleComplete(d.id)}
                        className="w-5 h-5 rounded-full border-2 border-[#D0D0DC] hover:border-green-500 flex items-center justify-center transition-colors"
                      />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#0F0F0F] text-white text-[10px] font-semibold rounded-md whitespace-nowrap opacity-0 group-hover/check:opacity-100 transition-opacity pointer-events-none">
                        Mark as complete
                      </span>
                    </div>

                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md min-w-[72px] text-center ${typeCls(d.type)}`}>
                      {d.type}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm font-bold text-[#0F0F0F] truncate">{d.title}</span>
                        {!selected && (
                          <span className="text-[11px] text-[#9999AA] shrink-0">{d.course}</span>
                        )}
                      </div>
                      <div className="w-full bg-[#F4F4F8] rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-[#5B5BD6]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    <span className="text-[11px] font-semibold shrink-0 text-[#9999AA]">{d.weight}</span>
                    <span className={`text-sm font-semibold shrink-0 min-w-[44px] text-right ${isUrgent ? 'text-orange-500' : 'text-[#9999AA]'}`}>
                      {formatDue(d.date)}
                    </span>

                    {/* Edit / Delete — visible on hover */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => openEdit(d)}
                        title="Edit"
                        className="p-1.5 rounded-lg text-[#9999AA] hover:text-[#5B5BD6] hover:bg-[#EDEDFF] transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteDeadline(d.id)}
                        title="Delete"
                        className="p-1.5 rounded-lg text-[#9999AA] hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4h6v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Completed count */}
          {completed.size > 0 && (
            <p className="text-[11px] text-[#C8C8D0] mt-5 pt-4 border-t border-[#F2F2F7]">
              {completed.size} deadline{completed.size > 1 ? 's' : ''} marked complete · hidden from stress calculation
            </p>
          )}
        </div>
      </main>

      {/* Add / Edit Modal */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 px-4"
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-[#EBEBF0]">
            <p className="text-sm font-extrabold text-[#0F0F0F] mb-5">
              {modal === 'add' ? 'Add Deadline' : 'Edit Deadline'}
            </p>

            <div className="space-y-3">
              {/* Course */}
              <div>
                <label className="text-[11px] font-semibold text-[#9999AA] uppercase tracking-widest block mb-1.5">Course</label>
                <select
                  value={form.course}
                  onChange={e => setForm(f => ({ ...f, course: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-[#EBEBF0] rounded-xl text-sm text-[#0F0F0F] outline-none focus:border-[#5B5BD6] transition-colors bg-white"
                >
                  {mockCourses.map(c => (
                    <option key={c.id} value={c.id}>{c.id} — {c.name}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="text-[11px] font-semibold text-[#9999AA] uppercase tracking-widest block mb-1.5">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Problem Set 5"
                  className="w-full px-4 py-2.5 border border-[#EBEBF0] rounded-xl text-sm text-[#0F0F0F] placeholder:text-[#C8C8D0] outline-none focus:border-[#5B5BD6] transition-colors"
                />
              </div>

              {/* Type + Weight */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#9999AA] uppercase tracking-widest block mb-1.5">Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-[#EBEBF0] rounded-xl text-sm text-[#0F0F0F] outline-none focus:border-[#5B5BD6] transition-colors bg-white"
                  >
                    <option value="assignment">Assignment</option>
                    <option value="exam">Exam</option>
                    <option value="project">Project</option>
                    <option value="quiz">Quiz</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#9999AA] uppercase tracking-widest block mb-1.5">Weight</label>
                  <input
                    type="text"
                    value={form.weight}
                    onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                    placeholder="e.g. 20"
                    className="w-full px-4 py-2.5 border border-[#EBEBF0] rounded-xl text-sm text-[#0F0F0F] placeholder:text-[#C8C8D0] outline-none focus:border-[#5B5BD6] transition-colors"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="text-[11px] font-semibold text-[#9999AA] uppercase tracking-widest block mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-[#EBEBF0] rounded-xl text-sm text-[#0F0F0F] outline-none focus:border-[#5B5BD6] transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 py-2.5 rounded-xl border border-[#E2E2E9] text-sm font-bold text-[#6B6B80] hover:bg-[#F7F7FA] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.title.trim() || !form.date}
                className="flex-1 py-2.5 rounded-xl bg-[#5B5BD6] text-white text-sm font-bold hover:bg-[#4A4AC4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {modal === 'add' ? 'Add Deadline' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
