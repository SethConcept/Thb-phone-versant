-- Learning path upgrade — run ONCE in the SQL Editor if you already ran an
-- earlier setup.sql. (Fresh projects: setup.sql now includes all of this.)

create table if not exists module_progress (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references candidates(id) not null,
  module_id text not null,            -- m1..m8
  quiz_score int,
  quiz_total int,
  quiz_passed boolean not null default false,
  drill_passed boolean not null default false,
  drill_interview_id uuid references interviews(id),
  updated_at timestamptz default now(),
  unique (candidate_id, module_id)
);

alter table module_progress enable row level security;
create policy "admins full access" on module_progress
  for all to authenticated using (true) with check (true);

alter table candidates
  add column if not exists skip_modules boolean not null default false;
    -- admin override: lets a trainee take the full test without finishing
    -- the learning path (used for dry runs and re-certification)
