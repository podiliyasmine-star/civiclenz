import { Shield, Bell, LogOut, Menu, X, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { initials } from '../../utils/helpers'

interface NavbarProps {
  onMenuToggle?: () => void
  sidebarOpen?: boolean
  demoMode?: boolean
}

export function Navbar({ onMenuToggle, sidebarOpen, demoMode }: NavbarProps) {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const isAuthority = profile?.role === 'authority'

  return (
    <nav className={`fixed left-0 right-0 z-50 glass border-b border-white/10 ${demoMode ? 'top-6' : 'top-0'}`}>
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left: Logo + Mobile menu */}
        <div className="flex items-center gap-3">
          {profile && (
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">
              Civic<span className="text-blue-400">Fix</span>
            </span>
          </Link>
        </div>

        {/* Center: Nav Links (desktop, citizen) */}
        {profile && !isAuthority && (
          <div className="hidden lg:flex items-center gap-1">
            {[
              { to: '/dashboard', label: 'My Reports' },
              { to: '/report', label: 'Report Issue' },
              { to: '/map', label: 'View Map' },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === to
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Right: Auth actions */}
        <div className="flex items-center gap-2">
          {profile ? (
            <>
              <button
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors relative"
                aria-label="Notifications"
              >
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                    {initials(profile.full_name)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-medium text-white leading-none">
                      {profile.full_name ?? 'User'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 capitalize">{profile.role}</p>
                  </div>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 glass rounded-xl border border-white/10 shadow-xl overflow-hidden z-50">
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      Profile Settings
                    </Link>
                    <button
                      onClick={() => { setDropdownOpen(false); signOut() }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors border-t border-white/10"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
