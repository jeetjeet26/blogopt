from datetime import datetime, timezone

from .content import clean_article_body
from .db import get_supabase
from .integrations import audit_technical_signals, research_keywords, research_sources
from .llm import generate_recommendation


async def run_job(job_id: str) -> None:
    supabase = get_supabase()
    job = (
        supabase.table("optimization_jobs")
        .select("*, articles(*)")
        .eq("id", job_id)
        .single()
        .execute()
        .data
    )

    try:
        await update_job(job_id, "preparing")
        article = job["articles"]
        brief = (
            supabase.table("article_briefs")
            .select("*")
            .eq("article_id", article["id"])
            .limit(1)
            .execute()
            .data
        )
        brief = brief[0] if brief else None
        article_for_analysis = {
            **article,
            "body": clean_article_body(article.get("body") or "", article.get("title")),
            "raw_body_was_cleaned": True,
        }
        topic = brief["topic"] if brief else article_for_analysis["title"]

        await update_job(job_id, "keyword_research")
        keywords = await research_keywords(topic)
        await update_job(job_id, "source_research")
        sources = await research_sources(topic)
        await update_job(job_id, "technical_audit")
        technical = await audit_technical_signals(article.get("source_url"))

        await update_job(job_id, "saving_research")
        supabase.table("seo_research").insert(
            {
                "job_id": job_id,
                "provider": "semrush",
                "payload": [item.model_dump() for item in keywords],
            }
        ).execute()

        supabase.table("source_research").insert(
            {
                "job_id": job_id,
                "provider": "web_search",
                "payload": [item.model_dump(mode="json") for item in sources],
            }
        ).execute()

        supabase.table("technical_audits").insert(
            {
                "job_id": job_id,
                "provider": "screaming_frog",
                "payload": technical.model_dump(),
            }
        ).execute()

        await update_job(job_id, "drafting" if job["mode"] == "write" else "generating_rewrites")
        recommendation = await generate_recommendation(
            mode=job["mode"],
            article=article_for_analysis,
            brief=brief,
            keywords=keywords,
            sources=sources,
            technical=technical,
        )

        await update_job(job_id, "saving_recommendations")
        supabase.table("recommendations").insert(
            {
                "job_id": job_id,
                "payload": recommendation.model_dump(mode="json"),
                "score": recommendation.score,
                "summary": recommendation.summary,
                "model": "gpt-5",
            }
        ).execute()

        await update_job(job_id, "completed", completed=True)
    except Exception as exc:
        supabase.table("optimization_jobs").update(
            {
                "status": "failed",
                "error_message": str(exc),
                "completed_at": datetime.now(timezone.utc).isoformat(),
            }
        ).eq("id", job_id).execute()
        raise


async def update_job(job_id: str, status: str, completed: bool = False) -> None:
    payload = {
        "status": status,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if status != "failed":
        payload["error_message"] = None
        payload["completed_at"] = datetime.now(timezone.utc).isoformat() if completed else None

    get_supabase().table("optimization_jobs").update(
        payload
    ).eq("id", job_id).execute()
