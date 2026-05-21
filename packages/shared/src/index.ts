import { z } from "zod";

export const jobModeSchema = z.enum(["optimize", "write"]);
export type JobMode = z.infer<typeof jobModeSchema>;

export const jobStatusSchema = z.enum([
  "queued",
  "researching",
  "drafting",
  "reviewing",
  "completed",
  "failed"
]);
export type JobStatus = z.infer<typeof jobStatusSchema>;

export const articleInputSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  author: z.string().optional(),
  targetMarket: z.string().optional(),
  notes: z.string().optional()
});
export type ArticleInput = z.infer<typeof articleInputSchema>;

export const articleBriefSchema = z.object({
  topic: z.string().min(1),
  audience: z.string().min(1),
  goal: z.string().min(1),
  targetMarket: z.string().optional(),
  pointOfView: z.string().optional(),
  requiredTalkingPoints: z.array(z.string()).default([]),
  sourceMaterial: z.string().optional(),
  toneNotes: z.string().optional()
});
export type ArticleBrief = z.infer<typeof articleBriefSchema>;

export const recommendationSchema = z.object({
  score: z.number().min(0).max(100),
  summary: z.string(),
  keywordStrategy: z
    .object({
      primaryKeyword: z.string().optional(),
      primaryIntent: z.string().optional(),
      primaryVolume: z.number().optional(),
      primaryDifficulty: z.number().optional(),
      primaryCpc: z.number().optional(),
      rationale: z.string().optional(),
      secondaryKeywords: z
        .array(
          z.object({
            keyword: z.string(),
            intent: z.string().optional(),
            volume: z.number().optional(),
            difficulty: z.number().optional(),
            cpc: z.number().optional(),
            useCase: z.string()
          })
        )
        .default([]),
      doNotTarget: z.array(z.string()).default([])
    })
    .default({}),
  sectionKeywordMap: z
    .array(
      z.object({
        section: z.string(),
        targetKeyword: z.string(),
        placement: z.string(),
        exactRecommendation: z.string(),
        rationale: z.string()
      })
    )
    .default([]),
  prioritizedActions: z
    .array(
      z.object({
        priority: z.enum(["high", "medium", "low"]),
        action: z.string(),
        keyword: z.string().optional(),
        expectedImpact: z.string(),
        effort: z.enum(["low", "medium", "high"]).optional()
      })
    )
    .default([]),
  metaTitle: z.object({
    current: z.string().optional(),
    recommended: z.string(),
    rationale: z.string()
  }),
  metaDescription: z.object({
    current: z.string().optional(),
    recommended: z.string(),
    rationale: z.string()
  }),
  slug: z.object({
    current: z.string().optional(),
    recommended: z.string(),
    rationale: z.string()
  }),
  copyImprovements: z
    .array(
      z.object({
        location: z.string(),
        issue: z.string(),
        recommendation: z.string(),
        seoOrGeoRationale: z.string()
      })
    )
    .default([]),
  revisedSections: z
    .array(
      z.object({
        section: z.string(),
        current: z.string().optional(),
        revised: z.string(),
        rationale: z.string()
      })
    )
    .default([]),
  contentGaps: z
    .array(
      z.object({
        gap: z.string(),
        whyItMatters: z.string(),
        suggestedCopy: z.string()
      })
    )
    .default([]),
  suggestedAdditions: z
    .array(
      z.object({
        type: z.string(),
        placement: z.string(),
        copy: z.string(),
        rationale: z.string()
      })
    )
    .default([]),
  keywords: z.array(
    z.object({
      keyword: z.string(),
      intent: z.string(),
      volume: z.number().optional(),
      difficulty: z.number().optional(),
      rationale: z.string()
    })
  ),
  geoSignals: z.array(
    z.object({
      signal: z.string(),
      recommendation: z.string(),
      citationReadiness: z.enum(["low", "medium", "high"])
    })
  ),
  internalLinks: z.array(
    z.object({
      anchor: z.string(),
      targetUrl: z.string().optional(),
      rationale: z.string()
    })
  ),
  schema: z.array(
    z.object({
      type: z.string(),
      rationale: z.string()
    })
  ),
  sources: z.array(
    z.object({
      title: z.string().optional(),
      url: z.string().url(),
      usedFor: z.string()
    })
  )
});
export type Recommendation = z.infer<typeof recommendationSchema>;
