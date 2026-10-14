-- ============================================================
-- CivicFix Security Hardening - Migration 002
-- Apply in Supabase SQL Editor AFTER 001_initial_schema.sql.
-- Safe to rerun: every statement is idempotent.
-- DO NOT execute against the live database without testing first.
--
-- APPLICATION ORDER NOTICE:
-- Apply migrations in strict numeric sequence:
--   1. 001_initial_schema.sql
--   2. 002_security_hardening.sql
--
-- Migration 002 is fully idempotent and reinforces profile privacy,
-- creates the get_profiles_public() RPC, and enforces storage safeguards.
-- ============================================================

-- ──────────────────────────────────────────────────────────────────────────
-- PRE-REQUISITE: Ensure is_authority() helper exists and is secured
--
-- This function runs as SECURITY DEFINER with an empty search path.
-- Querying public.profiles from within an RLS policy directly causes
-- PostgreSQL error: "infinite recursion detected in policy for relation profiles".
-- By evaluating the role through this SECURITY DEFINER function, RLS on
-- public.profiles is safely bypassed during the role check.
-- ──────────────────────────────────────────────────────────────────────────
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

REVOKE EXECUTE ON FUNCTION public.is_authority() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_authority() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_authority() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_authority() TO service_role;


-- ──────────────────────────────────────────────────────────────────────────
-- FIX 1: Restrict profile reads — citizens must not see other users' PII
--
-- Root problem in 001 baseline:
--   Policy "Profiles viewable by authenticated users" grants SELECT on ALL
--   columns (including email and phone) of all rows to every authenticated user.
--
-- Strategy:
--   a) Drop the broad policy from 001.
--   b) Users read only their own full profile row.
--   c) Authorities read any profile row (they need contact details for dispatch).
--      Uses public.is_authority() to completely prevent infinite recursion.
--   d) For public cross-user directory / assignment lookups, expose only safe
--      public fields (id, full_name, avatar_url, role, created_at, updated_at)
--      via get_profiles_public(). Optional role parameter avoids full-directory dumps.
-- ──────────────────────────────────────────────────────────────────────────

-- ── 1a: Drop old and any previously created policies so reruns are safe ──
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users read own profile"                   ON public.profiles;
DROP POLICY IF EXISTS "Authority reads any profile"              ON public.profiles;

-- ── 1b: Owner reads their own full row (all columns, including email/phone) ──
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT
  USING ((SELECT auth.uid()) = id);

-- ── 1c: Authorities read any full row (avoids recursion via is_authority()) ──
CREATE POLICY "Authority reads any profile" ON public.profiles
  FOR SELECT
  USING (public.is_authority());

-- ── 1d: Remove the plain (invoker) view if present from any earlier draft ──
DROP VIEW IF EXISTS public.profiles_public;

-- ── 1e: SECURITY DEFINER function — safe public profile lookup ──
--
-- Security properties:
--   • SET search_path = '' prevents search-path hijacking; all objects are schema-qualified.
--   • SECURITY DEFINER allows retrieving safe profile columns for UI display
--     (such as resolving authority assignee names or reporter names).
--   • Parameter target_role defaults to NULL (all public profiles), but allows
--     filtering (e.g. target_role := 'authority') to avoid full directory exposure.
--   • Sensitive columns (email, phone) are structurally excluded from the return table.
--   • Executable only by authenticated callers and service_role.
--
-- Frontend usage:
--   const { data } = await supabase.rpc('get_profiles_public', { target_role: 'authority' });
CREATE OR REPLACE FUNCTION public.get_profiles_public(target_role TEXT DEFAULT NULL)
RETURNS TABLE(
  id         UUID,
  full_name  TEXT,
  avatar_url TEXT,
  role       TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    p.role,
    p.created_at,
    p.updated_at
  FROM public.profiles AS p
  WHERE (target_role IS NULL OR p.role = target_role);
$$;

REVOKE EXECUTE ON FUNCTION public.get_profiles_public(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_profiles_public(TEXT) FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_profiles_public(TEXT) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.get_profiles_public(TEXT) TO service_role;


-- ──────────────────────────────────────────────────────────────────────────
-- FIX 2: Split comment UPDATE policy — citizens cannot edit internal comments;
--         authorities can update any comment.
-- ──────────────────────────────────────────────────────────────────────────

-- ── 2a: Drop old and previously created policies so reruns are safe ──
DROP POLICY IF EXISTS "Authors update own comments"         ON public.issue_comments;
DROP POLICY IF EXISTS "Citizens update own public comments" ON public.issue_comments;
DROP POLICY IF EXISTS "Authority updates any comment"       ON public.issue_comments;

-- ── 2b: Citizens update their own, non-internal comments only ──
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

-- ── 2c: Authorities update any comment (avoids recursion via is_authority()) ──
CREATE POLICY "Authority updates any comment" ON public.issue_comments
  FOR UPDATE
  USING (public.is_authority())
  WITH CHECK (public.is_authority());


-- ──────────────────────────────────────────────────────────────────────────
-- FIX 3: Strengthen protect_comment_columns trigger (Defence-in-depth)
--
-- Locks is_internal, author_id, issue_id, created_at, and content (for internal comments)
-- if called by a non-authority.
-- ──────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.protect_comment_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_is_auth BOOLEAN;
BEGIN
  v_is_auth := public.is_authority();

  -- Treat NULL or false as non-authority
  IF v_is_auth IS NOT TRUE THEN
    -- Always lock structural columns for non-authority callers
    NEW.is_internal := OLD.is_internal;
    NEW.author_id   := OLD.author_id;
    NEW.issue_id    := OLD.issue_id;
    NEW.created_at  := OLD.created_at;

    -- Also lock content when the comment is internal
    IF OLD.is_internal THEN
      NEW.content := OLD.content;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


-- ──────────────────────────────────────────────────────────────────────────
-- FIX 4: Strengthen storage upload restrictions & cleanup permissions
-- ──────────────────────────────────────────────────────────────────────────
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

-- Keep issue photos restricted to authenticated users
CREATE POLICY "Authenticated read photos" ON storage.objects FOR SELECT
  USING (bucket_id = 'issue-photos' AND (SELECT auth.role()) = 'authenticated');

-- Allow the object uploader (by folder prefix or owner) or an authority to delete the photo
CREATE POLICY "Uploaders or authorities delete photos" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'issue-photos'
    AND (
      (storage.foldername(name))[1] = (SELECT auth.uid())::text
      OR (SELECT auth.uid()) = owner
      OR public.is_authority()
    )
  );
