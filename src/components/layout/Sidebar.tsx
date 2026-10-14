import { NavLink } from 'react-router-dom'
import { supabaseConfigured } from '../../lib/supabase'
import {
  LayoutDashboard,
  PlusCircle,
  Map,
  ClipboardList,
  Users,
  BarChart3,
  Settings,
  X,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const citizenNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'My Reports' },
  { to: '/report', icon: PlusCircle, label: 'Report Issue' },
  { to: '/map', icon: Map, label: 'Issue Map' },
]

const authorityNav = [
  { to: '/authority/dashboard', icon: BarChart3, label: 'Dashboard' },
  { to: '/authority/issues', icon: ClipboardList, label: 'All Issues' },
  { to: '/authority/map', icon: Map, label: 'Issue Map' },
  { to: '/authority/team', icon: Users, label: 'Team' },
  { to: '/authority/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar({ open, onClose }: SidebarProps) {
  const { profile } = useAuth()
  const isAuthority = profile?.role === 'authority'
  const navItems = isAuthority ? authorityNav : citizenNav
  const isDemo = !supabaseConfigured || Boolean(profile?.id.startsWith('demo-'))
  const topClass = isDemo ? 'top-[88px]' : 'top-16'

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed left-0 ${topClass} bottom-0 z-40 w-64 glass border-r border-white/10
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0`}
      >
        <div className="flex flex-col h-full py-4 px-3">
          {/* Mobile close */}
          <div className="flex items-center justify-between mb-4 lg:hidden px-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Navigation
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>

          {/* Section label */}
          <p className="hidden lg:block px-3 mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {isAuthority ? 'Authority Panel' : 'Citizen Portal'}
          </p>

          {/* Nav links */}
          <nav className="flex flex-col gap-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-300 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={18}
                      className={`transition-colors ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`}
                    />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="mt-auto px-3 py-2">
            <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 p-3">
              <p className="text-xs font-semibold text-blue-300 mb-1">
                {isAuthority ? '⚡ Authority Mode' : '📍 CivicFix'}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAuthority
                  ? 'Manage, prioritize and resolve civic issues efficiently.'
                  : 'Report civic issues and track them to resolution.'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
