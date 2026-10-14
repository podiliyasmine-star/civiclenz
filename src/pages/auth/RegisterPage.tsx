import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react'
import { supabase, supabaseConfigured } from '../../lib/supabase'
import toast from 'react-hot-toast'
import type { UserRole } from '../../lib/database.types'

export function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'citizen' as UserRole,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
if (!supabaseConfigured) {
  toast.error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  return
}
setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            role: form.role,
            phone: form.phone,
          },
        },
      })
      if (error) throw error
      toast.success('Account created! Check your email to verify.')
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err.message ?? 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Join CivicFix</h1>
          <p className="text-slate-400 mt-1 text-sm">Create an account to start reporting issues</p>
        </div>

        <div className="glass rounded-2xl border border-white/10 p-6">
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Role selector */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">I am a…</label>
              <div className="grid grid-cols-2 gap-2">
                {(['citizen', 'authority'] as UserRole[]).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => update('role', role)}
                    className={`py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${
                      form.role === role
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-slate-800/60 text-slate-400 hover:text-white border border-white/10'
                    }`}
                  >
                    {role === 'citizen' ? '👤 Citizen' : '🏛️ Authority'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                placeholder="John Doe"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Phone (optional)</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
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
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
