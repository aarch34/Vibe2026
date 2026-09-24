-- ============================================================================
-- VIBE 2026 — Migration 007: Complete Social Features
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Safe to run multiple times (uses IF NOT EXISTS / DO $$ blocks)
-- ============================================================================

-- ============================================================
-- SECTION 1: Profile Extended Columns (idempotent additions)
-- ============================================================

alter table profiles add column if not exists username text;
alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists course_year text;
alter table profiles add column if not exists city text;
alter table profiles add column if not exists bio text;
alter table profiles add column if not exists interests text[] default '{}';
alter table profiles add column if not exists skills text[] default '{}';
alter table profiles add column if not exists hobbies text[] default '{}';
alter table profiles add column if not exists instagram_username text;
alter table profiles add column if not exists rotaract_club text;
alter table profiles add column if not exists profile_completed boolean default false;
alter table profiles add column if not exists is_discoverable boolean default true;
alter table profiles add column if not exists xp integer default 100 check (xp >= 0);
alter table profiles add column if not exists level_number integer default 1 check (level_number >= 1);
alter table profiles add column if not exists level_name text default 'VIBE NEWBIE';
alter table profiles add column if not exists connections_count integer default 0 check (connections_count >= 0);
alter table profiles add column if not exists posts_count integer default 0 check (posts_count >= 0);
alter table profiles add column if not exists games_played_count integer default 0 check (games_played_count >= 0);

create unique index if not exists idx_profiles_username_lower
  on profiles (lower(username))
  where username is not null;

create index if not exists idx_profiles_college on profiles(college);
create index if not exists idx_profiles_club on profiles(club);
create index if not exists idx_profiles_discoverable on profiles(is_discoverable) where is_discoverable = true;
create index if not exists idx_profiles_xp on profiles(xp desc);

-- ============================================================
-- SECTION 2: Social Posts Table
-- ============================================================

create table if not exists posts (
  id text primary key default gen_random_uuid()::text,
  author_id uuid not null references profiles(id) on delete cascade,
  caption text,
  image_url text,
  likes_count integer not null default 0 check (likes_count >= 0),
  comments_count integer not null default 0 check (comments_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_posts_author on posts(author_id);
create index if not exists idx_posts_created on posts(created_at desc);

-- ============================================================
-- SECTION 3: Post Likes Table
-- ============================================================

create table if not exists post_likes (
  id text primary key default gen_random_uuid()::text,
  post_id text not null references posts(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(post_id, profile_id)
);

create index if not exists idx_post_likes_post on post_likes(post_id);
create index if not exists idx_post_likes_profile on post_likes(profile_id);

-- ============================================================
-- SECTION 4: Post Comments Table
-- ============================================================

create table if not exists post_comments (
  id text primary key default gen_random_uuid()::text,
  post_id text not null references posts(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  comment text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_post_comments_post on post_comments(post_id, created_at asc);
create index if not exists idx_post_comments_profile on post_comments(profile_id);

-- ============================================================
-- SECTION 5: Connection Requests Table
-- ============================================================

create table if not exists connection_requests (
  id text primary key default gen_random_uuid()::text,
  sender_id uuid not null references profiles(id) on delete cascade,
  receiver_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_pending_request unique (sender_id, receiver_id)
);

create index if not exists idx_conn_req_receiver_pending on connection_requests(receiver_id, status) where status = 'pending';
create index if not exists idx_conn_req_sender on connection_requests(sender_id);

-- ============================================================
-- SECTION 6: Connections Table (Accepted Friendships)
-- ============================================================

create table if not exists connections (
  id text primary key default gen_random_uuid()::text,
  user_id_1 uuid not null references profiles(id) on delete cascade,
  user_id_2 uuid not null references profiles(id) on delete cascade,
  connected_at timestamptz not null default now(),
  unique(user_id_1, user_id_2)
);

create index if not exists idx_connections_user1 on connections(user_id_1);
create index if not exists idx_connections_user2 on connections(user_id_2);

-- ============================================================
-- SECTION 7: Extend Notifications Table
-- ============================================================

alter table notifications add column if not exists link text;
alter table notifications add column if not exists read boolean not null default false;
alter table notifications add column if not exists message text;

-- Safe rename body -> message only if body exists and message does not
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'notifications' and column_name = 'body'
  ) and not exists (
    select 1 from information_schema.columns
    where table_name = 'notifications' and column_name = 'message'
  ) then
    alter table notifications rename column body to message;
  end if;
exception when others then
  null;
end $$;

create index if not exists idx_notifications_profile_unread on notifications(profile_id, read) where read = false;
create index if not exists idx_notifications_profile_time on notifications(profile_id, created_at desc);

-- ============================================================
-- SECTION 8: XP Transactions Log
-- ============================================================

create table if not exists xp_transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  amount integer not null,
  reason text not null,
  source_type text,
  source_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_xp_tx_profile on xp_transactions(profile_id, created_at desc);

-- ============================================================
-- SECTION 9: DPDP Act 2023 Compliance Tables
-- ============================================================

-- 9a. Consent Register (Section 6)
create table if not exists dpdp_consent_register (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  consent_version text not null default 'v1.0',
  purpose text not null,
  granted boolean not null default true,
  ip_address text,
  user_agent text,
  granted_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  unique(profile_id, purpose, consent_version)
);

create index if not exists idx_dpdp_consent_profile on dpdp_consent_register(profile_id);

-- 9b. Data Erasure Requests (Section 12)
create table if not exists dpdp_erasure_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  requested_at timestamptz not null default now(),
  reason text,
  status text not null default 'pending' check (status in ('pending', 'completed', 'rejected')),
  completed_at timestamptz,
  processed_by uuid references profiles(id) on delete set null,
  notes text
);

create index if not exists idx_erasure_status on dpdp_erasure_requests(status, requested_at);

-- 9c. Grievance Register (Section 13)
create table if not exists dpdp_grievances (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  description text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  submitted_at timestamptz not null default now(),
  resolved_at timestamptz,
  response_note text
);

create index if not exists idx_grievance_profile on dpdp_grievances(profile_id, submitted_at desc);

-- 9d. Nominee Designations (Section 14)
create table if not exists dpdp_nominees (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  nominee_name text not null,
  nominee_email text not null,
  nominee_relationship text,
  designated_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id)
);

-- ============================================================
-- SECTION 10: Like-XP Dedup Table
-- ============================================================

create table if not exists awarded_like_xp (
  post_id text not null,
  profile_id uuid not null references profiles(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);

-- ============================================================
-- SECTION 11: Row Level Security (RLS) Policies
-- ============================================================

alter table posts enable row level security;
alter table post_likes enable row level security;
alter table post_comments enable row level security;
alter table connection_requests enable row level security;
alter table connections enable row level security;
alter table xp_transactions enable row level security;
alter table dpdp_consent_register enable row level security;
alter table dpdp_erasure_requests enable row level security;
alter table dpdp_grievances enable row level security;
alter table dpdp_nominees enable row level security;
alter table awarded_like_xp enable row level security;

-- POSTS: Everyone can read; only owner can create/delete
drop policy if exists "posts_select_all" on posts;
create policy "posts_select_all" on posts for select using (true);

drop policy if exists "posts_insert_own" on posts;
create policy "posts_insert_own" on posts for insert
  with check (author_id = (select id from profiles where clerk_user_id = auth.uid()::text limit 1));

drop policy if exists "posts_delete_own" on posts;
create policy "posts_delete_own" on posts for delete
  using (author_id = (select id from profiles where clerk_user_id = auth.uid()::text limit 1));

-- POST LIKES
drop policy if exists "likes_select_all" on post_likes;
create policy "likes_select_all" on post_likes for select using (true);

drop policy if exists "likes_insert_own" on post_likes;
create policy "likes_insert_own" on post_likes for insert
  with check (profile_id = (select id from profiles where clerk_user_id = auth.uid()::text limit 1));

drop policy if exists "likes_delete_own" on post_likes;
create policy "likes_delete_own" on post_likes for delete
  using (profile_id = (select id from profiles where clerk_user_id = auth.uid()::text limit 1));

-- POST COMMENTS
drop policy if exists "comments_select_all" on post_comments;
create policy "comments_select_all" on post_comments for select using (true);

drop policy if exists "comments_insert_own" on post_comments;
create policy "comments_insert_own" on post_comments for insert
  with check (profile_id = (select id from profiles where clerk_user_id = auth.uid()::text limit 1));

-- CONNECTION REQUESTS
drop policy if exists "conn_req_select_own" on connection_requests;
create policy "conn_req_select_own" on connection_requests for select
  using (
    sender_id = (select id from profiles where clerk_user_id = auth.uid()::text limit 1)
    or receiver_id = (select id from profiles where clerk_user_id = auth.uid()::text limit 1)
  );

drop policy if exists "conn_req_insert_own" on connection_requests;
create policy "conn_req_insert_own" on connection_requests for insert
  with check (sender_id = (select id from profiles where clerk_user_id = auth.uid()::text limit 1));

drop policy if exists "conn_req_update_receiver" on connection_requests;
create policy "conn_req_update_receiver" on connection_requests for update
  using (receiver_id = (select id from profiles where clerk_user_id = auth.uid()::text limit 1));

-- CONNECTIONS
drop policy if exists "connections_select_own" on connections;
create policy "connections_select_own" on connections for select
  using (
    user_id_1 = (select id from profiles where clerk_user_id = auth.uid()::text limit 1)
    or user_id_2 = (select id from profiles where clerk_user_id = auth.uid()::text limit 1)
  );

-- XP TRANSACTIONS
drop policy if exists "xp_tx_select_own" on xp_transactions;
create policy "xp_tx_select_own" on xp_transactions for select
  using (profile_id = (select id from profiles where clerk_user_id = auth.uid()::text limit 1));

-- DPDP TABLES: Users see only their own data
drop policy if exists "dpdp_consent_own" on dpdp_consent_register;
create policy "dpdp_consent_own" on dpdp_consent_register for all
  using (profile_id = (select id from profiles where clerk_user_id = auth.uid()::text limit 1));

drop policy if exists "dpdp_erasure_own" on dpdp_erasure_requests;
create policy "dpdp_erasure_own" on dpdp_erasure_requests for all
  using (profile_id = (select id from profiles where clerk_user_id = auth.uid()::text limit 1));

drop policy if exists "dpdp_grievance_own" on dpdp_grievances;
create policy "dpdp_grievance_own" on dpdp_grievances for all
  using (profile_id = (select id from profiles where clerk_user_id = auth.uid()::text limit 1));

drop policy if exists "dpdp_nominee_own" on dpdp_nominees;
create policy "dpdp_nominee_own" on dpdp_nominees for all
  using (profile_id = (select id from profiles where clerk_user_id = auth.uid()::text limit 1));

-- ============================================================
-- SECTION 12: Auto updated_at triggers
-- ============================================================

create or replace function fn_update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_posts_updated_at on posts;
create trigger trg_posts_updated_at
  before update on posts
  for each row execute function fn_update_updated_at();

drop trigger if exists trg_conn_req_updated_at on connection_requests;
create trigger trg_conn_req_updated_at
  before update on connection_requests
  for each row execute function fn_update_updated_at();

drop trigger if exists trg_nominee_updated_at on dpdp_nominees;
create trigger trg_nominee_updated_at
  before update on dpdp_nominees
  for each row execute function fn_update_updated_at();

-- ============================================================
-- DONE! All social features, DPDP compliance tables, RLS
-- policies and indexes are now applied. ✅
-- ============================================================
