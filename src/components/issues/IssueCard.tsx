import { MapPin, Clock, MessageSquare, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Issue } from '../../lib/database.types'
import { CATEGORY_ICONS, CATEGORY_LABELS, timeAgo, truncate } from '../../utils/helpers'
import { StatusBadge } from '../ui/StatusBadge'
import { PriorityBadge } from '../ui/PriorityBadge'
import { SecureImage } from '../ui/SecureImage'

interface IssueCardProps {
  issue: Issue
  linkPrefix?: string
}

export function IssueCard({ issue, linkPrefix = '' }: IssueCardProps) {
  const icon = CATEGORY_ICONS[issue.category] ?? '📋'
  const label = CATEGORY_LABELS[issue.category] ?? 'Issue'

  return (
    <Link
      to={`${linkPrefix}/issues/${issue.id}`}
      className="block glass rounded-2xl p-4 hover:bg-white/[0.08] transition-all duration-200 group border border-white/5 hover:border-white/15 animate-fade-in"
    >
      <div className="flex items-start gap-3">
        {/* Category icon */}
        <div className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-105 transition-transform">
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors leading-tight">
                {issue.title}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
            <ChevronRight
              size={16}
              className="text-slate-600 group-hover:text-blue-400 flex-shrink-0 mt-0.5 transition-colors"
            />
          </div>

          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            {truncate(issue.description, 100)}
          </p>

          {/* Photo thumbnail */}
          {issue.photo_url && (
            <div className="mt-2 rounded-lg overflow-hidden h-24">
              <SecureImage
                src={issue.photo_url}
                alt="Issue photo"
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />
            </div>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <StatusBadge status={issue.status} size="sm" />
            <PriorityBadge priority={issue.priority} size="sm" />

            {issue.address && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin size={10} />
                {truncate(issue.address, 40)}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock size={10} />
              {timeAgo(issue.created_at)}
            </span>
            {issue.comments && issue.comments.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <MessageSquare size={10} />
                {issue.comments.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
