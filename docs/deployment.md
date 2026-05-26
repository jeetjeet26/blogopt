# Deployment Runbook

## Web App

Deploy the root repo to the `blogopt-p11` Heroku app:

```bash
git push heroku main
```

Required environment variables:

- `NEXT_PUBLIC_APP_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `WORKER_API_URL`
- `WORKER_API_TOKEN`
- `SLACK_SIGNING_SECRET`
- `SLACK_BOT_TOKEN`

Recommended internal access controls:

- Keep the app behind Vercel password protection, an allowlisted network, or another lightweight internal gate.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to browser code.
- Do not add Supabase Auth unless the app later needs named users, roles, or external access.

## Worker

Deploy the worker subtree to the `blogopt-p11-worker` Heroku app:

```bash
git subtree push --prefix apps/worker heroku-worker main
```

Required worker environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_SEARCH_MODEL`
- `WORKER_API_TOKEN`
- `SEMRUSH_API_KEY`
- `SCREAMING_FROG_API_URL`
- `SCREAMING_FROG_API_KEY`

Optional fallback web search provider variables:

- `WEB_SEARCH_API_URL`
- `WEB_SEARCH_API_KEY`

## Slack

Create slash commands:

- `/buzz-optimize`
- `/buzz-write`

Set each request URL to:

```text
https://YOUR_APP_DOMAIN/api/slack/commands
```

## Supabase

Project:

```text
fbngjqshhuzsldjgsvlj
```

Use Supabase MCP for database changes. After schema changes, run security and performance advisors. New-table unused-index warnings are expected until production traffic uses the app.

## Operational Checks

- Web app health: open `/settings`.
- Worker health: open `GET /health` on the worker host.
- Slack health: run `/buzz-optimize latest`.
- Pipeline health: create a test article and confirm the job moves from `queued` to `completed`.
