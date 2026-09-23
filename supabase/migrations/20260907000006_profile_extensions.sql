-- ============================================================================
-- VIBE 2026 — Profile Extended Fields Migration
-- Adds extended profile attributes to Postgres so that bio, username,
-- interests, avatar_url, and academic details persist permanently in Supabase.
-- ============================================================================

-- 1. Add extended columns to profiles table if they do not exist
alter table profiles add column if not exists username text;
alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists course_year text;
alter table profiles add column if not exists city text;
alter table profiles add column if not exists bio text;
alter table profiles add column if not exists interests text[] default '{}';
alter table profiles add column if not exists skills text[] default '{}';
alter table profiles add column if not exists hobbies text[] default '{}';
alter table profiles add column if not exists profile_completed boolean default false;
alter table profiles add column if not exists is_discoverable boolean default true;
alter table profiles add column if not exists xp integer default 100 check (xp >= 0);
alter table profiles add column if not exists level_number integer default 1 check (level_number >= 1);
alter table profiles add column if not exists level_name text default 'VIBE NEWBIE';

-- 2. Ensure case-insensitive unique constraint on username if provided
create unique index if not exists idx_profiles_username_lower
  on profiles (lower(username))
  where username is not null;

-- 3. Index on college and club for discoverability
create index if not exists idx_profiles_college on profiles(college);
create index if not exists idx_profiles_club on profiles(club);
