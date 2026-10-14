import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '../lib/database.types'
import { supabase } from '../lib/supabase'
import { demoSignOut } from '../lib/demo'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  fetchProfile: (userId: string) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      profile: null,
      loading: true,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setProfile: (profile) => set({ profile }),
      setLoading: (loading) => set({ loading }),

      fetchProfile: async (userId: string) => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (!error && data) {
          set({ profile: data as Profile })
        }
      },

      signOut: async () => {
        // Clear demo auth as well as any Supabase session
        demoSignOut()
        try {
          await supabase.auth.signOut()
        } catch { /* Supabase may not be configured */ }
        set({ user: null, session: null, profile: null })
      },
    }),
    {
      name: 'civicfix-auth',
      partialize: (state) => ({ profile: state.profile }),
    }
  )
)

