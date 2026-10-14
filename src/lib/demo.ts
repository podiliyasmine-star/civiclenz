/**
 * CivicLenz — DEMO MODE data layer
 *
 * Provides a fully in-browser data store backed by localStorage.
 * Replaces Supabase calls when Supabase is not configured.
 *
 * ⚠️  Demo data is stored only in THIS browser.
 *     It is NOT synced across devices and does NOT use real authentication.
 */

import type { Issue, Profile, IssueStatus, IssuePriority, IssueCategory } from './database.types'

// ─── Demo users ───────────────────────────────────────────────────────────────

export const DEMO_CITIZEN: Profile = {
  id: 'demo-citizen-001',
  email: 'citizen@demo.civiclenz',
  full_name: 'Priya Sharma',
  avatar_url: null,
  role: 'citizen',
  phone: '+91 98765 00001',
  created_at: new Date(Date.now() - 30 * 86400_000).toISOString(),
  updated_at: new Date(Date.now() - 30 * 86400_000).toISOString(),
}

export const DEMO_AUTHORITY: Profile = {
  id: 'demo-authority-001',
  email: 'authority@demo.civiclenz',
  full_name: 'Raj Mehta (Municipal Officer)',
  avatar_url: null,
  role: 'authority',
  phone: '+91 98765 00002',
  created_at: new Date(Date.now() - 60 * 86400_000).toISOString(),
  updated_at: new Date(Date.now() - 60 * 86400_000).toISOString(),
}

// Credentials shown on the login page
export const DEMO_CREDENTIALS = {
  citizen:   { email: 'citizen@demo.civiclenz',   password: 'demo1234' },
  authority: { email: 'authority@demo.civiclenz',  password: 'demo1234' },
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_ISSUES: Issue[] = [
  {
    id: 'seed-001',
    title: 'Large pothole near Andheri bus stop',
    description:
      'A massive pothole approximately 1.5 ft wide and 8 inches deep on SV Road near Andheri West bus stop. Several vehicles have been damaged. Present for over 2 weeks.',
    category: 'pothole' as IssueCategory,
    status: 'pending' as IssueStatus,
    priority: 'high' as IssuePriority,
    latitude: 19.1194,
    longitude: 72.8469,
    address: 'SV Road, Andheri West, Mumbai, Maharashtra',
    photo_url: null,
    reporter_id: 'demo-citizen-001',
    assigned_to: null,
    resolution_notes: null,
    created_at: new Date(Date.now() - 3 * 86400_000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400_000).toISOString(),
    reporter: DEMO_CITIZEN,
  },
  {
    id: 'seed-002',
    title: 'Overflowing storm drain blocking footpath',
    description:
      'The storm drain at the corner of MG Road and Brigade Road is completely blocked with debris. Rainwater is flooding the footpath, creating a safety hazard for pedestrians.',
    category: 'drainage' as IssueCategory,
    status: 'in_progress' as IssueStatus,
    priority: 'critical' as IssuePriority,
    latitude: 12.9751,
    longitude: 77.6064,
    address: 'MG Road & Brigade Road junction, Bengaluru, Karnataka',
    photo_url: null,
    reporter_id: 'demo-citizen-001',
    assigned_to: 'demo-authority-001',
    resolution_notes: null,
    created_at: new Date(Date.now() - 5 * 86400_000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400_000).toISOString(),
    reporter: DEMO_CITIZEN,
    assignee: DEMO_AUTHORITY,
  },
  {
    id: 'seed-003',
    title: 'Street lights out on Connaught Place Block D',
    description:
      'Three consecutive street lights on Block D, Connaught Place are not functioning. The area becomes extremely dark after 8 PM, making it unsafe for residents and shop owners.',
    category: 'streetlight' as IssueCategory,
    status: 'resolved' as IssueStatus,
    priority: 'medium' as IssuePriority,
    latitude: 28.6315,
    longitude: 77.2167,
    address: 'Block D, Connaught Place, New Delhi',
    photo_url: null,
    reporter_id: 'demo-citizen-001',
    assigned_to: 'demo-authority-001',
    resolution_notes: 'Faulty bulbs replaced and wiring inspected. All lights now functional.',
    created_at: new Date(Date.now() - 10 * 86400_000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400_000).toISOString(),
    reporter: DEMO_CITIZEN,
    assignee: DEMO_AUTHORITY,
  },
  {
    id: 'seed-004',
    title: 'Garbage pile-up near Dadar market',
    description:
      'Large mounds of uncollected garbage near Dadar Vegetable Market. Waste has not been collected in over 4 days, attracting stray animals and causing a foul smell.',
    category: 'garbage' as IssueCategory,
    status: 'pending' as IssueStatus,
    priority: 'high' as IssuePriority,
    latitude: 19.0205,
    longitude: 72.8447,
    address: 'Dadar Vegetable Market, Mumbai, Maharashtra',
    photo_url: null,
    reporter_id: 'demo-citizen-001',
    assigned_to: null,
    resolution_notes: null,
    created_at: new Date(Date.now() - 4 * 86400_000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 86400_000).toISOString(),
    reporter: DEMO_CITIZEN,
  },
]

// ─── localStorage keys ────────────────────────────────────────────────────────

const ISSUES_KEY = 'civiclenz_demo_issues'
const SEEDED_KEY = 'civiclenz_demo_seeded'
const AUTH_KEY   = 'civiclenz_demo_auth'

// ─── Cross-component sync via custom event ────────────────────────────────────

const ISSUES_CHANGED = 'civiclenz:issues_changed'

function notifyChange() {
  window.dispatchEvent(new Event(ISSUES_CHANGED))
}

export function onIssuesChanged(cb: () => void) {
  window.addEventListener(ISSUES_CHANGED, cb)
  return () => window.removeEventListener(ISSUES_CHANGED, cb)
}

// ─── Issue CRUD ───────────────────────────────────────────────────────────────

export function demoGetIssues(): Issue[] {
  try {
    const raw = localStorage.getItem(ISSUES_KEY)
    return raw ? (JSON.parse(raw) as Issue[]) : []
  } catch {
    return []
  }
}

function demoSaveIssues(issues: Issue[]) {
  try {
    localStorage.setItem(ISSUES_KEY, JSON.stringify(issues))
    notifyChange()
  } catch (e) {
    console.error('Demo: failed to save issues to localStorage', e)
  }
}

/** Seeds realistic sample data exactly once per browser. */
export function demoSeedIfEmpty() {
  if (localStorage.getItem(SEEDED_KEY)) return
  const existing = demoGetIssues()
  if (existing.length === 0) {
    demoSaveIssues(SEED_ISSUES)
  }
  localStorage.setItem(SEEDED_KEY, '1')
}

export function demoCreateIssue(
  payload: {
    title: string
    description: string
    category: IssueCategory
    latitude: number
    longitude: number
    address: string | null
    photo?: File | null
    reporter_id: string
  },
  reporter: Profile
): Issue {
  const now = new Date().toISOString()
  const shortId = 'CL-' + Math.random().toString(36).slice(2, 8).toUpperCase()
  const issue: Issue = {
    id: shortId,
    title: payload.title,
    description: payload.description,
    category: payload.category,
    status: 'pending',
    priority: 'medium',
    latitude: payload.latitude,
    longitude: payload.longitude,
    address: payload.address,
    photo_url: null, // File objects can't be stored in localStorage
    reporter_id: payload.reporter_id,
    assigned_to: null,
    resolution_notes: null,
    created_at: now,
    updated_at: now,
    reporter,
  }
  const issues = demoGetIssues()
  demoSaveIssues([issue, ...issues])
  return issue
}

export function demoUpdateIssue(id: string, updates: Partial<Issue>): Issue {
  const issues = demoGetIssues()
  const idx = issues.findIndex((i) => i.id === id)
  if (idx === -1) throw new Error('Issue not found')
  const updated = { ...issues[idx], ...updates, updated_at: new Date().toISOString() }
  issues[idx] = updated
  demoSaveIssues(issues)
  return updated
}

export function demoGetIssue(id: string): Issue | null {
  const issues = demoGetIssues()
  return issues.find((i) => i.id === id) ?? null
}

export function demoAddComment(issueId: string, author: Profile, content: string): any {
  const issues = demoGetIssues()
  const idx = issues.findIndex((i) => i.id === issueId)
  if (idx === -1) throw new Error('Issue not found')

  const newComment = {
    id: 'demo-c-' + Math.random().toString(36).slice(2, 8),
    issue_id: issueId,
    author_id: author.id,
    content,
    is_internal: false,
    created_at: new Date().toISOString(),
    author,
  }

  const existingComments = issues[idx].comments ?? []
  const updated = {
    ...issues[idx],
    comments: [...existingComments, newComment],
    updated_at: new Date().toISOString(),
  }
  issues[idx] = updated
  demoSaveIssues(issues)
  return newComment
}

export function demoGetStats() {
  const issues = demoGetIssues()
  const stats = {
    total: issues.length,
    pending: issues.filter((i) => i.status === 'pending').length,
    in_progress: issues.filter(
      (i) => i.status === 'in_progress' || i.status === 'assigned'
    ).length,
    resolved: issues.filter((i) => i.status === 'resolved').length,
    critical: issues.filter((i) => i.priority === 'critical').length,
    byCategory: {} as Record<string, number>,
    byStatus: {} as Record<string, number>,
  }
  issues.forEach((i) => {
    stats.byCategory[i.category] = (stats.byCategory[i.category] ?? 0) + 1
    stats.byStatus[i.status] = (stats.byStatus[i.status] ?? 0) + 1
  })
  return stats
}

// ─── Demo auth helpers ────────────────────────────────────────────────────────

export function demoSignIn(role: 'citizen' | 'authority'): Profile {
  const profile = role === 'authority' ? DEMO_AUTHORITY : DEMO_CITIZEN
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(profile))
  } catch { /* storage quota — rare */ }
  return profile
}

export function demoSignOut() {
  try {
    localStorage.removeItem(AUTH_KEY)
  } catch { /* ignore */ }
}

export function demoGetCurrentProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? (JSON.parse(raw) as Profile) : null
  } catch {
    return null
  }
}
