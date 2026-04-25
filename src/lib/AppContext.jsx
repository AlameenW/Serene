import { createContext, useContext, useState, useEffect } from 'react'

const INITIAL_DEADLINES = [
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

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [deadlines, setDeadlines] = useState(() => load('serene_deadlines', INITIAL_DEADLINES))
  const [completed, setCompleted] = useState(() => new Set(load('serene_completed', [])))

  // Mood resets each new day
  const [activeMood, setActiveMoodRaw] = useState(() => {
    const stored = load('serene_mood', null)
    if (!stored) return null
    return stored.date === todayStr() ? stored.mood : null
  })

  useEffect(() => {
    localStorage.setItem('serene_deadlines', JSON.stringify(deadlines))
  }, [deadlines])

  useEffect(() => {
    localStorage.setItem('serene_completed', JSON.stringify([...completed]))
  }, [completed])

  function setActiveMood(mood) {
    setActiveMoodRaw(mood)
    localStorage.setItem('serene_mood', JSON.stringify(mood ? { mood, date: todayStr() } : null))
  }

  function toggleComplete(id) {
    setCompleted(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  function addDeadline(entry) {
    setDeadlines(prev => [...prev, entry])
  }

  function updateDeadline(id, changes) {
    setDeadlines(prev => prev.map(d => d.id === id ? { ...d, ...changes } : d))
  }

  function deleteDeadline(id) {
    setDeadlines(prev => prev.filter(d => d.id !== id))
    setCompleted(prev => { const s = new Set(prev); s.delete(id); return s })
  }

  return (
    <AppContext.Provider value={{
      deadlines, addDeadline, updateDeadline, deleteDeadline,
      completed, toggleComplete,
      activeMood, setActiveMood,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppState() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppState must be used within AppProvider')
  return ctx
}
