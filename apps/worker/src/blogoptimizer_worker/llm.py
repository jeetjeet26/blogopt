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
    write_mode_instruction = (
        "For write mode, the primary deliverable is rewriteOptions. Return 2-3 distinct, "
        "publish-ready article drafts, each with a different strategic emphasis such as "
        "data/analytical, SEO-forward, GEO/citation-ready, contrarian, or brand-story-led when "
        "appropriate to the brief. Each fullDraft must read like an actual written article with "
        "a clear headline, narrative intro, developed paragraphs, useful subheads, and a CTA. "
        "Do not make the draft mostly bullets, FAQs, notes, or an assembly kit unless the brief "
        "explicitly asks for that format. Use semrush_keywords, web_sources, technical_audit, "
        "brief, and article/source material as the research payloads that inform the drafts. "
        "If web_sources are empty, state that limitation in implementationNotes and do not imply "
        "that live web research supplied specific citations."
    )
    optimize_mode_instruction = (
        "For optimize mode, return 2-3 complete or near-complete revised drafts based on the "
        "submitted article: conservative polish, SEO-forward, and GEO/citation-ready when useful."
    )

    prompt = {
        "role": "user",
        "content": json.dumps(
            {
                "task": (
                    "Create a keyword-driven SEO and GEO optimization review for P11creative. "
                    "GEO means Generative Engine Optimization/citation readiness, not local "
                    "geographic SEO unless a target market is explicitly supplied. Start from "
                    "SEMrush evidence. Choose a primary keyword and secondary keyword cluster "
                    "using volume, difficulty, CPC, and search intent when available. Every copy "
                    "recommendation must name the target keyword or semantic entity it supports. "
                    "Avoid generic AI modules, city placeholders, broad local SEO advice, and "
                    "rewrite options that flatten P11's playful voice. Do not give the team a "
                    "bag of blocks to assemble. Give them ready-to-use article copy options that "
                    "already incorporate the keyword strategy, citations/proof needs, internal "
                    "link opportunities, schema/GEO readiness, and brand voice. "
                    f"{write_mode_instruction if mode == 'write' else optimize_mode_instruction} "
                    "Treat article.body as already cleaned of nav/footer chrome."
                ),
                "mode": mode,
                "article": article,
                "brief": brief,
                "semrush_keywords": [item.model_dump() for item in keywords],
                "web_sources": [item.model_dump(mode="json") for item in sources],
                "technical_audit": technical.model_dump(),
                "research_payload_status": {
                    "semrushKeywordCount": len(keywords),
                    "webSourceCount": len(sources),
                    "technicalAuditPresent": bool(technical.model_dump()),
                    "note": (
                        "These are the payloads injected into the writing/recommendation call. "
                        "Use web_sources for sourced claims when present; if webSourceCount is 0, "
                        "do not present inferred source names as live-researched citations."
                    ),
                },
                "required_json_shape": {
                    "score": "0-100",
                    "summary": "concise keyword-backed review summary",
                    "keywordStrategy": {
                        "primaryKeyword": "chosen keyword from SEMrush/research",
                        "primaryIntent": "informational/commercial/etc.",
                        "primaryVolume": "number if available",
                        "primaryDifficulty": "number if available",
                        "primaryCpc": "number if available",
                        "rationale": "why this is the best target for this article",
                        "secondaryKeywords": [
                            {
                                "keyword": "keyword",
                                "intent": "intent",
                                "volume": "number if available",
                                "difficulty": "number if available",
                                "cpc": "number if available",
                                "useCase": "where/how to use it"
                            }
                        ],
                        "doNotTarget": ["too broad, off-intent, or unsupported terms"]
                    },
                    "sectionKeywordMap": [
                        {
                            "section": "title/meta/intro/H2/body/CTA",
                            "targetKeyword": "keyword or semantic entity",
                            "placement": "exact placement",
                            "exactRecommendation": "specific insertion or edit",
                            "rationale": "search intent and evidence reason"
                        }
                    ],
                    "prioritizedActions": [
                        {
                            "priority": "high/medium/low",
                            "action": "specific optimization action",
                            "keyword": "keyword if applicable",
                            "expectedImpact": "why it matters",
                            "effort": "low/medium/high"
                        }
                    ],
                    "rewriteOptions": [
                        {
                            "optionName": "Conservative Polish / SEO-Forward / GEO-Citation Ready",
                            "useWhen": "when the team should choose this option",
                            "strategy": "how this option uses the SEMrush keyword strategy and preserves P11 voice",
                            "primaryKeyword": "primary keyword used in the draft",
                            "supportingKeywords": ["secondary keyword"],
                            "fullDraft": (
                                "complete publish-ready article copy. In write mode, this must be "
                                "a continuous article draft, not a bullet-point recommendation list."
                            ),
                            "changeSummary": [
                                "specific keyword, structure, citation, CTA, or internal-link changes made"
                            ],
                            "implementationNotes": "what the editor still needs to verify, link, or approve"
                        }
                    ],
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
                            "seoOrGeoRationale": "must mention keyword/search intent or GEO citation signal"
                        }
                    ],
                    "revisedSections": [
                        {
                            "section": "section name",
                            "current": "current copy excerpt",
                            "revised": "rewritten publish-ready copy",
                            "rationale": "keyword/search intent reason plus voice-preservation note"
                        }
                    ],
                    "contentGaps": [
                        {
                            "gap": "missing topic, proof point, statistic, FAQ, definition, etc.",
                            "whyItMatters": "keyword/search intent/GEO reason",
                            "suggestedCopy": "copy the editor can add"
                        }
                    ],
                    "suggestedAdditions": [
                        {
                            "type": "FAQ, definition block, source-backed claim, CTA, internal link module",
                            "placement": "where it belongs",
                            "copy": "publish-ready suggested copy",
                            "rationale": "keyword/search intent/GEO rationale"
                        }
                    ],
                    "keywords": [
                        {
                            "keyword": "keyword",
                            "intent": "intent",
                            "volume": "number if available",
                            "difficulty": "number if available",
                            "cpc": "number if available",
                            "rationale": "why target or support this term"
                        }
                    ],
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
    payload["keywordStrategy"] = _normalize_keyword_strategy(payload.get("keywordStrategy") or {})
    payload["sectionKeywordMap"] = [
        _normalize_section_keyword_map(item) for item in payload.get("sectionKeywordMap", [])
    ]
    payload["prioritizedActions"] = [
        _normalize_prioritized_action(item) for item in payload.get("prioritizedActions", [])
    ]
    payload["rewriteOptions"] = [
        _normalize_rewrite_option(item) for item in payload.get("rewriteOptions", [])
    ]
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


def _normalize_rewrite_option(item: dict | str) -> dict:
    if isinstance(item, dict):
        return {
            "optionName": item.get("optionName") or item.get("name") or "Rewrite Option",
            "useWhen": item.get("useWhen") or item.get("use_when") or "Use when this direction fits editorial goals.",
            "strategy": item.get("strategy") or "Keyword-backed rewrite preserving P11 voice.",
            "primaryKeyword": item.get("primaryKeyword") or item.get("primary_keyword"),
            "supportingKeywords": item.get("supportingKeywords") or item.get("supporting_keywords") or [],
            "fullDraft": item.get("fullDraft") or item.get("draft") or item.get("copy") or "",
            "changeSummary": item.get("changeSummary") or item.get("change_summary") or [],
            "implementationNotes": item.get("implementationNotes") or item.get("implementation_notes"),
        }

    return {
        "optionName": "Rewrite Option",
        "useWhen": "Use when this direction fits editorial goals.",
        "strategy": "Keyword-backed rewrite preserving P11 voice.",
        "supportingKeywords": [],
        "fullDraft": item,
        "changeSummary": [],
    }


def _normalize_keyword_strategy(item: dict) -> dict:
    if not isinstance(item, dict):
        return {}

    secondary = item.get("secondaryKeywords") or []
    return {
        "primaryKeyword": item.get("primaryKeyword") or item.get("primary_keyword"),
        "primaryIntent": item.get("primaryIntent") or item.get("primary_intent"),
        "primaryVolume": item.get("primaryVolume") or item.get("primary_volume"),
        "primaryDifficulty": item.get("primaryDifficulty") or item.get("primary_difficulty"),
        "primaryCpc": item.get("primaryCpc") or item.get("primary_cpc"),
        "rationale": item.get("rationale"),
        "secondaryKeywords": [
            _normalize_secondary_keyword(keyword) for keyword in secondary if keyword
        ],
        "doNotTarget": item.get("doNotTarget") or item.get("do_not_target") or [],
    }


def _normalize_secondary_keyword(item: dict | str) -> dict:
    if isinstance(item, dict):
        return {
            "keyword": item.get("keyword") or item.get("term") or "Untitled keyword",
            "intent": item.get("intent"),
            "volume": item.get("volume"),
            "difficulty": item.get("difficulty"),
            "cpc": item.get("cpc"),
            "useCase": item.get("useCase") or item.get("use_case") or "Supporting term.",
        }

    return {"keyword": item, "useCase": "Supporting term."}


def _normalize_section_keyword_map(item: dict | str) -> dict:
    if isinstance(item, dict):
        return {
            "section": item.get("section") or "Article section",
            "targetKeyword": item.get("targetKeyword") or item.get("keyword") or "Keyword",
            "placement": item.get("placement") or "Article body",
            "exactRecommendation": item.get("exactRecommendation")
            or item.get("recommendation")
            or "",
            "rationale": item.get("rationale") or "Supports search intent.",
        }

    return {
        "section": "Article section",
        "targetKeyword": item,
        "placement": "Article body",
        "exactRecommendation": item,
        "rationale": "Supports search intent.",
    }


def _normalize_prioritized_action(item: dict | str) -> dict:
    if isinstance(item, dict):
        return {
            "priority": item.get("priority") if item.get("priority") in {"high", "medium", "low"} else "medium",
            "action": item.get("action") or item.get("recommendation") or "",
            "keyword": item.get("keyword"),
            "expectedImpact": item.get("expectedImpact")
            or item.get("expected_impact")
            or "Improves SEO relevance.",
            "effort": item.get("effort") if item.get("effort") in {"low", "medium", "high"} else "medium",
        }

    return {
        "priority": "medium",
        "action": item,
        "expectedImpact": "Improves SEO relevance.",
        "effort": "medium",
    }


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
