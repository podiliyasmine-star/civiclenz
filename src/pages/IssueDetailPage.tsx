import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Clock, User, MessageSquare, Send, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { fetchIssue, addComment } from '../services/issuesService'
import { demoGetIssue, demoAddComment } from '../lib/demo'
import { supabaseConfigured } from '../lib/supabase'
import type { Issue } from '../lib/database.types'
import { StatusBadge } from '../components/ui/StatusBadge'
import { PriorityBadge } from '../components/ui/PriorityBadge'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { SecureImage } from '../components/ui/SecureImage'
import { CATEGORY_ICONS, CATEGORY_LABELS, formatDateTime, initials, timeAgo } from '../utils/helpers'

export function IssueDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const isDemoUser = !supabaseConfigured || Boolean(profile?.id.startsWith('demo-'))

  const [issue, setIssue] = useState<Issue | null>(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    if (!id) return
    const isDemoId = id.startsWith('CL-') || id.startsWith('seed-') || isDemoUser
    if (isDemoId) {
      const demoFound = demoGetIssue(id)
      if (demoFound) {
        setIssue(demoFound)
        setLoading(false)
        return
      }
    }

    fetchIssue(id)
      .then(setIssue)
      .catch(() => toast.error('Issue not found'))
      .finally(() => setLoading(false))
  }, [id, isDemoUser])

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim() || !profile || !issue) return
    setSubmittingComment(true)
    try {
      const isDemoIssue = issue.id.startsWith('CL-') || issue.id.startsWith('seed-') || isDemoUser
      if (isDemoIssue) {
        const newComment = demoAddComment(issue.id, profile, comment.trim())
        setIssue((prev) =>
          prev ? { ...prev, comments: [...(prev.comments ?? []), newComment] } : prev
        )
        setComment('')
        toast.success('Comment added')
        return
      }

      const newComment = await addComment(issue.id, profile.id, comment.trim())
      setIssue((prev) =>
        prev ? { ...prev, comments: [...(prev.comments ?? []), newComment] } : prev
      )
      setComment('')
      toast.success('Comment added')
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to add comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  if (loading) return <LoadingSpinner label="Loading issue details..." />

  if (!issue) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Issue not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-blue-400 hover:text-blue-300 text-sm"
        >
          Go back
        </button>
      </div>
    )
  }

  const icon = CATEGORY_ICONS[issue.category]
  const categoryLabel = CATEGORY_LABELS[issue.category]
  const publicComments = (issue.comments ?? []).filter((c) => !c.is_internal)

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-5 transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      {/* Header */}
      <div className="glass rounded-2xl p-5 border border-white/10 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl flex-shrink-0">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white leading-tight">{issue.title}</h1>
            <p className="text-sm text-slate-400 mt-0.5">{categoryLabel}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <StatusBadge status={issue.status} />
              <PriorityBadge priority={issue.priority} />
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-300 mt-4 leading-relaxed">{issue.description}</p>

        {/* Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {issue.address && (
            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-slate-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400 break-words">{issue.address}</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-slate-500" />
            <p className="text-xs text-slate-400">Reported {formatDateTime(issue.created_at)}</p>
          </div>
          {issue.reporter && (
            <div className="flex items-center gap-2">
              <User size={14} className="text-slate-500" />
              <p className="text-xs text-slate-400">
                By {issue.reporter.full_name ?? 'Unknown'}
              </p>
            </div>
          )}
          {issue.assignee && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs flex-shrink-0">
                {initials(issue.assignee.full_name)[0]}
              </div>
              <p className="text-xs text-slate-400">
                Assigned to {issue.assignee.full_name ?? 'Authority'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Photo */}
      {issue.photo_url && (
        <div className="glass rounded-2xl border border-white/10 overflow-hidden mb-4">
          <SecureImage
            src={issue.photo_url}
            alt="Issue photo"
            className="w-full max-h-72 object-cover"
          />
        </div>
      )}

      {/* Status timeline */}
      <div className="glass rounded-2xl p-5 border border-white/10 mb-4">
        <h3 className="text-sm font-semibold text-white mb-4">Status Timeline</h3>
        <div className="flex items-center gap-0">
          {['pending', 'assigned', 'in_progress', 'resolved'].map((s, i, arr) => {
            const statuses = ['pending', 'assigned', 'in_progress', 'resolved', 'rejected']
            const currentIdx = statuses.indexOf(issue.status)
            const stepIdx = statuses.indexOf(s)
            const isActive = stepIdx <= currentIdx
            const isRejected = issue.status === 'rejected'

            return (
              <div key={s} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isActive && !isRejected
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : isRejected && s === 'pending'
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-800 text-slate-600 border border-white/10'
                  }`}>
                    {isActive && !isRejected ? '✓' : i + 1}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 text-center capitalize" style={{ fontSize: '10px' }}>
                    {s.replace('_', ' ')}
                  </p>
                </div>
                {i < arr.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${isActive && !isRejected ? 'bg-blue-500/50' : 'bg-slate-800'}`} />
                )}
              </div>
            )
          })}
        </div>

        {issue.resolution_notes && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-xs font-semibold text-emerald-300 mb-1">Resolution Notes</p>
            <p className="text-xs text-slate-300">{issue.resolution_notes}</p>
          </div>
        )}
      </div>

      {/* Comments */}
      <div className="glass rounded-2xl p-5 border border-white/10">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <MessageSquare size={14} className="text-slate-400" />
          Comments ({publicComments.length})
        </h3>

        {publicComments.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">
            No comments yet. Be the first to add one.
          </p>
        ) : (
          <div className="space-y-3 mb-4">
            {publicComments.map((c) => (
              <div key={c.id} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {initials(c.author?.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-white">
                      {c.author?.full_name ?? 'User'}
                    </span>
                    <span className="text-xs text-slate-500">{timeAgo(c.created_at)}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add comment */}
        {profile && (
          <form onSubmit={handleAddComment} className="flex gap-2 mt-4 border-t border-white/10 pt-4">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
              {initials(profile.full_name)}
            </div>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-800/60 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500/60 transition-all"
              />
              <button
                type="submit"
                disabled={!comment.trim() || submittingComment}
                className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingComment ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
