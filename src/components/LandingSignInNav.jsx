import GoogleSignInNavButton from './GoogleSignInNavButton'

export default function LandingSignInNav() {
  // Always use Firebase sign-in; missing config is handled in signInWithGoogle
  return <GoogleSignInNavButton />
}
