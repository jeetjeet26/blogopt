import json

import httpx
from pydantic import ValidationError

from .config import settings
from .models import KeywordFinding, SourceFinding, TechnicalFinding


async def research_keywords(topic: str) -> list[KeywordFinding]:
    if not settings.semrush_api_key:
        return [
            KeywordFinding(
                keyword=topic.lower(),
                rationale="Fallback keyword extracted from article topic because SEMrush is not configured.",
            )
        ]

    params = {
        "type": "phrase_related",
        "key": settings.semrush_api_key,
        "phrase": topic,
        "database": "us",
        "export_columns": "Ph,Nq,Kd,Cp"
    }
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get("https://api.semrush.com/", params=params)
        response.raise_for_status()

    rows = response.text.splitlines()[1:8]
    findings: list[KeywordFinding] = []
    for row in rows:
        parts = row.split(";")
        if not parts or not parts[0]:
            continue
        findings.append(
            KeywordFinding(
                keyword=parts[0],
                volume=_safe_int(parts, 1),
                difficulty=_safe_float(parts, 2),
                cpc=_safe_float(parts, 3),
                rationale="SEMrush related keyword opportunity."
            )
        )

    return findings


async def research_sources(topic: str) -> list[SourceFinding]:
    openai_sources = await _research_sources_with_openai(topic)
    if openai_sources:
        return openai_sources

    if not settings.web_search_api_url or not settings.web_search_api_key:
        return []

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(
            str(settings.web_search_api_url),
            params={"q": topic, "count": 6},
            headers={"authorization": f"Bearer {settings.web_search_api_key}"}
        )
        response.raise_for_status()

    payload = response.json()
    items = payload.get("results") or payload.get("items") or []
    return [
        SourceFinding(
            title=item.get("title"),
            url=item.get("url") or item.get("link"),
            snippet=item.get("snippet") or item.get("description") or "",
            credibility_notes="Imported from configured web search provider."
        )
        for item in items
        if item.get("url") or item.get("link")
    ]


async def _research_sources_with_openai(topic: str) -> list[SourceFinding]:
    prompt = {
        "task": (
            "Search the web for current, authoritative sources that can inform a P11creative "
            "SEO/GEO article draft. Prioritize primary data sources, credible industry research, "
            "government datasets, analyst reports, and reputable trade publications. Return only "
            "valid JSON."
        ),
        "topic": topic,
        "output_shape": {
            "sources": [
                {
                    "title": "source title",
                    "url": "https://example.com/source",
                    "snippet": "short factual summary of what this source contributes",
                    "used_for": "how the article writer should use this source",
                }
            ]
        },
        "requirements": [
            "Return 4-6 sources when available.",
            "Do not invent URLs.",
            "Keep snippets factual and specific.",
            "Prefer sources that are useful for citations and claims in an article.",
        ],
    }

    try:
        async with httpx.AsyncClient(timeout=45) as client:
            response = await client.post(
                "https://api.openai.com/v1/responses",
                headers={
                    "authorization": f"Bearer {settings.openai_api_key}",
                    "content-type": "application/json",
                },
                json={
                    "model": settings.openai_search_model,
                    "tools": [{"type": "web_search", "search_context_size": "medium"}],
                    "tool_choice": "required",
                    "input": json.dumps(prompt),
                },
            )
            response.raise_for_status()
    except httpx.HTTPError:
        return []

    payload = response.json()
    text = _extract_response_text(payload)
    if not text:
        return []

    try:
        parsed = json.loads(_strip_json_fence(text))
    except json.JSONDecodeError:
        return []

    findings: list[SourceFinding] = []
    for item in parsed.get("sources") or []:
        if not isinstance(item, dict) or not item.get("url"):
            continue
        try:
            findings.append(
                SourceFinding(
                    title=item.get("title"),
                    url=item["url"],
                    snippet=item.get("snippet") or item.get("description") or "",
                    credibility_notes=(
                        "Imported from OpenAI Responses API web_search source research."
                    ),
                    used_for=item.get("used_for") or item.get("usedFor"),
                )
            )
        except ValidationError:
            continue

    return findings[:6]


async def audit_technical_signals(source_url: str | None) -> TechnicalFinding:
    if not settings.screaming_frog_api_url or not source_url:
        return TechnicalFinding(url=source_url, notes=["Screaming Frog API not configured or no URL supplied."])

    headers = {}
    if settings.screaming_frog_api_key:
        headers["authorization"] = f"Bearer {settings.screaming_frog_api_key}"

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            str(settings.screaming_frog_api_url),
            json={"url": source_url},
            headers=headers
        )
        response.raise_for_status()

    payload = response.json()
    return TechnicalFinding(
        url=source_url,
        status_code=payload.get("status_code"),
        meta_title=payload.get("meta_title"),
        meta_description=payload.get("meta_description"),
        h1=payload.get("h1") or [],
        internal_links=payload.get("internal_links") or [],
        notes=payload.get("notes") or []
    )


def _extract_response_text(payload: dict) -> str:
    if isinstance(payload.get("output_text"), str):
        return payload["output_text"]

    chunks: list[str] = []
    for output_item in payload.get("output") or []:
        for content_item in output_item.get("content") or []:
            text = content_item.get("text")
            if isinstance(text, str):
                chunks.append(text)

    return "\n".join(chunks).strip()


def _strip_json_fence(text: str) -> str:
    stripped = text.strip()
    if stripped.startswith("```"):
        lines = stripped.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        return "\n".join(lines).strip()
    return stripped


def _safe_int(parts: list[str], index: int) -> int | None:
    try:
        return int(float(parts[index]))
    except (IndexError, TypeError, ValueError):
        return None


def _safe_float(parts: list[str], index: int) -> float | None:
    try:
        return float(parts[index])
    except (IndexError, TypeError, ValueError):
        return None
