import type { IssueStatus } from '../../lib/database.types'
import { STATUS_LABELS } from '../../utils/helpers'

interface StatusBadgeProps {
  status: IssueStatus
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} status-${status}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
