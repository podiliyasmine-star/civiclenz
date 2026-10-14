import type { IssuePriority } from '../../lib/database.types'
import { PRIORITY_LABELS } from '../../utils/helpers'

interface PriorityBadgeProps {
  priority: IssuePriority
  size?: 'sm' | 'md'
}

export function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} priority-${priority}`}>
      {PRIORITY_LABELS[priority]}
    </span>
  )
}
