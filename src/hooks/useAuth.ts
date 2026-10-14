import { useEffect } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { demoGetCurrentProfile, demoSeedIfEmpty } from '../lib/demo'

export function useAuth() {
  const { user, session, profile, loading, setUser, setSession, setLoading, setProfile, fetchProfile, signOut } =
    useAuthStore()

  useEffect(() => {
    // ── Demo mode (no Supabase) ────────────────────────────────────────────
    if (!supabaseConfigured) {
      demoSeedIfEmpty()
      const demoProfile = demoGetCurrentProfile()
      if (demoProfile) {
        setProfile(demoProfile)
      }
      setLoading(false)
      return
    }

    // ── Supabase mode ──────────────────────────────────────────────────────
    // Check if there is an active demo profile first
    const demoProfile = demoGetCurrentProfile()
    if (demoProfile) {
      demoSeedIfEmpty()
      setProfile(demoProfile)
      setLoading(false)
      // Do not return early, but session check won't overwrite demo if no session exists
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        const session = data?.session ?? null
        if (session?.user) {
          setSession(session)
          setUser(session.user)
          fetchProfile(session.user.id)
        } else if (!demoGetCurrentProfile()?.id.startsWith('demo-')) {
          setSession(null)
          setUser(null)
        }
      })
      .catch((err) => {
        console.warn('Auth session check skipped:', err)
      })
      .finally(() => {
        setLoading(false)
      })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setSession(session)
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          setSession(null)
          setUser(null)
          const currentProfile = useAuthStore.getState().profile
          if (!currentProfile?.id.startsWith('demo-') && !demoGetCurrentProfile()?.id.startsWith('demo-')) {
            useAuthStore.getState().setProfile(null)
          }
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, session, profile, loading, signOut }
}

