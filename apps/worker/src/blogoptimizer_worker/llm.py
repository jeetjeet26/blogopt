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
    return RecommendationPayload.model_validate_json(content)
