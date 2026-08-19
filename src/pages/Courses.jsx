import { useState } from 'react'
import { useAppState } from '../lib/AppContext'
import { parseLocal, courseStressScore, stressMeta, formatDue, daysLabel } from '../lib/stress'
import Navbar from '../components/Navbar'
import DeadlineRow from '../components/DeadlineRow'

const BLANK_COURSE_FORM = { code: '', name: '', instructor: '', credits: '' }

// Strips non-digits as the user types and clamps to 0–100, so the field can never hold anything else.
function sanitizeWeightInput(raw) {
  let digits = raw.replace(/\D/g, '')
  if (digits.length > 1) digits = digits.replace(/^0+/, '') || '0'
  if (digits !== '' && Number(digits) > 100) digits = '100'
  return digits
}

function isValidWeight(w) {
  const n = Number(w)
  return w !== '' && Number.isInteger(n) && n >= 0 && n <= 100
}

export default function Courses() {
  const {
    courses, addCourse, updateCourse, deleteCourse,
    deadlines, addDeadline, updateDeadline, deleteDeadline, toggleComplete,
    loading,
  } = useAppState()

  const [selected, setSelected] = useState(null)
  const [domain, setDomain] = useState('')
  const [token, setToken] = useState('')

  const [deadlineModal, setDeadlineModal] = useState(null)
  const [deadlineForm, setDeadlineForm] = useState({ courseId: '', title: '', date: '', weight: '', type: 'assignment' })

  const [courseModal, setCourseModal] = useState(null)
  const [courseForm, setCourseForm] = useState(BLANK_COURSE_FORM)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  function openAddDeadline() {
    setDeadlineForm({ courseId: courses[0]?.id ?? '', title: '', date: '', weight: '', type: 'assignment' })
    setDeadlineModal('add')
  }

  function openEditDeadline(d) {
    const parsedWeight = parseInt(d.weight, 10)
    setDeadlineForm({
      courseId: d.courseId,
      title: d.title,
      date: d.date,
      weight: Number.isNaN(parsedWeight) ? '' : String(parsedWeight),
      type: d.type,
    })
    setDeadlineModal(d)
  }

  function closeDeadlineModal() { setDeadlineModal(null) }

  function handleSaveDeadline() {
    if (!deadlineForm.title.trim() || !deadlineForm.date || !deadlineForm.courseId || !isValidWeight(deadlineForm.weight)) return
    const payload = { ...deadlineForm, weight: Number(deadlineForm.weight) }
    if (deadlineModal === 'add') {
      addDeadline(payload)
    } else {
      updateDeadline(deadlineModal.id, payload)
    }
    closeDeadlineModal()
  }

  function openAddCourse() {
    setCourseForm(BLANK_COURSE_FORM)
    setCourseModal('add')
  }

  function openEditCourse(c) {
    setCourseForm({ code: c.code ?? '', name: c.name ?? '', instructor: c.instructor ?? '', credits: c.credits ?? '' })
    setCourseModal(c)
  }

  function closeCourseModal() { setCourseModal(null) }

  function handleSaveCourse() {
    if (!courseForm.code.trim() || !courseForm.name.trim()) return
    const payload = {
      code: courseForm.code.trim(),
      name: courseForm.name.trim(),
      instructor: courseForm.instructor.trim(),
      credits: courseForm.credits === '' ? null : Number(courseForm.credits),
    }
    if (courseModal === 'add') {
      addCourse(payload)
    } else {
      updateCourse(courseModal.id, payload)
    }
    closeCourseModal()
  }

  function handleDeleteCourse(course) {
    const count = deadlines.filter(d => d.courseId === course.id).length
    const msg = count > 0
      ? `Delete ${course.code}? This will also delete its ${count} deadline${count === 1 ? '' : 's'}.`
      : `Delete ${course.code}?`
    if (!window.confirm(msg)) return
    deleteCourse(course.id)
    if (selected === course.id) setSelected(null)
  }

  const activeDeadlines = deadlines.filter(d => !d.completed)

  const courseScopedDeadlines = selected
    ? activeDeadlines.filter(d => d.courseId === selected)
    : activeDeadlines

  const visibleDeadlines = courseScopedDeadlines
    .filter(d => parseLocal(d.date) >= today)
    .sort((a, b) => parseLocal(a.date) - parseLocal(b.date))

  const pastDeadlines = courseScopedDeadlines
    .filter(d => parseLocal(d.date) < today)
    .sort((a, b) => parseLocal(b.date) - parseLocal(a.date))

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-10">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F0F0F] tracking-tight mb-8">My Courses</h1>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-[#EBEBF0] border-t-[#5B5BD6] animate-spin" />
          </div>
        ) : (
          <>
            {/* Canvas LMS */}
            <div className="bg-white border border-[#EBEBF0] rounded-2xl p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
                    <span className="text-white font-extrabold text-base">C</span>
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-[#0F0F0F]">Canvas LMS</p>
                    <p className="text-[11px] text-[#9999AA]">Instructure Canvas</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
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

            {/* Courses */}
            {courses.length === 0 ? (
              <div className="bg-white border border-[#EBEBF0] rounded-2xl p-10 mb-8 text-center">
                <p className="text-sm font-bold text-[#0F0F0F] mb-1">No courses yet</p>
                <p className="text-sm text-[#9999AA] mb-5">Add your first course to start tracking deadlines.</p>
                <button
                  onClick={openAddCourse}
                  className="px-4 py-2 bg-[#5B5BD6] text-white text-sm font-bold rounded-xl hover:bg-[#4A4AC4] transition-colors"
                >
                  + Add Course
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] font-semibold text-[#9999AA] uppercase tracking-widest">My Courses</p>
                  <button
                    onClick={openAddCourse}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5B5BD6] text-white text-xs font-bold rounded-lg hover:bg-[#4A4AC4] transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Add Course
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {courses.map((course) => {
                    const score = courseStressScore(course.id, today, deadlines)
                    const meta = stressMeta(score)
                    const upcoming = activeDeadlines.filter(d => d.courseId === course.id && parseLocal(d.date) >= today)
                    const next = [...upcoming].sort((a, b) => parseLocal(a.date) - parseLocal(b.date))[0]
                    const isActive = selected === course.id

                    return (
                      <div
                        key={course.id}
                        onClick={() => setSelected(prev => prev === course.id ? null : course.id)}
                        className={`group relative cursor-pointer text-left bg-white border rounded-2xl p-5 transition-all hover:shadow-md ${
                          isActive ? 'border-[#5B5BD6] shadow-md ring-1 ring-[#5B5BD6]/20' : 'border-[#EBEBF0]'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <p className="text-xs font-bold text-[#5B5BD6]">{course.code}</p>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                            <span className={`text-[11px] font-bold ${meta.text}`}>{meta.label}</span>
                          </div>
                        </div>

                        <p className="text-sm font-extrabold text-[#0F0F0F] leading-tight mb-1">{course.name}</p>
                        <p className="text-[11px] text-[#9999AA] mb-3">
                          {course.instructor || 'No instructor set'}{course.credits ? ` · ${course.credits} cr` : ''}
                        </p>

                        <div className="w-full bg-[#F4F4F8] rounded-full h-1 mb-3">
                          <div
                            className={`h-1 rounded-full transition-all ${meta.bar}`}
                            style={{ width: `${Math.round(score)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-[#9999AA] font-medium">{upcoming.length} upcoming</span>
                          <div className="flex items-center gap-2">
                            {next && (
                              <span className="text-[11px] text-[#9999AA] font-medium">
                                Next: <span className="font-bold text-[#6B6B80]">{formatDue(next.date)}</span>
                              </span>
                            )}
                            <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => { e.stopPropagation(); openEditCourse(course) }}
                                title="Edit"
                                className="min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center rounded-lg text-[#9999AA] hover:text-[#5B5BD6] hover:bg-[#EDEDFF] transition-colors"
                              >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course) }}
                                title="Delete"
                                className="min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center rounded-lg text-[#9999AA] hover:text-red-500 hover:bg-red-50 transition-colors"
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
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* Deadlines list */}
            <div className="bg-white border border-[#EBEBF0] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <p className="text-[11px] font-semibold text-[#9999AA] uppercase tracking-widest">
                  {selected ? `${courses.find(c => c.id === selected)?.code ?? ''} — Upcoming Deadlines` : 'All Upcoming Deadlines'}
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
                    onClick={openAddDeadline}
                    disabled={courses.length === 0}
                    title={courses.length === 0 ? 'Add a course first' : undefined}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5B5BD6] text-white text-xs font-bold rounded-lg hover:bg-[#4A4AC4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Add Deadline
                  </button>
                </div>
              </div>

              {visibleDeadlines.length === 0 ? (
                <p className="text-sm text-[#C8C8D0] text-center py-6">No upcoming deadlines</p>
              ) : (
                <div className="space-y-3">
                  {visibleDeadlines.map((d) => {
                    const label = daysLabel(d.date, today)
                    const isUrgent = label === 'Today' || label === 'Tmrw'
                    const course = courses.find(c => c.id === d.courseId)
                    return (
                      <DeadlineRow
                        key={d.id}
                        deadline={d}
                        courseLabel={!selected ? (course?.code ?? 'Unknown course') : null}
                        dueLabel={formatDue(d.date)}
                        dueDateColorClass={isUrgent ? 'text-orange-500' : 'text-[#9999AA]'}
                        dueDateMinWidth="min-w-[44px]"
                        onToggleComplete={toggleComplete}
                        onEdit={openEditDeadline}
                        onDelete={deleteDeadline}
                      />
                    )
                  })}
                </div>
              )}

              {/* Completed count */}
              {deadlines.some(d => d.completed) && (
                <p className="text-[11px] text-[#C8C8D0] mt-5 pt-4 border-t border-[#F2F2F7]">
                  {deadlines.filter(d => d.completed).length} deadline{deadlines.filter(d => d.completed).length > 1 ? 's' : ''} marked complete · hidden from stress calculation
                </p>
              )}
            </div>

            {/* Past deadlines — overdue, not yet marked complete */}
            {pastDeadlines.length > 0 && (
              <div className="bg-white border border-red-100 rounded-2xl p-6 mt-6">
                <p className="text-[11px] font-semibold text-red-400 uppercase tracking-widest mb-5">
                  {selected ? `${courses.find(c => c.id === selected)?.code ?? ''} — Past Deadlines` : 'Past Deadlines'}
                </p>
                <div className="space-y-3">
                  {pastDeadlines.map((d) => {
                    const course = courses.find(c => c.id === d.courseId)
                    return (
                      <DeadlineRow
                        key={d.id}
                        deadline={d}
                        courseLabel={!selected ? (course?.code ?? 'Unknown course') : null}
                        dueLabel={daysLabel(d.date, today)}
                        dueDateColorClass="text-red-500"
                        dueDateMinWidth="min-w-[80px]"
                        dimmed
                        onToggleComplete={toggleComplete}
                        onEdit={openEditDeadline}
                        onDelete={deleteDeadline}
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Add / Edit Deadline Modal */}
      {deadlineModal && (
        <div
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 px-4"
          onClick={e => { if (e.target === e.currentTarget) closeDeadlineModal() }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-[#EBEBF0]">
            <p className="text-sm font-extrabold text-[#0F0F0F] mb-5">
              {deadlineModal === 'add' ? 'Add Deadline' : 'Edit Deadline'}
            </p>

            <div className="space-y-3">
              {/* Course */}
              <div>
                <label className="text-[11px] font-semibold text-[#9999AA] uppercase tracking-widest block mb-1.5">Course</label>
                <select
                  value={deadlineForm.courseId}
                  onChange={e => setDeadlineForm(f => ({ ...f, courseId: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-[#EBEBF0] rounded-xl text-sm text-[#0F0F0F] outline-none focus:border-[#5B5BD6] transition-colors bg-white"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="text-[11px] font-semibold text-[#9999AA] uppercase tracking-widest block mb-1.5">Title</label>
                <input
                  type="text"
                  value={deadlineForm.title}
                  onChange={e => setDeadlineForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Problem Set 5"
                  className="w-full px-4 py-2.5 border border-[#EBEBF0] rounded-xl text-sm text-[#0F0F0F] placeholder:text-[#C8C8D0] outline-none focus:border-[#5B5BD6] transition-colors"
                />
              </div>

              {/* Type + Weight */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#9999AA] uppercase tracking-widest block mb-1.5">Type</label>
                  <select
                    value={deadlineForm.type}
                    onChange={e => setDeadlineForm(f => ({ ...f, type: e.target.value }))}
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
                    inputMode="numeric"
                    maxLength={3}
                    value={deadlineForm.weight}
                    onChange={e => setDeadlineForm(f => ({ ...f, weight: sanitizeWeightInput(e.target.value) }))}
                    placeholder="0-100"
                    className="w-full px-4 py-2.5 border border-[#EBEBF0] rounded-xl text-sm text-[#0F0F0F] placeholder:text-[#C8C8D0] outline-none focus:border-[#5B5BD6] transition-colors"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="text-[11px] font-semibold text-[#9999AA] uppercase tracking-widest block mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={deadlineForm.date}
                  onChange={e => setDeadlineForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-[#EBEBF0] rounded-xl text-sm text-[#0F0F0F] outline-none focus:border-[#5B5BD6] transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={closeDeadlineModal}
                className="flex-1 py-2.5 rounded-xl border border-[#E2E2E9] text-sm font-bold text-[#6B6B80] hover:bg-[#F7F7FA] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDeadline}
                disabled={!deadlineForm.title.trim() || !deadlineForm.date || !deadlineForm.courseId || !isValidWeight(deadlineForm.weight)}
                className="flex-1 py-2.5 rounded-xl bg-[#5B5BD6] text-white text-sm font-bold hover:bg-[#4A4AC4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deadlineModal === 'add' ? 'Add Deadline' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Course Modal */}
      {courseModal && (
        <div
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 px-4"
          onClick={e => { if (e.target === e.currentTarget) closeCourseModal() }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-[#EBEBF0]">
            <p className="text-sm font-extrabold text-[#0F0F0F] mb-5">
              {courseModal === 'add' ? 'Add Course' : 'Edit Course'}
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-[#9999AA] uppercase tracking-widest block mb-1.5">Course Code</label>
                <input
                  type="text"
                  value={courseForm.code}
                  onChange={e => setCourseForm(f => ({ ...f, code: e.target.value }))}
                  placeholder="e.g. CMPS 479"
                  className="w-full px-4 py-2.5 border border-[#EBEBF0] rounded-xl text-sm text-[#0F0F0F] placeholder:text-[#C8C8D0] outline-none focus:border-[#5B5BD6] transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#9999AA] uppercase tracking-widest block mb-1.5">Course Name</label>
                <input
                  type="text"
                  value={courseForm.name}
                  onChange={e => setCourseForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Theory of Computation"
                  className="w-full px-4 py-2.5 border border-[#EBEBF0] rounded-xl text-sm text-[#0F0F0F] placeholder:text-[#C8C8D0] outline-none focus:border-[#5B5BD6] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#9999AA] uppercase tracking-widest block mb-1.5">Instructor</label>
                  <input
                    type="text"
                    value={courseForm.instructor}
                    onChange={e => setCourseForm(f => ({ ...f, instructor: e.target.value }))}
                    placeholder="e.g. Dr. Smith"
                    className="w-full px-4 py-2.5 border border-[#EBEBF0] rounded-xl text-sm text-[#0F0F0F] placeholder:text-[#C8C8D0] outline-none focus:border-[#5B5BD6] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#9999AA] uppercase tracking-widest block mb-1.5">Credits</label>
                  <input
                    type="number"
                    value={courseForm.credits}
                    onChange={e => setCourseForm(f => ({ ...f, credits: e.target.value }))}
                    placeholder="e.g. 3"
                    className="w-full px-4 py-2.5 border border-[#EBEBF0] rounded-xl text-sm text-[#0F0F0F] placeholder:text-[#C8C8D0] outline-none focus:border-[#5B5BD6] transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={closeCourseModal}
                className="flex-1 py-2.5 rounded-xl border border-[#E2E2E9] text-sm font-bold text-[#6B6B80] hover:bg-[#F7F7FA] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCourse}
                disabled={!courseForm.code.trim() || !courseForm.name.trim()}
                className="flex-1 py-2.5 rounded-xl bg-[#5B5BD6] text-white text-sm font-bold hover:bg-[#4A4AC4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {courseModal === 'add' ? 'Add Course' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
