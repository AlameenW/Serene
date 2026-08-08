// Shared stress-scoring logic used by Dashboard, Courses, Profile, and Support's AI opener.

// Proximity pressure: drops off sharply after day 2
const PROX = [1.0, 0.7, 0.4, 0.2, 0.1, 0.05, 0.02]
const MAX_PRESSURE = 2.0

// Mood bumps only today's score; future days have no known mood
const MOOD_MOD = { Calm: 0, Focused: 0, Tired: 1, Anxious: 2, Overwhelmed: 3 }

// 'YYYY-MM-DD' strings are UTC midnight when passed to new Date(),
// which shifts the date back one day in US timezones. Always parse as local.
export function parseLocal(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function proximityFactor(daysUntil) {
  if (daysUntil < 0) return 0
  return daysUntil < PROX.length ? PROX[daysUntil] : 0.01
}

export function weightFactor(d) {
  const pct = parseInt(d.weight)
  if (!isNaN(pct)) {
    if (pct >= 30) return 1.0
    if (pct >= 20) return 0.8
    if (pct >= 10) return 0.5
    return 0.2
  }
  return { exam: 0.9, project: 0.7, quiz: 0.4, assignment: 0.2 }[d.type] ?? 0.3
}

// 0–10 score for a single day, `dayOffset` days from today. `deadlines` should
// already exclude completed items — callers filter that once, up front.
export function computeDayScore(dayOffset, deadlines) {
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

// 7-day forecast for the Dashboard bar chart. `deadlines` should already exclude completed items.
export function buildForecast(deadlines, activeMood) {
  return Array.from({ length: 7 }, (_, i) => {
    const ds = computeDayScore(i, deadlines)
    const score = i === 0 && activeMood
      ? ds * 0.7 + (MOOD_MOD[activeMood] / 3) * 10 * 0.3
      : ds

    const d = new Date()
    d.setDate(d.getDate() + i)
    const day = d.toLocaleDateString('en-US', { weekday: 'short' })

    return { day, score: Math.round(score * 10) } // ×10 → 0–100 for chart
  })
}

// 0–100 score for a single course's upcoming, non-completed deadlines.
export function courseStressScore(courseId, today, deadlines) {
  const upcoming = deadlines.filter(d =>
    d.courseId === courseId && !d.completed && parseLocal(d.date) >= today
  )
  const pressure = upcoming.reduce((sum, d) => {
    const days = Math.round((parseLocal(d.date) - today) / 86400000)
    return sum + proximityFactor(days) * weightFactor(d)
  }, 0)
  const clusterCount = upcoming.filter(d => Math.round((parseLocal(d.date) - today) / 86400000) <= 2).length
  const clusterMult = 1 + 0.15 * Math.max(0, clusterCount - 1)
  return Math.min((pressure * clusterMult) / MAX_PRESSURE, 1) * 100
}

export function stressMeta(score) {
  if (score >= 70) return { label: 'High', dot: 'bg-red-500', text: 'text-red-500', bar: 'bg-red-400' }
  if (score >= 40) return { label: 'Moderate', dot: 'bg-yellow-500', text: 'text-yellow-600', bar: 'bg-yellow-400' }
  return { label: 'Low', dot: 'bg-green-500', text: 'text-green-600', bar: 'bg-green-400' }
}

export function typeCls(type) {
  if (type === 'exam') return 'bg-orange-100 text-orange-600'
  if (type === 'project') return 'bg-green-100 text-green-700'
  return 'bg-blue-100 text-blue-600'
}

// Renders a stored weight (may be a legacy "20%" string or a plain number) as "20%", or null if unset/invalid.
export function formatWeight(weight) {
  if (weight === undefined || weight === null || weight === '') return null
  const pct = parseInt(weight, 10)
  return Number.isNaN(pct) ? null : `${pct}%`
}

export function formatDue(dateStr) {
  return parseLocal(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function daysLabel(dateStr, today = new Date()) {
  const t = new Date(today)
  t.setHours(0, 0, 0, 0)
  const diff = Math.round((parseLocal(dateStr) - t) / 86400000)
  if (diff <= 0) return 'Today'
  if (diff === 1) return 'Tmrw'
  return `${diff}d`
}

// Non-completed deadlines due within the next `days` days (inclusive), soonest first.
export function getUpcoming(deadlines, { days = 7 } = {}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return deadlines
    .filter(d => !d.completed)
    .filter(d => {
      const diff = Math.round((parseLocal(d.date) - today) / 86400000)
      return diff >= 0 && diff <= days
    })
    .sort((a, b) => parseLocal(a.date) - parseLocal(b.date))
}
