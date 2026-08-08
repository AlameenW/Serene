import { initializeApp, getApp, getApps } from 'firebase/app'
import { getAnalytics, isSupported } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

/**
 * Config comes from Vite env (see `serene.firebase.env.example` → copy to `.env.local`).
 * Same shape as the Firebase console “Web app” snippet.
 */
function buildConfig() {
  const base = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }
  const mid = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  if (typeof mid === 'string' && mid.length > 0) {
    return { ...base, measurementId: mid }
  }
  return base
}

export function isFirebaseConfigured() {
  const c = buildConfig()
  const required = [c.apiKey, c.authDomain, c.projectId, c.storageBucket, c.messagingSenderId, c.appId]
  return required.every((v) => typeof v === 'string' && v.length > 0)
}

let cachedApp = null
let cachedAuth = null
let cachedDb = null
let analyticsInitDone = false

function initAnalyticsIfSupported(app) {
  if (analyticsInitDone) return
  const c = buildConfig()
  if (!c.measurementId) return
  analyticsInitDone = true
  isSupported()
    .then((ok) => {
      if (ok) getAnalytics(app)
    })
    .catch(() => {
      analyticsInitDone = false
    })
}

function getOrInitApp() {
  if (cachedApp) return cachedApp
  if (!isFirebaseConfigured()) return null
  const config = buildConfig()
  if (getApps().length === 0) {
    cachedApp = initializeApp(config)
  } else {
    cachedApp = getApp()
  }
  initAnalyticsIfSupported(cachedApp)
  return cachedApp
}

/** @returns {import('firebase/app').FirebaseApp | null} */
export function getFirebaseApp() {
  return getOrInitApp()
}

/** @returns {import('firebase/auth').Auth | null} */
export function getFirebaseAuth() {
  const app = getOrInitApp()
  if (!app) return null
  if (cachedAuth) return cachedAuth
  cachedAuth = getAuth(app)
  return cachedAuth
}

/** @returns {import('firebase/firestore').Firestore | null} */
export function getFirebaseFirestore() {
  const app = getOrInitApp()
  if (!app) return null
  if (cachedDb) return cachedDb
  cachedDb = getFirestore(app)
  return cachedDb
}
