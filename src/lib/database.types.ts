export type IssueStatus = 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'rejected'
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical'
export type IssueCategory =
  | 'pothole'
  | 'road_damage'
  | 'drainage'
  | 'garbage'
  | 'streetlight'
  | 'water_leakage'
  | 'footpath'
  | 'other'

export type UserRole = 'citizen' | 'authority'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  phone: string | null
  created_at: string
  updated_at: string
}

/**
 * Public profile fields returned by the `get_profiles_public()` RPC.
 * Does NOT contain email or phone — safe to use for cross-user display
 * (reporter names, assignee names, comment authors).
 */
export interface PublicProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Issue {
  id: string
  title: string
  description: string
  category: IssueCategory
  status: IssueStatus
  priority: IssuePriority
  latitude: number
  longitude: number
  address: string | null
  photo_url: string | null
  reporter_id: string
  assigned_to: string | null
  resolution_notes: string | null
  created_at: string
  updated_at: string
  // Joined fields — populated via PostgREST FK joins (no email/phone)
  reporter?: PublicProfile
  assignee?: PublicProfile
  comments?: IssueComment[]
}

export interface IssueComment {
  id: string
  issue_id: string
  author_id: string
  content: string
  is_internal: boolean
  created_at: string
  // Joined field — populated via PostgREST FK join (no email/phone)
  author?: PublicProfile
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      issues: {
        Row: Issue
        Insert: Omit<Issue, 'id' | 'created_at' | 'updated_at' | 'reporter' | 'assignee' | 'comments'>
        Update: Partial<Omit<Issue, 'id' | 'created_at' | 'reporter' | 'assignee' | 'comments'>>
      }
      issue_comments: {
        Row: IssueComment
        Insert: Omit<IssueComment, 'id' | 'created_at' | 'author'>
        Update: Partial<Omit<IssueComment, 'id' | 'created_at'>>
      }
    }
  }
}
