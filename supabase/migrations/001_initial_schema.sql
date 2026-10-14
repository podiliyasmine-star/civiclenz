-- ============================================================
-- CivicFix Database Schema - Initial Schema (Migration 001)
-- Run this in your Supabase SQL Editor
--
-- APPLICATION ORDER NOTICE:
-- Apply migrations in strict numeric sequence:
--   1. 001_initial_schema.sql
--   2. 002_security_hardening.sql
--
-- Security policies (profile PII restrictions, comment updating, storage)
-- are aligned across both migrations. Applying or re-running 001 establishes
-- strict privacy policies and will NOT re-introduce any broad profile read policies.
-- ============================================================

-- Enable UUID extension (kept for compatibility; tables use gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────
-- PROFILES TABLE
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'authority')),
  phone       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────
-- HELPER FUNCTIONS
-- ──────────────────────────────────────────

-- Helper function to check if the current caller is an authority.
-- Marked SECURITY DEFINER with empty search_path so callers can safely
-- evaluate authority status without triggering RLS recursion on public.profiles.
CREATE OR REPLACE FUNCTION public.is_authority()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (
      SELECT (role = 'authority')
      FROM public.profiles
      WHERE id = (SELECT auth.uid())
    ),
    false
  );
$$;

-- Revoke default public execution privileges and grant only to authenticated and service_role
REVOKE EXECUTE ON FUNCTION public.is_authority() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_authority() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_authority() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_authority() TO service_role;


-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'citizen' -- Hardcoded default: all self-signups are citizens
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- SECURITY: Protect profile fields
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Authenticated users cannot change their role, email, or id
  IF (SELECT auth.role()) = 'authenticated' THEN
    NEW.role = OLD.role;
    NEW.email = OLD.email;
    NEW.id = OLD.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_escalation ON public.profiles;
CREATE TRIGGER prevent_profile_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

-- ──────────────────────────────────────────
-- ISSUES TABLE
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.issues (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,
  category         TEXT NOT NULL CHECK (category IN (
                     'pothole','road_damage','drainage','garbage',
                     'streetlight','water_leakage','footpath','other')),
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                     'pending','assigned','in_progress','resolved','rejected')),
  priority         TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN (
                     'low','medium','high','critical')),
  latitude         DOUBLE PRECISION NOT NULL,
  longitude        DOUBLE PRECISION NOT NULL,
  address          TEXT,
  photo_url        TEXT,
  reporter_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_to      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS issues_updated_at ON public.issues;
CREATE TRIGGER issues_updated_at
  BEFORE UPDATE ON public.issues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- SECURITY FIX: Validate issue creation to prevent privilege escalation on INSERT
CREATE OR REPLACE FUNCTION public.validate_issue_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_is_auth BOOLEAN;
BEGIN
  v_is_auth := public.is_authority();

  IF v_is_auth IS NOT TRUE THEN
    -- Ensure non-authorities cannot create issues with privileged initial state
    NEW.status           := 'pending';
    NEW.priority         := 'medium';
    NEW.assigned_to      := NULL;
    NEW.resolution_notes := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_issue_creation_trigger ON public.issues;
CREATE TRIGGER validate_issue_creation_trigger
  BEFORE INSERT ON public.issues
  FOR EACH ROW EXECUTE FUNCTION public.validate_issue_creation();

-- SECURITY FIX: Protect sensitive issue columns on UPDATE
CREATE OR REPLACE FUNCTION public.protect_issue_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_is_auth BOOLEAN;
BEGIN
  v_is_auth := public.is_authority();
  
  IF v_is_auth IS NOT TRUE THEN
    -- Citizens can only update specific content fields. Revert privileged fields.
    NEW.status           := OLD.status;
    NEW.priority         := OLD.priority;
    NEW.reporter_id      := OLD.reporter_id;
    NEW.assigned_to      := OLD.assigned_to;
    NEW.resolution_notes := OLD.resolution_notes;
    NEW.photo_url        := OLD.photo_url; -- Prevent tampering with evidence
    NEW.created_at       := OLD.created_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_unauthorized_issue_updates ON public.issues;
CREATE TRIGGER prevent_unauthorized_issue_updates
  BEFORE UPDATE ON public.issues
  FOR EACH ROW EXECUTE FUNCTION public.protect_issue_columns();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_issues_status   ON public.issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_category ON public.issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_reporter ON public.issues(reporter_id);
CREATE INDEX IF NOT EXISTS idx_issues_latlong  ON public.issues(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_issues_created  ON public.issues(created_at DESC);

-- ──────────────────────────────────────────
-- ISSUE COMMENTS TABLE
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.issue_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id    UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_issue ON public.issue_comments(issue_id);

-- SECURITY FIX: Protect comment fields on UPDATE
CREATE OR REPLACE FUNCTION public.protect_comment_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_is_auth BOOLEAN;
BEGIN
  v_is_auth := public.is_authority();
  
  IF v_is_auth IS NOT TRUE THEN
    -- Citizens cannot change internal status, author, issue reference, or timestamp
    NEW.is_internal := OLD.is_internal;
    NEW.author_id   := OLD.author_id;
    NEW.issue_id    := OLD.issue_id;
    NEW.created_at  := OLD.created_at;

    -- Defense-in-depth: non-authorities cannot alter internal comment content
    IF OLD.is_internal THEN
      NEW.content := OLD.content;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_unauthorized_comment_updates ON public.issue_comments;
CREATE TRIGGER prevent_unauthorized_comment_updates
  BEFORE UPDATE ON public.issue_comments
  FOR EACH ROW EXECUTE FUNCTION public.protect_comment_columns();

-- ──────────────────────────────────────────
-- STORAGE BUCKET
-- ──────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('issue-photos', 'issue-photos', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- ──────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS) - INITIAL BASELINE
-- ──────────────────────────────────────────

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authority reads any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users manage own profile" ON public.profiles;

-- Privacy-safe profile access: users only read their own full row (including email/phone),
-- while authorities can read any row for operational dispatch.
-- Cross-user public lookups (names/avatars) are handled via get_profiles_public().
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Authority reads any profile" ON public.profiles FOR SELECT
  USING (public.is_authority());

CREATE POLICY "Users manage own profile" ON public.profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id);

-- Issues
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Issues viewable by all authenticated" ON public.issues;
DROP POLICY IF EXISTS "Citizens create issues" ON public.issues;
DROP POLICY IF EXISTS "Reporters update own issues" ON public.issues;
DROP POLICY IF EXISTS "Authority updates any issue" ON public.issues;
DROP POLICY IF EXISTS "Authority delete any issue" ON public.issues;
DROP POLICY IF EXISTS "Reporters delete own pending issues" ON public.issues;

CREATE POLICY "Issues viewable by all authenticated" ON public.issues FOR SELECT
  USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Citizens create issues" ON public.issues FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = reporter_id);

CREATE POLICY "Reporters update own issues" ON public.issues FOR UPDATE
  USING ((SELECT auth.uid()) = reporter_id);

CREATE POLICY "Authority updates any issue" ON public.issues FOR UPDATE
  USING (public.is_authority());

-- Issue Deletions: Authorities can delete any issue; reporters can delete only their own pending issues
CREATE POLICY "Authority delete any issue" ON public.issues FOR DELETE
  USING (public.is_authority());

CREATE POLICY "Reporters delete own pending issues" ON public.issues FOR DELETE
  USING ((SELECT auth.uid()) = reporter_id AND status = 'pending');

-- Comments
ALTER TABLE public.issue_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public comments viewable" ON public.issue_comments;
DROP POLICY IF EXISTS "Auth users create comments" ON public.issue_comments;
DROP POLICY IF EXISTS "Authors update own comments" ON public.issue_comments;
DROP POLICY IF EXISTS "Authors delete own comments" ON public.issue_comments;
DROP POLICY IF EXISTS "Authority delete any comment" ON public.issue_comments;

CREATE POLICY "Public comments viewable" ON public.issue_comments FOR SELECT
  USING (
    NOT is_internal
    OR public.is_authority()
  );

CREATE POLICY "Auth users create comments" ON public.issue_comments FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) = author_id 
    AND (
      NOT is_internal 
      OR public.is_authority()
    )
  );

DROP POLICY IF EXISTS "Authors update own comments" ON public.issue_comments;
DROP POLICY IF EXISTS "Citizens update own public comments" ON public.issue_comments;
DROP POLICY IF EXISTS "Authority updates any comment" ON public.issue_comments;

CREATE POLICY "Citizens update own public comments" ON public.issue_comments
  FOR UPDATE
  USING (
    (SELECT auth.uid()) = author_id
    AND NOT is_internal
  )
  WITH CHECK (
    (SELECT auth.uid()) = author_id
    AND NOT is_internal
  );

CREATE POLICY "Authority updates any comment" ON public.issue_comments
  FOR UPDATE
  USING (public.is_authority())
  WITH CHECK (public.is_authority());

CREATE POLICY "Authors delete own comments" ON public.issue_comments FOR DELETE
  USING ((SELECT auth.uid()) = author_id AND NOT is_internal);

CREATE POLICY "Authority delete any comment" ON public.issue_comments FOR DELETE
  USING (public.is_authority());

-- Storage policies
DROP POLICY IF EXISTS "Authenticated users upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated read photos" ON storage.objects;
DROP POLICY IF EXISTS "Uploaders or authorities delete photos" ON storage.objects;

-- Enforce upload path restriction: user-scoped prefix (auth.uid()/issueId/photo.ext or auth.uid()/photo.ext)
-- Restrict file extension and ensure caller is authenticated.
CREATE POLICY "Authenticated users upload photos" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'issue-photos'
    AND (SELECT auth.role()) = 'authenticated'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    AND (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp'))
  );

CREATE POLICY "Authenticated read photos" ON storage.objects FOR SELECT
  USING (bucket_id = 'issue-photos' AND (SELECT auth.role()) = 'authenticated');

CREATE POLICY "Uploaders or authorities delete photos" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'issue-photos'
    AND (
      (storage.foldername(name))[1] = (SELECT auth.uid())::text
      OR (SELECT auth.uid()) = owner
      OR public.is_authority()
    )
  );
