-- Upgrade: site-wide admin unlock.
-- Run ONCE in the SQL Editor of this app's Supabase project (safe to
-- re-run). Adds the app_settings table the global unlock flag lives in:
-- entering ADMIN_UNLOCK_CODE anywhere then unlocks all content for
-- EVERYONE (every device, every trainee link) until it's locked again.

create table if not exists app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

alter table app_settings enable row level security;

drop policy if exists "admins full access" on app_settings;
create policy "admins full access" on app_settings
  for all to authenticated using (true) with check (true);
