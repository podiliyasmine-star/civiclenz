import { useState } from 'react'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { useAuth } from '../../hooks/useAuth'
import { supabaseConfigured } from '../../lib/supabase'
import { FlaskConical } from 'lucide-react'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { profile } = useAuth()
  const isDemo = !supabaseConfigured || Boolean(profile?.id.startsWith('demo-'))

  return (
    <div className="min-h-screen bg-slate-900">
      {/* DEMO MODE banner */}
      {isDemo && (
        <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 py-1 bg-amber-500/90 backdrop-blur-sm text-slate-900 text-xs font-bold">
          <FlaskConical size={12} />
          DEMO MODE — Data stored in this browser only · Not real authentication
        </div>
      )}

      <Navbar
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
        demoMode={isDemo}
      />

      {profile && (
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      <main
        className={`min-h-screen transition-all duration-300 ${
          isDemo ? 'pt-24' : 'pt-16'
        } ${profile ? 'lg:pl-64' : ''}`}
      >
        <div className="p-4 lg:p-6 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}

