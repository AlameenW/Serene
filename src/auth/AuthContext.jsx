import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from 'firebase/auth'
import { getFirebaseAuth, isFirebaseConfigured } from '../lib/firebase'

/** After signInWithRedirect, send user to dashboard (full-page return bypasses the Sign in button) */
function PostGoogleLoginRedirect() {
  const navigate = useNavigate()
  useEffect(() => {
    const auth = getFirebaseAuth()
    if (!auth) return
    getRedirectResult(auth)
      .then((res) => {
        if (res?.user) navigate('/dashboard', { replace: true })
      })
      .catch(() => {})
  }, [navigate])
  return null
}

function authErrorMessage(code, message) {
  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Google sign-in is turned off. In Firebase Console → Authentication → Sign-in method, enable Google.'
    case 'auth/unauthorized-domain':
      return 'This site’s domain is not allowed. In Firebase → Authentication → Settings → Authorized domains, add localhost (or your deployed domain).'
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in window. Allow popups for this site, or try again — we will use a full-page sign-in if needed.'
    default:
      return message || 'Sign-in failed. Check the browser console (F12) for details.'
  }
}

/**
 * Team workflow: keep Google sign-in / sign-out in this file.
 * Other features should use `useAuth()` and avoid importing Firebase directly.
 */
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const configured = isFirebaseConfigured()

  useEffect(() => {
    const auth = getFirebaseAuth()
    if (!auth) {
      setUser(null)
      setLoading(false)
      return
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const auth = getFirebaseAuth()
    if (!auth) {
      window.alert(
        'Firebase is not configured. Add the VITE_FIREBASE_* variables to `.env.local` (see serene.firebase.env.example), then restart `npm run dev`.',
      )
      return false
    }
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    try {
      await signInWithPopup(auth, provider)
      return true
    } catch (e) {
      if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') {
        return false
      }
      if (e.code === 'auth/popup-blocked') {
        try {
          await signInWithRedirect(auth, provider)
          return true
        } catch (re) {
          console.error(re)
          window.alert(authErrorMessage(re.code, re.message))
          return false
        }
      }
      console.error(e)
      window.alert(authErrorMessage(e.code, e.message))
      return false
    }
  }, [])

  const signOutUser = useCallback(async () => {
    const auth = getFirebaseAuth()
    if (!auth) return
    try {
      await signOut(auth)
    } catch (e) {
      console.error(e)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      configured,
      signInWithGoogle,
      signOut: signOutUser,
    }),
    [user, loading, configured, signInWithGoogle, signOutUser],
  )

  return (
    <AuthContext.Provider value={value}>
      <PostGoogleLoginRedirect />
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
