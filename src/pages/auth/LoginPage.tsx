import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, Loader2, UserCircle2, Building2, FlaskConical } from 'lucide-react'
import { supabase, supabaseConfigured } from '../../lib/supabase'
import { demoSignIn, DEMO_CREDENTIALS } from '../../lib/demo'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export function LoginPage() {
  const navigate = useNavigate()
  const { setProfile } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // ── Demo one-click login ───────────────────────────────────────────────────
  const handleDemoLogin = (role: 'citizen' | 'authority') => {
    const profile = demoSignIn(role)
    setProfile(profile)
    toast.success(
      role === 'citizen'
        ? '👤 Entered as Demo Citizen — Priya Sharma'
        : '🏛️ Entered as Demo Authority — Raj Mehta',
      { duration: 3000 }
    )
    navigate(role === 'authority' ? '/authority/dashboard' : '/dashboard')
  }

  // ── Supabase login (when configured) ──────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    // If the user typed demo credentials, route them to demo mode
    if (
      (email === DEMO_CREDENTIALS.citizen.email && password === DEMO_CREDENTIALS.citizen.password)
    ) {
      handleDemoLogin('citizen')
      return
    }
    if (
      (email === DEMO_CREDENTIALS.authority.email && password === DEMO_CREDENTIALS.authority.password)
    ) {
      handleDemoLogin('authority')
      return
    }

    if (!supabaseConfigured) {
      toast.error('Supabase is not configured. Use the Demo buttons below.')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err.message ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-slate-400 mt-1 text-sm">Sign in to your CivicLenz account</p>
        </div>

        {/* ── DEMO MODE PANEL ───────────────────────────────────────── */}
        <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical size={15} className="text-amber-400 flex-shrink-0" />
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              DEMO MODE — No Supabase required
            </span>
          </div>
          <p className="text-xs text-amber-200/70 mb-4 leading-relaxed">
            This is a live hackathon demo. Data is stored only in <strong>this browser</strong> and
            is not real authentication. No passwords or personal data are stored.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('citizen')}
              className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-blue-600/20 border border-blue-500/40 hover:bg-blue-600/30 hover:border-blue-400/60 transition-all group"
            >
              <UserCircle2 size={22} className="text-blue-300 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-blue-200">Demo Citizen</span>
              <span className="text-[10px] text-blue-400/80 text-center leading-tight">
                Priya Sharma<br />
                <span className="font-mono">{DEMO_CREDENTIALS.citizen.email}</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('authority')}
              className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-indigo-600/20 border border-indigo-500/40 hover:bg-indigo-600/30 hover:border-indigo-400/60 transition-all group"
            >
              <Building2 size={22} className="text-indigo-300 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-indigo-200">Demo Authority</span>
              <span className="text-[10px] text-indigo-400/80 text-center leading-tight">
                Raj Mehta (Officer)<br />
                <span className="font-mono">{DEMO_CREDENTIALS.authority.email}</span>
              </span>
            </button>
          </div>

          <p className="text-[10px] text-amber-200/50 mt-3 text-center">
            Password for both: <span className="font-mono font-bold text-amber-300">{DEMO_CREDENTIALS.citizen.password}</span>
          </p>
        </div>

        {/* ── Divider ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-slate-500">or sign in with credentials</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* ── Login form ────────────────────────────────────────────── */}
        <div className="glass rounded-2xl border border-white/10 p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

