import { createContext, useContext, useState, useEffect } from 'react'
import {
  collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, setDoc,
  writeBatch, serverTimestamp,
} from 'firebase/firestore'
import { useAuth } from '../auth/AuthContext'
import { getFirebaseFirestore } from './firebase'

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

const EMPTY_PROFILE = { university: '', major: '', year: '' }

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const { user } = useAuth()
  const uid = user?.uid ?? null

  const [courses, setCourses] = useState([])
  const [deadlines, setDeadlines] = useState([])
  const [profile, setProfile] = useState(EMPTY_PROFILE)
  const [loading, setLoading] = useState(true)

  // Mood resets each new day; kept in localStorage — transient, no cross-device value
  const [activeMood, setActiveMoodRaw] = useState(() => {
    const stored = load('serene_mood', null)
    if (!stored) return null
    return stored.date === todayStr() ? stored.mood : null
  })

  function setActiveMood(mood) {
    setActiveMoodRaw(mood)
    localStorage.setItem('serene_mood', JSON.stringify(mood ? { mood, date: todayStr() } : null))
  }

  // Subscribe to this user's Firestore data; tears down and resets on sign-out or user change.
  useEffect(() => {
    if (!uid) {
      setCourses([])
      setDeadlines([])
      setProfile(EMPTY_PROFILE)
      setLoading(false)
      return
    }

    const db = getFirebaseFirestore()
    if (!db) {
      setLoading(false)
      return
    }

    setLoading(true)
    const ready = { courses: false, deadlines: false, profile: false }
    function maybeDoneLoading() {
      if (ready.courses && ready.deadlines && ready.profile) setLoading(false)
    }

    const unsubCourses = onSnapshot(
      collection(db, 'users', uid, 'courses'),
      (snap) => {
        setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        ready.courses = true
        maybeDoneLoading()
      },
      (err) => {
        console.error('[courses onSnapshot]', err)
        ready.courses = true
        maybeDoneLoading()
      },
    )

    const unsubDeadlines = onSnapshot(
      collection(db, 'users', uid, 'deadlines'),
      (snap) => {
        setDeadlines(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        ready.deadlines = true
        maybeDoneLoading()
      },
      (err) => {
        console.error('[deadlines onSnapshot]', err)
        ready.deadlines = true
        maybeDoneLoading()
      },
    )

    const unsubProfile = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        const data = snap.data()
        setProfile({
          university: data?.university ?? '',
          major: data?.major ?? '',
          year: data?.year ?? '',
        })
        ready.profile = true
        maybeDoneLoading()
      },
      (err) => {
        console.error('[profile onSnapshot]', err)
        ready.profile = true
        maybeDoneLoading()
      },
    )

    return () => {
      unsubCourses()
      unsubDeadlines()
      unsubProfile()
    }
  }, [uid])

  async function addCourse(entry) {
    const db = getFirebaseFirestore()
    if (!uid || !db) return
    try {
      await addDoc(collection(db, 'users', uid, 'courses'), {
        ...entry,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } catch (e) {
      console.error(e)
      window.alert('Could not save the course. Please try again.')
    }
  }

  async function updateCourse(id, changes) {
    const db = getFirebaseFirestore()
    if (!uid || !db) return
    try {
      await updateDoc(doc(db, 'users', uid, 'courses', id), { ...changes, updatedAt: serverTimestamp() })
    } catch (e) {
      console.error(e)
      window.alert('Could not save changes. Please try again.')
    }
  }

  // Cascades: deletes the course's deadlines (from the live local snapshot) along with the course itself.
  async function deleteCourse(id) {
    const db = getFirebaseFirestore()
    if (!uid || !db) return
    try {
      const batch = writeBatch(db)
      deadlines
        .filter(d => d.courseId === id)
        .forEach(d => batch.delete(doc(db, 'users', uid, 'deadlines', d.id)))
      batch.delete(doc(db, 'users', uid, 'courses', id))
      await batch.commit()
    } catch (e) {
      console.error(e)
      window.alert('Could not delete the course. Please try again.')
    }
  }

  async function addDeadline(entry) {
    const db = getFirebaseFirestore()
    if (!uid || !db) return
    try {
      await addDoc(collection(db, 'users', uid, 'deadlines'), {
        ...entry,
        completed: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } catch (e) {
      console.error(e)
      window.alert('Could not save the deadline. Please try again.')
    }
  }

  async function updateDeadline(id, changes) {
    const db = getFirebaseFirestore()
    if (!uid || !db) return
    try {
      await updateDoc(doc(db, 'users', uid, 'deadlines', id), { ...changes, updatedAt: serverTimestamp() })
    } catch (e) {
      console.error(e)
      window.alert('Could not save changes. Please try again.')
    }
  }

  async function deleteDeadline(id) {
    const db = getFirebaseFirestore()
    if (!uid || !db) return
    try {
      await deleteDoc(doc(db, 'users', uid, 'deadlines', id))
    } catch (e) {
      console.error(e)
      window.alert('Could not delete the deadline. Please try again.')
    }
  }

  async function toggleComplete(id) {
    const db = getFirebaseFirestore()
    const current = deadlines.find(d => d.id === id)
    if (!uid || !db || !current) return
    try {
      await updateDoc(doc(db, 'users', uid, 'deadlines', id), {
        completed: !current.completed,
        updatedAt: serverTimestamp(),
      })
    } catch (e) {
      console.error(e)
      window.alert('Could not update the deadline. Please try again.')
    }
  }

  async function updateProfile(fields) {
    const db = getFirebaseFirestore()
    if (!uid || !db) return
    try {
      await setDoc(doc(db, 'users', uid), { ...fields, updatedAt: serverTimestamp() }, { merge: true })
    } catch (e) {
      console.error(e)
      window.alert('Could not save your profile. Please try again.')
    }
  }

  return (
    <AppContext.Provider value={{
      courses, addCourse, updateCourse, deleteCourse,
      deadlines, addDeadline, updateDeadline, deleteDeadline, toggleComplete,
      profile, updateProfile,
      loading,
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
