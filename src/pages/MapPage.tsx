import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchIssues } from '../services/issuesService'
import { demoGetIssues } from '../lib/demo'
import { supabaseConfigured } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Issue, IssueCategory } from '../lib/database.types'
import { IssueMap } from '../components/map/IssueMap'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { SecureImage } from '../components/ui/SecureImage'
import { CATEGORY_ICONS, CATEGORY_LABELS } from '../utils/helpers'
import { StatusBadge } from '../components/ui/StatusBadge'

const CATEGORIES = Object.keys(CATEGORY_LABELS) as IssueCategory[]

export function MapPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const isDemo = !supabaseConfigured || Boolean(profile?.id.startsWith('demo-'))
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | 'all'>('all')
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)

  useEffect(() => {
    if (isDemo) {
      setIssues(demoGetIssues())
      setLoading(false)
      return
    }

    fetchIssues({ limit: 200 })
      .then(setIssues)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [isDemo])

  const filtered =
    selectedCategory === 'all'
      ? issues
      : issues.filter((i) => i.category === selectedCategory)

  if (loading) return <LoadingSpinner label="Loading map..." />

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] gap-4">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white">Issue Map</h1>
          <p className="text-slate-400 text-sm">{filtered.length} issues in your area</p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 flex-shrink-0 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
            selectedCategory === 'all'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
              : 'glass border border-white/10 text-slate-400 hover:text-white'
          }`}
        >
          🗺️ All ({issues.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = issues.filter((i) => i.category === cat).length
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                selectedCategory === cat
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'glass border border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]} ({count})
            </button>
          )
        })}
      </div>

      {/* Map + side panel */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Map */}
        <div className="flex-1 min-w-0">
          <IssueMap
            issues={filtered}
            height="100%"
            zoom={5}
            onIssueClick={setSelectedIssue}
          />
        </div>

        {/* Selected issue panel */}
        {selectedIssue && (
          <div className="w-72 flex-shrink-0 glass rounded-2xl border border-white/10 overflow-hidden flex flex-col animate-slide-in">
            {selectedIssue.photo_url && (
              <SecureImage
                src={selectedIssue.photo_url}
                alt=""
                className="w-full h-32 object-cover flex-shrink-0"
              />
            )}
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="flex items-start gap-2 mb-3">
                <span className="text-2xl flex-shrink-0">
                  {CATEGORY_ICONS[selectedIssue.category]}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">
                    {selectedIssue.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {CATEGORY_LABELS[selectedIssue.category]}
                  </p>
                </div>
              </div>
              <StatusBadge status={selectedIssue.status} size="sm" />
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                {selectedIssue.description}
              </p>
              {selectedIssue.address && (
                <p className="text-xs text-slate-500 mt-2 flex items-start gap-1">
                  📍 {selectedIssue.address}
                </p>
              )}
              <button
                onClick={() => navigate(`/issues/${selectedIssue.id}`)}
                className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all"
              >
                View Full Details →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
