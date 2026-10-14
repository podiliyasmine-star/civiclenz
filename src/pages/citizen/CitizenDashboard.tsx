import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { fetchIssues } from '../../services/issuesService'
import { demoGetIssues, onIssuesChanged } from '../../lib/demo'
import { supabaseConfigured } from '../../lib/supabase'
import type { Issue } from '../../lib/database.types'
import { IssueCard } from '../../components/issues/IssueCard'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

export function CitizenDashboard() {
  const { profile } = useAuth()
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all')

  const loadIssues = useCallback(() => {
    if (!profile) return
    setLoading(true)

    const isDemo = !supabaseConfigured || Boolean(profile?.id.startsWith('demo-'))

    if (isDemo) {
      // ── Demo mode: read from localStorage ──────────────────────────
      try {
        const all = demoGetIssues()
        // Show only this citizen's reports
        const mine = all.filter((i) => i.reporter_id === profile.id)
        setIssues(mine)
      } catch {
        setIssues([])
      } finally {
        setLoading(false)
      }
      return
    }

    // ── Supabase mode ────────────────────────────────────────────────
    fetchIssues({ reporter_id: profile.id, limit: 100 })
      .then(setIssues)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [profile])

  useEffect(() => {
    loadIssues()
  }, [loadIssues])

  // Re-render when authority changes a status (demo mode)
  useEffect(() => {
    const isDemo = !supabaseConfigured || Boolean(profile?.id.startsWith('demo-'))
    if (!isDemo) return
    return onIssuesChanged(loadIssues)
  }, [loadIssues, profile])

  const stats = {
    total: issues.length,
    pending: issues.filter((i) => i.status === 'pending').length,
    inProgress: issues.filter((i) => ['assigned', 'in_progress'].includes(i.status)).length,
    resolved: issues.filter((i) => i.status === 'resolved').length,
  }

  const filtered =
    filter === 'all'
      ? issues
      : filter === 'in_progress'
      ? issues.filter((i) => ['assigned', 'in_progress'].includes(i.status))
      : issues.filter((i) => i.status === filter)

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">
            My Reports
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Welcome back, {profile?.full_name?.split(' ')[0] ?? 'there'} 👋
          </p>
        </div>
        <Link
          to="/report"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20"
        >
          <PlusCircle size={16} />
          New Report
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, icon: FileText, color: 'text-slate-300', bg: 'bg-slate-800/60' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'In Progress', value: stats.inProgress, icon: AlertCircle, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`glass rounded-2xl p-4 border border-white/5`}>
            <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-2`}>
              <Icon size={16} className={color} />
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-5 p-1 glass rounded-xl border border-white/10 w-fit">
        {(['all', 'pending', 'in_progress', 'resolved'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
              filter === f
                ? 'bg-blue-500/20 text-blue-300'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Issues list */}
      {loading ? (
        <LoadingSpinner label="Loading your reports..." />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 glass rounded-2xl border border-white/5">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-white mb-2">No reports yet</h3>
          <p className="text-slate-400 text-sm mb-6">
            {filter === 'all'
              ? "You haven't reported any civic issues yet."
              : `No ${filter.replace('_', ' ')} issues found.`}
          </p>
          {filter === 'all' && (
            <Link
              to="/report"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all"
            >
              <PlusCircle size={16} />
              Report Your First Issue
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}
    </div>
  )
}

