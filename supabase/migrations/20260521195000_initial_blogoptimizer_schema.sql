create extension if not exists pgcrypto;

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  input_type text not null check (input_type in ('uploaded', 'generated')),
  title text not null,
  body text not null default '',
  source_url text,
  author text,
  target_market text,
  notes text,
  storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.article_briefs (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  topic text not null,
  audience text not null,
  goal text not null,
  target_market text,
  point_of_view text,
  required_talking_points jsonb not null default '[]'::jsonb,
  source_material text,
  tone_notes text,
  approval_state text not null default 'draft' check (approval_state in ('draft', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_conversations (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references public.articles(id) on delete cascade,
  job_id uuid,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  extracted_requirements jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.optimization_jobs (
  id uuid primary key default gen_random_uuid(),
  mode text not null check (mode in ('optimize', 'write')),
  status text not null default 'queued' check (status in ('queued', 'researching', 'drafting', 'reviewing', 'completed', 'failed')),
  article_id uuid not null references public.articles(id) on delete cascade,
  requested_checks jsonb not null default '[]'::jsonb,
  submitter_label text,
  slack_team_id text,
  slack_channel_id text,
  slack_channel_name text,
  slack_user_id text,
  slack_response_url text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.agent_conversations
  add constraint agent_conversations_job_id_fkey
  foreign key (job_id) references public.optimization_jobs(id) on delete cascade;

create table if not exists public.seo_research (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.optimization_jobs(id) on delete cascade,
  provider text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.source_research (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.optimization_jobs(id) on delete cascade,
  provider text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.technical_audits (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.optimization_jobs(id) on delete cascade,
  provider text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.optimization_jobs(id) on delete cascade,
  model text not null,
  prompt_version text not null default 'v1',
  score integer check (score between 0 and 100),
  summary text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.review_decisions (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null references public.recommendations(id) on delete cascade,
  field_key text not null,
  decision text not null check (decision in ('approved', 'rejected', 'needs_revision')),
  comment text,
  reviewer_label text,
  created_at timestamptz not null default now()
);

create index if not exists articles_created_at_idx on public.articles(created_at desc);
create index if not exists optimization_jobs_created_at_idx on public.optimization_jobs(created_at desc);
create index if not exists optimization_jobs_status_idx on public.optimization_jobs(status);
create index if not exists optimization_jobs_article_id_idx on public.optimization_jobs(article_id);
create index if not exists recommendations_job_id_idx on public.recommendations(job_id);

alter table public.articles enable row level security;
alter table public.article_briefs enable row level security;
alter table public.agent_conversations enable row level security;
alter table public.optimization_jobs enable row level security;
alter table public.seo_research enable row level security;
alter table public.source_research enable row level security;
alter table public.technical_audits enable row level security;
alter table public.recommendations enable row level security;
alter table public.review_decisions enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'article-drafts',
  'article-drafts',
  false,
  10485760,
  array['text/plain', 'text/markdown', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do nothing;
