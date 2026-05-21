from typing import Literal

from pydantic import BaseModel, Field, HttpUrl


JobMode = Literal["optimize", "write"]


class RunJobRequest(BaseModel):
    mode: JobMode


class KeywordFinding(BaseModel):
    keyword: str
    intent: str = "informational"
    volume: int | None = None
    difficulty: float | None = None
    cpc: float | None = None
    rationale: str


class SourceFinding(BaseModel):
    title: str | None = None
    url: HttpUrl
    snippet: str
    credibility_notes: str | None = None
    used_for: str | None = None


class TechnicalFinding(BaseModel):
    url: str | None = None
    status_code: int | None = None
    meta_title: str | None = None
    meta_description: str | None = None
    h1: list[str] = Field(default_factory=list)
    internal_links: list[str] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)


class RecommendationPayload(BaseModel):
    score: int = Field(ge=0, le=100)
    summary: str
    metaTitle: dict
    metaDescription: dict
    slug: dict
    copyImprovements: list[dict] = Field(default_factory=list)
    revisedSections: list[dict] = Field(default_factory=list)
    contentGaps: list[dict] = Field(default_factory=list)
    suggestedAdditions: list[dict] = Field(default_factory=list)
    keywords: list[dict]
    geoSignals: list[dict]
    internalLinks: list[dict]
    schema: list[dict]
    sources: list[dict]
