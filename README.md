# P11 Buzz Optimizer

Standalone internal app for SEO/GEO blog optimization and GPT-5-assisted article creation.

## Stack

- TypeScript/Next.js web app in `apps/web`
- Python/FastAPI worker in `apps/worker`
- Shared TypeScript schemas in `packages/shared`
- Supabase project `blogopt` (`fbngjqshhuzsldjgsvlj`) for Postgres and private storage
- Slack slash commands for command and notification workflows
- GPT-5, SEMrush, Screaming Frog, and a configurable web search provider for research-backed recommendations

## Local Development

1. Copy `.env.example` to `.env` and fill in the required values.
2. Install web dependencies:

```bash
npm install
```

3. Run the web app:

```bash
npm run dev
```

4. Run the worker in a second terminal:

```bash
cd apps/worker
python -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn blogoptimizer_worker.main:app --reload --app-dir src
```

## Supabase

Schema migrations live in `supabase/migrations`. The remote project has already been initialized through Supabase MCP.

The app intentionally does not use Supabase Auth. All database access is server-side with the service role key. RLS is enabled on public tables with explicit deny-all policies for `anon` and `authenticated`.

## Main Workflows

- Existing draft optimization: upload title/body/source URL from the dashboard.
- Novel article creation: use `/write` to have a GPT-5 briefing conversation and launch the draft pipeline.
- Slack commands: configure `/buzz-optimize` and `/buzz-write` to point at `/api/slack/commands`.
- Export: download a Markdown review from each job page.
