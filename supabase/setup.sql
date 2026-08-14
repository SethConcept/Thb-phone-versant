-- THB Phone Academy (Versant) — Supabase setup.
-- Run this ONCE in the SQL Editor of this app's dedicated Supabase project.
-- Do NOT run it against the HR voice-screen project's database.

create table candidates (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  role_applied text not null,
  status text not null default 'invited',
    -- invited | interviewed | scored | certified | passed | failed
  mode text not null default 'training',
    -- 'training' (Versant certification) | 'sales' (John practice call)
  difficulty text not null default 'easy',
    -- 'easy' | 'hard' (sales mode only)
  interview_token uuid unique default gen_random_uuid(),
  token_expires_at timestamptz default now() + interval '7 days',
    -- the app inserts NULL for training trainees = link never expires
  created_at timestamptz default now()
);

create table interviews (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references candidates(id) not null,
  consent_given boolean not null default false,
  consent_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  transcript jsonb,          -- [{role: 'agent'|'candidate', text, ts}]
  audio_url text,            -- storage path in interview-audio bucket
  completed boolean default false,
  candidate_notes text,      -- trainee's own prep notes (sales mode)
  exam_meta jsonb            -- training draw: {kind:'versant', partB, partC, persona}
);

create table scores (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid references interviews(id) not null,
  -- shared
  knockout boolean not null default false,
  knockout_reason text,
  verdict text,              -- PASS | BORDERLINE | FAIL
  scored_by text not null default 'ai',  -- 'ai' or reviewer email
  notes text,
  created_at timestamptz default now(),
  -- Versant training: full structured breakdown from the grader
  detail jsonb,              -- {part_a, part_b[], part_c[], part_d, hard_fails[], ...}
  -- sales practice ("John") categories
  outcome text,              -- INTERESTED | NOT_INTERESTED | INCOMPLETE
  warmth int,
  clarity int,
  confidence int,
  professionalism int,
  conversational int,
  completeness int,          -- training reuses this as Part D criteria count
  ending_handling int
);

-- Lock everything down. The app's server routes use the service-role key
-- (bypasses RLS). Logged-in admins get full read/write.
alter table candidates enable row level security;
alter table interviews enable row level security;
alter table scores enable row level security;

create policy "admins full access" on candidates
  for all to authenticated using (true) with check (true);
create policy "admins full access" on interviews
  for all to authenticated using (true) with check (true);
create policy "admins full access" on scores
  for all to authenticated using (true) with check (true);

-- Storage: create a PRIVATE bucket named `interview-audio` in the dashboard
-- (Storage -> New bucket -> uncheck "public"). Server uploads via service
-- role; admin playback uses signed URLs.
