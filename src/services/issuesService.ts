import { supabase } from '../lib/supabase'
import type { Issue, IssueComment, IssueStatus, IssuePriority, IssueCategory, PublicProfile } from '../lib/database.types'
import { v4 as uuidv4 } from 'uuid'

export interface CreateIssuePayload {
  title: string
  description: string
  category: IssueCategory
  latitude: number
  longitude: number
  address: string | null
  photo?: File | null
  reporter_id: string
}

export interface UpdateIssuePayload {
  status?: IssueStatus
  priority?: IssuePriority
  assigned_to?: string | null
  resolution_notes?: string | null
}

export interface IssueFilters {
  status?: IssueStatus | 'all'
  category?: IssueCategory | 'all'
  priority?: IssuePriority | 'all'
  reporter_id?: string
  search?: string
  limit?: number
  offset?: number
}

// ─── Signed URL helper for private issue-photos bucket ───────
const SIGNED_URL_EXPIRES_IN = 3600 // 1 hour

/**
 * Resolves a storage path or legacy public URL to a secure signed URL.
 * Supports caching / refreshing when necessary.
 */
export async function getSignedPhotoUrl(pathOrUrl: string | null): Promise<string | null> {
  if (!pathOrUrl) return null

  // If it's already an external HTTP URL (e.g. Unsplash demo placeholder or legacy external link)
  // and NOT a Supabase storage path:
  let storagePath = pathOrUrl
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    // If it's a legacy public Supabase URL pointing to issue-photos, extract the path
    const marker = '/issue-photos/'
    const idx = pathOrUrl.indexOf(marker)
    if (idx !== -1) {
      storagePath = decodeURIComponent(pathOrUrl.slice(idx + marker.length))
    } else {
      // External non-Supabase image URL (demo mock images, etc.)
      return pathOrUrl
    }
  }

  try {
    const { data, error } = await supabase.storage
      .from('issue-photos')
      .createSignedUrl(storagePath, SIGNED_URL_EXPIRES_IN)

    if (error) {
      console.warn('Error generating signed URL for photo:', error.message)
      return null
    }

    return data?.signedUrl ?? null
  } catch (err) {
    console.warn('Failed to create signed URL:', err)
    return null
  }
}

/**
 * Hydrates a list of issues with freshly signed URLs for private photos.
 */
async function hydrateIssuesPhotos(issues: Issue[]): Promise<Issue[]> {
  return Promise.all(
    issues.map(async (issue) => {
      if (!issue.photo_url) return issue
      const signed = await getSignedPhotoUrl(issue.photo_url)
      return { ...issue, photo_url: signed }
    })
  )
}

// ─── Upload photo to Supabase Storage ───────────────────────
async function uploadPhoto(file: File, userId: string, issueId: string): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  // Path format bound to user: <userId>/<issueId>/photo.<ext>
  const path = `${userId}/${issueId}/photo.${ext}`

  // Each issue has a unique ID, so new uploads must never overwrite existing files.
  // Using upsert: false protects against accidental or malicious object replacement.
  const { error } = await supabase.storage
    .from('issue-photos')
    .upload(path, file, { upsert: false })

  if (error) {
    console.error('Photo upload error:', error)
    throw new Error(`Failed to upload photo: ${error.message}`)
  }

  // Store the relative storage path in public.issues.photo_url
  return path
}

// ─── Create Issue ────────────────────────────────────────────
export async function createIssue(payload: CreateIssuePayload): Promise<Issue> {
  const issueId = uuidv4()
  let photo_path: string | null = null

  if (payload.photo) {
    photo_path = await uploadPhoto(payload.photo, payload.reporter_id, issueId)
  }

  try {
    const { data, error } = await supabase
      .from('issues')
      .insert({
        id: issueId,
        title: payload.title,
        description: payload.description,
        category: payload.category,
        status: 'pending',
        priority: 'medium',
        latitude: payload.latitude,
        longitude: payload.longitude,
        address: payload.address,
        photo_url: photo_path,
        reporter_id: payload.reporter_id,
      })
      .select(`
        *,
        reporter:profiles!reporter_id(id, full_name, avatar_url, role),
        assignee:profiles!assigned_to(id, full_name, avatar_url, role)
      `)
      .single()

    if (error) throw error
    const created = data as Issue
    if (created.photo_url) {
      created.photo_url = await getSignedPhotoUrl(created.photo_url)
    }
    return created
  } catch (err) {
    // Clean up uploaded photo if database insertion fails
    if (photo_path) {
      try {
        await supabase.storage.from('issue-photos').remove([photo_path])
      } catch (cleanupErr) {
        console.warn('Failed to clean up orphaned photo after issue creation failure:', cleanupErr)
      }
    }
    throw err
  }
}

// ─── Fetch Issues ────────────────────────────────────────────
export async function fetchIssues(filters: IssueFilters = {}): Promise<Issue[]> {
  let query = supabase
    .from('issues')
    .select(`
      *,
      reporter:profiles!reporter_id(id, full_name, avatar_url, role),
      assignee:profiles!assigned_to(id, full_name, avatar_url, role)
    `)
    .order('created_at', { ascending: false })

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters.category && filters.category !== 'all') {
    query = query.eq('category', filters.category)
  }
  if (filters.priority && filters.priority !== 'all') {
    query = query.eq('priority', filters.priority)
  }
  if (filters.reporter_id) {
    query = query.eq('reporter_id', filters.reporter_id)
  }
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }

  const limit = filters.limit ?? 50
  const offset = filters.offset ?? 0
  query = query.range(offset, offset + limit - 1)

  const { data, error } = await query
  if (error) throw error
  return hydrateIssuesPhotos((data ?? []) as Issue[])
}

// ─── Fetch Single Issue ──────────────────────────────────────
export async function fetchIssue(id: string): Promise<Issue> {
  const { data, error } = await supabase
    .from('issues')
    .select(`
      *,
      reporter:profiles!reporter_id(id, full_name, avatar_url, role),
      assignee:profiles!assigned_to(id, full_name, avatar_url, role),
      comments:issue_comments(
        *,
        author:profiles!author_id(id, full_name, avatar_url, role)
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  const issue = data as Issue
  if (issue.photo_url) {
    issue.photo_url = await getSignedPhotoUrl(issue.photo_url)
  }
  return issue
}

// ─── Update Issue ────────────────────────────────────────────
export async function updateIssue(id: string, updates: UpdateIssuePayload): Promise<Issue> {
  const { data, error } = await supabase
    .from('issues')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      reporter:profiles!reporter_id(id, full_name, avatar_url, role),
      assignee:profiles!assigned_to(id, full_name, avatar_url, role)
    `)
    .single()

  if (error) throw error
  return data as Issue
}

// ─── Add Comment ─────────────────────────────────────────────
export async function addComment(
  issueId: string,
  authorId: string,
  content: string,
  isInternal = false
): Promise<IssueComment> {
  const { data, error } = await supabase
    .from('issue_comments')
    .insert({ issue_id: issueId, author_id: authorId, content, is_internal: isInternal })
    .select(`*, author:profiles!author_id(id, full_name, avatar_url, role)`)
    .single()

  if (error) throw error
  return data as IssueComment
}

// ─── Fetch Dashboard Stats ───────────────────────────────────
export async function fetchStats() {
  const { data, error } = await supabase
    .from('issues')
    .select('status, priority, category')

  if (error) throw error

  const items = data ?? []
  const stats = {
    total: items.length,
    pending: items.filter((i) => i.status === 'pending').length,
    in_progress: items.filter((i) => i.status === 'in_progress' || i.status === 'assigned').length,
    resolved: items.filter((i) => i.status === 'resolved').length,
    critical: items.filter((i) => i.priority === 'critical').length,
    byCategory: {} as Record<string, number>,
    byStatus: {} as Record<string, number>,
  }

  items.forEach((i) => {
    stats.byCategory[i.category] = (stats.byCategory[i.category] ?? 0) + 1
    stats.byStatus[i.status] = (stats.byStatus[i.status] ?? 0) + 1
  })

  return stats
}

// ─── Fetch Authority Profiles ────────────────────────────────
// Uses get_profiles_public() RPC (SECURITY DEFINER) so that any
// authenticated caller — including citizens — can resolve authority names
// for display, without accessing private profile fields (email, phone).
export async function fetchAuthorities(): Promise<PublicProfile[]> {
  const { data, error } = await supabase.rpc('get_profiles_public', { target_role: 'authority' })
  if (error) throw error
  return (data ?? []) as PublicProfile[]
}
