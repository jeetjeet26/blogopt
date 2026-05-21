# SEO/GEO Pipeline

The worker supports two modes:

- `optimize`: reviews an uploaded article draft.
- `write`: turns a conversational brief into a researched draft and then reviews it.

Pipeline stages:

1. Load the job, article, and optional brief from Supabase.
2. Fetch SEMrush keyword opportunities for the article topic.
3. Fetch supplemental web sources from the configured web search provider.
4. Fetch technical SEO signals from the configured Screaming Frog API.
5. Persist raw research artifacts in `seo_research`, `source_research`, and `technical_audits`.
6. Ask GPT-5 for strict JSON recommendations that include side-by-side metadata, slug, keyword, GEO, schema, internal-link, and source guidance.
7. Persist the recommendation payload and mark the job complete.

Adapters intentionally return safe fallbacks when optional providers are not configured. GPT-5 calls still require `OPENAI_API_KEY`.
