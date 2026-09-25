-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new
-- Creates the admin_xp_adjustments table for the XP & Audit Logs admin panel

CREATE TABLE IF NOT EXISTS public.admin_xp_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  admin_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  xp_before INTEGER,
  xp_after INTEGER,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.admin_xp_adjustments ENABLE ROW LEVEL SECURITY;

-- Allow service_role (backend) to do everything
DROP POLICY IF EXISTS "Service role full access on admin_xp_adjustments" ON public.admin_xp_adjustments;
CREATE POLICY "Service role full access on admin_xp_adjustments"
  ON public.admin_xp_adjustments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create index for faster lookup by target profile
CREATE INDEX IF NOT EXISTS idx_admin_xp_adj_target ON public.admin_xp_adjustments(target_profile_id);
CREATE INDEX IF NOT EXISTS idx_admin_xp_adj_timestamp ON public.admin_xp_adjustments("timestamp" DESC);
