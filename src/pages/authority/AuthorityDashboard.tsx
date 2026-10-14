import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3, AlertTriangle, Clock, CheckCircle2,
  TrendingUp, Search, ChevronDown, Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchIssues, fetchStats, updateIssue, fetchAuthorities } from '../../services/issuesService'
import { demoGetIssues, demoGetStats, demoUpdateIssue, onIssuesChanged, DEMO_AUTHORITY } from '../../lib/demo'
import { supabaseConfigured } from '../../lib/supabase'
import type { Issue, IssueStatus, IssuePriority, IssueCategory, PublicProfile } from '../../lib/database.types'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { useAuth } from '../../hooks/useAuth'
import {
  CATEGORY_ICONS, CATEGORY_LABELS, STATUS_LABELS,
  PRIORITY_LABELS, timeAgo, truncate
} from '../../utils/helpers'

interface Stats {
  total: number
  pending: number
  in_progress: number
  resolved: number
  critical: number
  byCategory: Record<string, number>
  byStatus: Record<string, number>
}

export function AuthorityDashboard() {
  const { profile } = useAuth()
  const isDemo = !supabaseConfigured || Boolean(profile?.id.startsWith('demo-'))
  const [issues, setIssues] = useState<Issue[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [authorities, setAuthorities] = useState<PublicProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<IssuePriority | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<IssueCategory | 'all'>('all')
  const [search, setSearch] = useState('')

  const loadData = useCallback(() => {
    if (isDemo) {
      // ── Demo mode ──────────────────────────────────────────────────
      try {
        const demoIssues = demoGetIssues()
        const demoStats = demoGetStats()
        setIssues(demoIssues)
        setStats(demoStats)
        setAuthorities([DEMO_AUTHORITY])
      } catch {
        setIssues([])
        setStats(null)
      } finally {
        setLoading(false)
      }
      return
    }

    // ── Supabase mode ──────────────────────────────────────────────
    Promise.all([
      fetchIssues({ limit: 200 }),
      fetchStats(),
      fetchAuthorities(),
    ])
      .then(([issues, stats, auths]) => {
        setIssues(issues)
        setStats(stats)
        setAuthorities(auths)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [isDemo])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Re-sync when citizen submits a new report (demo mode)
  useEffect(() => {
    if (!isDemo) return
    return onIssuesChanged(loadData)
  }, [loadData, isDemo])


  const handleUpdateIssue = async (id: string, updates: Partial<Issue>) => {
    setUpdatingId(id)
    try {
      if (isDemo) {
        // ── Demo mode ────────────────────────────────────────────────
        const updated = demoUpdateIssue(id, updates)
        setIssues((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)))
        setStats(demoGetStats())
        toast.success('Issue updated')
      } else {
        // ── Supabase mode ────────────────────────────────────────────
        const updated = await updateIssue(id, updates)
        setIssues((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)))
        toast.success('Issue updated')
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Update failed')
    } finally {
      setUpdatingId(null)
    }
  }

  const filtered = issues.filter((issue) => {
    if (statusFilter !== 'all' && issue.status !== statusFilter) return false
    if (priorityFilter !== 'all' && issue.priority !== priorityFilter) return false
    if (categoryFilter !== 'all' && issue.category !== categoryFilter) return false
    if (search && !issue.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  if (loading) return <LoadingSpinner label="Loading authority dashboard..." />

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-400" />
            Authority Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage, prioritize and resolve civic issues</p>
        </div>
        <Link
          to="/authority/map"
          className="px-4 py-2 glass border border-white/20 hover:border-blue-500/50 text-slate-300 hover:text-white text-sm font-medium rounded-xl transition-all"
        >
          🗺️ View Map
        </Link>
      </div>

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total Issues', value: stats.total, icon: BarChart3, color: 'text-slate-300', bg: 'bg-slate-800/60' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'In Progress', value: stats.in_progress, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Critical', value: stats.critical, icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="glass rounded-2xl p-4 border border-white/5">
              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-2`}>
                <Icon size={16} className={color} />
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Category breakdown */}
      {stats && (
        <div className="glass rounded-2xl p-5 border border-white/10 mb-6">
          <h3 className="text-sm font-semibold text-white mb-4">Issues by Category</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {Object.entries(stats.byCategory).map(([cat, count]) => (
              <div
                key={cat}
                className="text-center p-2 rounded-xl bg-slate-800/50 border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer"
                onClick={() => setCategoryFilter(cat as IssueCategory)}
              >
                <div className="text-xl mb-1">{CATEGORY_ICONS[cat as IssueCategory] ?? '📋'}</div>
                <div className="text-sm font-bold text-white">{count}</div>
                <div className="text-xs text-slate-500 leading-tight">
                  {CATEGORY_LABELS[cat as IssueCategory] ?? cat}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters + Table */}
      <div className="glass rounded-2xl border border-white/10 overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-white/10 flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search issues..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-800/60 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500/60 transition-all"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as IssueStatus | 'all')}
              className="appearance-none pl-3 pr-7 py-2 rounded-xl bg-slate-800/60 border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-blue-500/60 transition-all"
            >
              <option value="all">All Status</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          {/* Priority filter */}
          <div className="relative">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as IssuePriority | 'all')}
              className="appearance-none pl-3 pr-7 py-2 rounded-xl bg-slate-800/60 border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-blue-500/60 transition-all"
            >
              <option value="all">All Priority</option>
              {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          <span className="text-xs text-slate-500 ml-auto">
            {filtered.length} issue{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Issues table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {['Issue', 'Category', 'Status', 'Priority', 'Reported', 'Assign To', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 text-sm">
                    No issues match your filters
                  </td>
                </tr>
              ) : (
                filtered.map((issue) => (
                  <tr
                    key={issue.id}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    {/* Issue */}
                    <td className="px-4 py-3 min-w-48">
                      <Link
                        to={`/issues/${issue.id}`}
                        className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors line-clamp-1"
                      >
                        {truncate(issue.title, 45)}
                      </Link>
                      <p className="text-xs text-slate-500 mt-0.5">
                        by {issue.reporter?.full_name ?? 'Unknown'}
                      </p>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span>{CATEGORY_ICONS[issue.category]}</span>
                        <span className="hidden sm:inline">{CATEGORY_LABELS[issue.category]}</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <div className="relative">
                        <select
                          value={issue.status}
                          disabled={updatingId === issue.id}
                          onChange={(e) =>
                            handleUpdateIssue(issue.id, { status: e.target.value as IssueStatus })
                          }
                          className={`appearance-none text-xs rounded-lg px-2 py-1 pr-5 border font-medium transition-all cursor-pointer
                            status-${issue.status} bg-transparent focus:outline-none`}
                        >
                          {Object.entries(STATUS_LABELS).map(([k, v]) => (
                            <option key={k} value={k} className="bg-slate-800 text-white">{v}</option>
                          ))}
                        </select>
                        <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3">
                      <div className="relative">
                        <select
                          value={issue.priority}
                          disabled={updatingId === issue.id}
                          onChange={(e) =>
                            handleUpdateIssue(issue.id, { priority: e.target.value as IssuePriority })
                          }
                          className={`appearance-none text-xs rounded-lg px-2 py-1 pr-5 border font-medium transition-all cursor-pointer
                            priority-${issue.priority} bg-transparent focus:outline-none`}
                        >
                          {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                            <option key={k} value={k} className="bg-slate-800 text-white">{v}</option>
                          ))}
                        </select>
                        <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                      </div>
                    </td>

                    {/* Reported */}
                    <td className="px-4 py-3">
                      <p className="text-xs text-slate-400">{timeAgo(issue.created_at)}</p>
                    </td>

                    {/* Assign */}
                    <td className="px-4 py-3">
                      <div className="relative">
                        <select
                          value={issue.assigned_to ?? ''}
                          disabled={updatingId === issue.id}
                          onChange={(e) =>
                            handleUpdateIssue(issue.id, {
                              assigned_to: e.target.value || null,
                              status: e.target.value ? 'assigned' : issue.status,
                            })
                          }
                          className="appearance-none text-xs rounded-lg px-2 py-1 pr-5 bg-slate-800/60 border border-white/10 text-slate-300 focus:outline-none focus:border-blue-500/60 transition-all cursor-pointer"
                        >
                          <option value="">Unassigned</option>
                          {authorities.map((a) => (
                            <option key={a.id} value={a.id} className="bg-slate-800">
                              {a.full_name ?? 'Authority'}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      {updatingId === issue.id ? (
                        <Loader2 size={14} className="text-blue-400 animate-spin" />
                      ) : (
                        <Link
                          to={`/issues/${issue.id}`}
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
                        >
                          View →
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
