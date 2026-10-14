import type { IssueCategory, IssuePriority, IssueStatus } from '../lib/database.types'

// ─── Category ─────────────────────────────────────────────────
export const CATEGORY_LABELS: Record<IssueCategory, string> = {
  pothole: 'Pothole',
  road_damage: 'Road Damage',
  drainage: 'Drainage Overflow',
  garbage: 'Garbage Accumulation',
  streetlight: 'Broken Streetlight',
  water_leakage: 'Water Leakage',
  footpath: 'Damaged Footpath',
  other: 'Other',
}

export const CATEGORY_ICONS: Record<IssueCategory, string> = {
  pothole: '🕳️',
  road_damage: '🛣️',
  drainage: '🌊',
  garbage: '🗑️',
  streetlight: '💡',
  water_leakage: '💧',
  footpath: '🚶',
  other: '📋',
}

export const CATEGORY_COLORS: Record<IssueCategory, string> = {
  pothole: '#f59e0b',
  road_damage: '#ef4444',
  drainage: '#3b82f6',
  garbage: '#84cc16',
  streetlight: '#eab308',
  water_leakage: '#06b6d4',
  footpath: '#8b5cf6',
  other: '#6b7280',
}

// ─── Status ───────────────────────────────────────────────────
export const STATUS_LABELS: Record<IssueStatus, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
}

export const STATUS_FLOW: IssueStatus[] = [
  'pending', 'assigned', 'in_progress', 'resolved', 'rejected'
]

// ─── Priority ─────────────────────────────────────────────────
export const PRIORITY_LABELS: Record<IssuePriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

// ─── Date Formatting ──────────────────────────────────────────
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function timeAgo(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = Math.floor((now - date) / 1000)

  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return formatDate(dateStr)
}

// ─── Misc ─────────────────────────────────────────────────────
export function truncate(str: string, len = 80): string {
  return str.length > len ? str.slice(0, len) + '...' : str
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
