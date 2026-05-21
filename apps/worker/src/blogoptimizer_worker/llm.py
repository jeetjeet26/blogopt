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
                "task": (
                    "Create a full P11creative SEO and GEO editorial review. Do not stop at "
                    "metadata. Provide concrete copy edits, rewritten sections, content gaps, "
                    "source-backed additions, and rationale tied to keyword/search intent, "
                    "citation readiness, internal linking, and brand voice. If mode is write, "
                    "also draft article copy. Preserve P11's personality and do not invent "
                    "unsupported factual claims."
                ),
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
                    "copyImprovements": [
                        {
                            "location": "intro, H2 name, CTA, paragraph, etc.",
                            "issue": "what is underperforming in the current copy",
                            "recommendation": "specific editorial action",
                            "seoOrGeoRationale": "why this improves SEO/GEO"
                        }
                    ],
                    "revisedSections": [
                        {
                            "section": "section name",
                            "current": "current copy excerpt",
                            "revised": "rewritten publish-ready copy",
                            "rationale": "why this revision is better"
                        }
                    ],
                    "contentGaps": [
                        {
                            "gap": "missing topic, proof point, statistic, FAQ, definition, etc.",
                            "whyItMatters": "SEO/GEO reason",
                            "suggestedCopy": "copy the editor can add"
                        }
                    ],
                    "suggestedAdditions": [
                        {
                            "type": "FAQ, definition block, source-backed claim, CTA, internal link module",
                            "placement": "where it belongs",
                            "copy": "publish-ready suggested copy",
                            "rationale": "research/SEO/GEO rationale"
                        }
                    ],
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
    payload["copyImprovements"] = [
        _normalize_copy_improvement(item) for item in payload.get("copyImprovements", [])
    ]
    payload["revisedSections"] = [
        _normalize_revised_section(item) for item in payload.get("revisedSections", [])
    ]
    payload["contentGaps"] = [_normalize_content_gap(item) for item in payload.get("contentGaps", [])]
    payload["suggestedAdditions"] = [
        _normalize_suggested_addition(item) for item in payload.get("suggestedAdditions", [])
    ]
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


def _normalize_copy_improvement(item: dict | str) -> dict:
    if isinstance(item, dict):
        return {
            "location": item.get("location") or item.get("section") or "Article copy",
            "issue": item.get("issue") or item.get("problem") or "Copy can be strengthened.",
            "recommendation": item.get("recommendation") or item.get("suggestion") or "",
            "seoOrGeoRationale": item.get("seoOrGeoRationale")
            or item.get("rationale")
            or "Improves relevance, clarity, or citation readiness.",
        }

    return {
        "location": "Article copy",
        "issue": "Copy can be strengthened.",
        "recommendation": item,
        "seoOrGeoRationale": "Improves relevance, clarity, or citation readiness.",
    }


def _normalize_revised_section(item: dict | str) -> dict:
    if isinstance(item, dict):
        return {
            "section": item.get("section") or item.get("location") or "Article section",
            "current": item.get("current"),
            "revised": item.get("revised") or item.get("copy") or "",
            "rationale": item.get("rationale") or "Recommended rewrite.",
        }

    return {
        "section": "Article section",
        "revised": item,
        "rationale": "Recommended rewrite.",
    }


def _normalize_content_gap(item: dict | str) -> dict:
    if isinstance(item, dict):
        return {
            "gap": item.get("gap") or item.get("topic") or "Missing content",
            "whyItMatters": item.get("whyItMatters")
            or item.get("rationale")
            or "Adds topical depth and search relevance.",
            "suggestedCopy": item.get("suggestedCopy") or item.get("copy") or "",
        }

    return {
        "gap": item,
        "whyItMatters": "Adds topical depth and search relevance.",
        "suggestedCopy": "",
    }


def _normalize_suggested_addition(item: dict | str) -> dict:
    if isinstance(item, dict):
        return {
            "type": item.get("type") or "Copy addition",
            "placement": item.get("placement") or item.get("location") or "Article body",
            "copy": item.get("copy") or item.get("suggestedCopy") or "",
            "rationale": item.get("rationale") or "Recommended addition.",
        }

    return {
        "type": "Copy addition",
        "placement": "Article body",
        "copy": item,
        "rationale": "Recommended addition.",
    }


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
