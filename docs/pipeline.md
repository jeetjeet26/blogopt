# SEO/GEO Pipeline

The worker supports two modes:

- `optimize`: reviews an uploaded article draft.
- `write`: turns a conversational brief into a researched draft and then reviews it.

Pipeline stages:

1. Load the job, article, and optional brief from Supabase.
2. Fetch SEMrush keyword opportunities for the article topic.
3. Fetch supplemental web sources with OpenAI Responses API web search. If that returns no sources
   and a separate provider is configured, fall back to `WEB_SEARCH_API_URL`.
4. Fetch technical SEO signals from the configured Screaming Frog API.
5. Persist raw research artifacts in `seo_research`, `source_research`, and `technical_audits`.
6. Ask GPT-5 for strict JSON recommendations. In write mode, the primary artifact is multiple
   full article drafts with distinct strategic emphasis; in optimize mode, the payload includes
   side-by-side metadata, slug, keyword, GEO, schema, internal-link, and source guidance.
7. Persist the recommendation payload and mark the job complete.

Adapters intentionally return safe fallbacks when optional providers are not configured. GPT-5 calls still require `OPENAI_API_KEY`.
