import httpx

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
