import { createClient } from '@supabase/supabase-js'

const envUrl = import.meta.env.VITE_SUPABASE_URL
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isValidUrl = typeof envUrl === 'string' && (envUrl.startsWith('http://') || envUrl.startsWith('https://'))
const isConfigured = Boolean(isValidUrl && envAnonKey && envAnonKey !== 'your_supabase_anon_key')

if (!isConfigured) {
  console.warn(
    'Supabase credentials missing or unconfigured. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
  )
}

const supabaseUrl = isValidUrl ? envUrl : 'https://placeholder.supabase.co'
const supabaseAnonKey = (envAnonKey && envAnonKey !== 'your_supabase_anon_key') ? envAnonKey : 'placeholder-key'

export const supabase = createClient<any>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)

// Export a flag indicating whether Supabase is properly configured
export const supabaseConfigured = isConfigured
