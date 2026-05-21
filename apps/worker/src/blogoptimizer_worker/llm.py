import json

from openai import AsyncOpenAI

from .config import settings
from .models import KeywordFinding, RecommendationPayload, SourceFinding, TechnicalFinding


client = AsyncOpenAI(api_key=settings.openai_api_key)


async def generate_recommendation(
    *,
    mode: str,
    article: dict,
    brief: dict | None,
    keywords: list[KeywordFinding],
    sources: list[SourceFinding],
    technical: TechnicalFinding,
) -> RecommendationPayload:
    prompt = {
        "role": "user",
        "content": json.dumps(
            {
                "task": "Create P11creative SEO and GEO recommendations. If mode is write, also draft the article body in the summary guidance. Preserve P11 brand voice and do not invent unsupported claims.",
                "mode": mode,
                "article": article,
                "brief": brief,
                "semrush_keywords": [item.model_dump() for item in keywords],
                "web_sources": [item.model_dump(mode="json") for item in sources],
                "technical_audit": technical.model_dump(),
                "required_json_shape": {
                    "score": "0-100",
                    "summary": "concise review summary",
                    "metaTitle": {"current": "string", "recommended": "string", "rationale": "string"},
                    "metaDescription": {
                        "current": "string",
                        "recommended": "string",
                        "rationale": "string"
                    },
                    "slug": {"current": "string", "recommended": "string", "rationale": "string"},
                    "keywords": [],
                    "geoSignals": [],
                    "internalLinks": [],
                    "schema": [],
                    "sources": []
                }
            }
        )
    }

    response = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a senior SEO/GEO strategist and P11creative editorial assistant. "
                    "Return only valid JSON matching the requested shape."
                )
            },
            prompt
        ],
        response_format={"type": "json_object"}
    )

    content = response.choices[0].message.content or "{}"
    payload = _normalize_payload(json.loads(content))
    return RecommendationPayload.model_validate(payload)


def _normalize_payload(payload: dict) -> dict:
    payload["keywords"] = [_normalize_keyword(item) for item in payload.get("keywords", [])]
    payload["geoSignals"] = [_normalize_geo_signal(item) for item in payload.get("geoSignals", [])]
    payload["internalLinks"] = [
        _normalize_internal_link(item) for item in payload.get("internalLinks", [])
    ]
    payload["schema"] = [_normalize_schema(item) for item in payload.get("schema", [])]
    payload["sources"] = [
        item for item in [_normalize_source(item) for item in payload.get("sources", [])] if item
    ]
    return payload


def _normalize_keyword(item: dict | str) -> dict:
    if isinstance(item, dict):
        return {
            "keyword": item.get("keyword") or item.get("term") or "Untitled keyword",
            "intent": item.get("intent") or "informational",
            "volume": item.get("volume"),
            "difficulty": item.get("difficulty"),
            "rationale": item.get("rationale") or "Recommended by the analysis model.",
        }

    return {
        "keyword": item,
        "intent": "informational",
        "rationale": "Recommended by the analysis model.",
    }


def _normalize_geo_signal(item: dict | str) -> dict:
    if isinstance(item, dict):
        return {
            "signal": item.get("signal") or item.get("name") or "GEO signal",
            "recommendation": item.get("recommendation") or item.get("rationale") or "",
            "citationReadiness": item.get("citationReadiness") or "medium",
        }

    return {
        "signal": item,
        "recommendation": item,
        "citationReadiness": "medium",
    }


def _normalize_internal_link(item: dict | str) -> dict:
    if isinstance(item, dict):
        return {
            "anchor": item.get("anchor") or item.get("text") or "Internal link",
            "targetUrl": item.get("targetUrl") or item.get("url"),
            "rationale": item.get("rationale") or "Recommended internal link.",
        }

    return {
        "anchor": item,
        "rationale": "Recommended internal link.",
    }


def _normalize_schema(item: dict | str) -> dict:
    if isinstance(item, dict):
        return {
            "type": item.get("type") or item.get("@type") or "Article",
            "rationale": item.get("rationale") or "Recommended structured data.",
        }

    return {
        "type": item,
        "rationale": "Recommended structured data.",
    }


def _normalize_source(item: dict | str) -> dict | None:
    if isinstance(item, dict) and item.get("url"):
        return {
            "title": item.get("title"),
            "url": item["url"],
            "usedFor": item.get("usedFor") or item.get("used_for") or "Supporting evidence.",
        }

    if isinstance(item, str) and item.startswith(("http://", "https://")):
        return {"url": item, "usedFor": "Supporting evidence."}

    return None
