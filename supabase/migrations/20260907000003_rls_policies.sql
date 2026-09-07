-- Migration: 20260907000003_rls_policies.sql
-- Description: Row Level Security (RLS) policies and authorization helper functions

-- 1. Helper functions
create or replace function current_clerk_user_id() returns text as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '');
$$ language sql stable;

create or replace function current_profile_id() returns uuid as $$
  select id from profiles where clerk_user_id = current_clerk_user_id() limit 1;
$$ language sql stable security definer;

create or replace function has_event_role(p_event_id uuid, p_role member_role) returns boolean as $$
  select exists (
    select 1 from event_members em
    where em.event_id = p_event_id
      and em.profile_id = current_profile_id()
      and (
        em.role = p_role
        or (p_role = 'staff' and em.role in ('admin', 'super_admin'))
        or (p_role = 'admin' and em.role = 'super_admin')
      )
  );
$$ language sql stable security definer;

create or replace function is_event_member(p_event_id uuid) returns boolean as $$
  select exists (
    select 1 from event_members em
    where em.event_id = p_event_id and em.profile_id = current_profile_id()
  );
$$ language sql stable security definer;

-- 2. Enable RLS on all tables
alter table events enable row level security;
alter table profiles enable row level security;
alter table event_members enable row level security;
alter table sponsors enable row level security;
alter table zones enable row level security;
alter table experiences enable row level security;
alter table qr_codes enable row level security;
alter table wallets enable row level security;
alter table wallet_transactions enable row level security;
alter table levels enable row level security;
alter table experience_completions enable row level security;
alter table quests enable row level security;
alter table quest_progress enable row level security;
alter table achievements enable row level security;
alter table user_achievements enable row level security;
alter table rewards enable row level security;
alter table reward_redemptions enable row level security;
alter table sponsor_interactions enable row level security;
alter table staff_members enable row level security;
alter table staff_zone_assignments enable row level security;
alter table analytics_events enable row level security;
alter table notifications enable row level security;
alter table media_assets enable row level security;
alter table audit_logs enable row level security;

-- 3. Profiles policies
create policy "Users can read their own profile"
  on profiles for select
  using (clerk_user_id = current_clerk_user_id() or exists (select 1 from event_members where role in ('admin', 'super_admin') and profile_id = current_profile_id()));

create policy "Users can update their own profile"
  on profiles for update
  using (clerk_user_id = current_clerk_user_id())
  with check (clerk_user_id = current_clerk_user_id());

-- 4. Events policies
create policy "Anyone authenticated can view active events"
  on events for select
  using (status in ('live', 'draft') or has_event_role(id, 'admin'));

-- 5. Event Members policies
create policy "Members can view their own membership or admins can view all"
  on event_members for select
  using (profile_id = current_profile_id() or has_event_role(event_id, 'admin'));

-- 6. Zones & Experiences & Levels & Sponsors (Public within event)
create policy "Read zones for event members"
  on zones for select
  using (is_active or has_event_role(event_id, 'staff'));

create policy "Read experiences for event members"
  on experiences for select
  using (is_active or has_event_role(event_id, 'staff'));

create policy "Read levels for event members"
  on levels for select
  using (true);

create policy "Read sponsors for event members"
  on sponsors for select
  using (is_active or has_event_role(event_id, 'admin'));

-- 7. Wallets & Ledger (Strictly Read-only to Attendees; Mutations via security definer RPC only)
create policy "Users can only read their own wallet"
  on wallets for select
  using (profile_id = current_profile_id() or has_event_role(event_id, 'admin'));

create policy "Users can only read their own wallet transactions"
  on wallet_transactions for select
  using (profile_id = current_profile_id() or has_event_role(event_id, 'admin'));

-- 8. Completions, Quests, Achievements
create policy "Users can read their own experience completions"
  on experience_completions for select
  using (profile_id = current_profile_id() or has_event_role(event_id, 'staff'));

create policy "Read quests for event"
  on quests for select
  using (is_active or has_event_role(event_id, 'admin'));

create policy "Users can read own quest progress"
  on quest_progress for select
  using (profile_id = current_profile_id() or has_event_role(event_id, 'admin'));

create policy "Read achievements for event"
  on achievements for select
  using (is_active or has_event_role(event_id, 'admin'));

create policy "Users can read own achievements"
  on user_achievements for select
  using (profile_id = current_profile_id() or has_event_role(event_id, 'admin'));

-- 9. Rewards & Redemptions
create policy "Read active rewards"
  on rewards for select
  using (is_active or has_event_role(event_id, 'admin'));

create policy "Users can read their own reward redemptions"
  on reward_redemptions for select
  using (profile_id = current_profile_id() or has_event_role(event_id, 'staff'));

-- 10. Notifications
create policy "Users can read and update their own notifications"
  on notifications for all
  using (profile_id = current_profile_id());

-- 11. Audit logs (Admin only)
create policy "Admins can view audit logs"
  on audit_logs for select
  using (has_event_role(event_id, 'admin'));
