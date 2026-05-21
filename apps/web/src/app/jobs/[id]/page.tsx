import Link from "next/link";
import { JobProgress } from "@/components/JobProgress";
import { getJob } from "@/lib/jobs";

export const dynamic = "force-dynamic";

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id);
  const recommendation = job.recommendations?.[0]?.payload;

  return (
    <div className="stack">
      <Link className="button" href="/">
        Back to dashboard
      </Link>{" "}
      <a className="button" href={`/api/jobs/${id}/export`}>
        Export Markdown
      </a>

      <section className="hero stack">
        <span className="eyebrow">{job.mode}</span>
        <h1>{job.articles?.title || "Untitled article"}</h1>
        <JobProgress jobId={id} initialStatus={job.status} initialError={job.error_message} />
      </section>

      <section className="card stack">
        <h2>Article</h2>
        <p className="muted">{job.articles?.source_url}</p>
        <pre>{job.articles?.body || "No draft body yet."}</pre>
      </section>

      {recommendation ? (
        <section className="card stack">
          <h2>Recommendations</h2>
          <p>{recommendation.summary}</p>

          {recommendation.keywordStrategy?.primaryKeyword ? (
            <section className="recommendation-block">
              <span className="eyebrow">Keyword Strategy</span>
              <h3>{recommendation.keywordStrategy.primaryKeyword}</h3>
              <p>
                Intent: {recommendation.keywordStrategy.primaryIntent || "Not specified"} · Volume:{" "}
                {recommendation.keywordStrategy.primaryVolume ?? "n/a"} · Difficulty:{" "}
                {recommendation.keywordStrategy.primaryDifficulty ?? "n/a"} · CPC:{" "}
                {recommendation.keywordStrategy.primaryCpc ?? "n/a"}
              </p>
              <p className="muted">{recommendation.keywordStrategy.rationale}</p>
              {recommendation.keywordStrategy.secondaryKeywords?.length ? (
                <ul>
                  {recommendation.keywordStrategy.secondaryKeywords.map(
                    (
                      keyword: {
                        keyword: string;
                        intent?: string;
                        volume?: number;
                        difficulty?: number;
                        cpc?: number;
                        useCase: string;
                      },
                      index: number
                    ) => (
                      <li key={`${keyword.keyword}-${index}`}>
                        <strong>{keyword.keyword}</strong> ({keyword.intent || "intent n/a"}, vol{" "}
                        {keyword.volume ?? "n/a"}, KD {keyword.difficulty ?? "n/a"}):{" "}
                        {keyword.useCase}
                      </li>
                    )
                  )}
                </ul>
              ) : null}
            </section>
          ) : null}

          {recommendation.prioritizedActions?.length ? (
            <>
              <h3>Priority Optimization Plan</h3>
              <div className="stack">
                {recommendation.prioritizedActions.map(
                  (
                    item: {
                      priority: string;
                      action: string;
                      keyword?: string;
                      expectedImpact: string;
                      effort?: string;
                    },
                    index: number
                  ) => (
                    <article className="recommendation-block" key={`${item.action}-${index}`}>
                      <span className="eyebrow">{item.priority} priority</span>
                      <h4>{item.action}</h4>
                      {item.keyword ? <p>Keyword: {item.keyword}</p> : null}
                      <p className="muted">
                        {item.expectedImpact}
                        {item.effort ? ` Effort: ${item.effort}.` : ""}
                      </p>
                    </article>
                  )
                )}
              </div>
            </>
          ) : null}

          <div className="comparison">
            <div>
              <h3>Current</h3>
              <p>{recommendation.metaTitle?.current || "Not provided"}</p>
            </div>
            <div>
              <h3>Recommended Meta Title</h3>
              <p>{recommendation.metaTitle?.recommended}</p>
            </div>
          </div>
          <div className="comparison">
            <div>
              <h3>Current Slug</h3>
              <p>{recommendation.slug?.current || "Not provided"}</p>
            </div>
            <div>
              <h3>Recommended Slug</h3>
              <p>{recommendation.slug?.recommended}</p>
            </div>
          </div>

          {recommendation.sectionKeywordMap?.length ? (
            <>
              <h3>Keyword Placement Map</h3>
              <div className="stack">
                {recommendation.sectionKeywordMap.map(
                  (
                    item: {
                      section: string;
                      targetKeyword: string;
                      placement: string;
                      exactRecommendation: string;
                      rationale: string;
                    },
                    index: number
                  ) => (
                    <article className="recommendation-block" key={`${item.section}-${index}`}>
                      <span className="eyebrow">{item.section}</span>
                      <h4>{item.targetKeyword}</h4>
                      <p>
                        <strong>Placement:</strong> {item.placement}
                      </p>
                      <p>
                        <strong>Exact edit:</strong> {item.exactRecommendation}
                      </p>
                      <p className="muted">{item.rationale}</p>
                    </article>
                  )
                )}
              </div>
            </>
          ) : null}

          <h3>Copy Improvements</h3>
          <div className="stack">
            {recommendation.copyImprovements?.length ? (
              recommendation.copyImprovements.map(
                (
                  item: {
                    location: string;
                    issue: string;
                    recommendation: string;
                    seoOrGeoRationale: string;
                  },
                  index: number
                ) => (
                  <article className="recommendation-block" key={`${item.location}-${index}`}>
                    <span className="eyebrow">{item.location}</span>
                    <p>
                      <strong>Issue:</strong> {item.issue}
                    </p>
                    <p>
                      <strong>Recommended edit:</strong> {item.recommendation}
                    </p>
                    <p className="muted">{item.seoOrGeoRationale}</p>
                  </article>
                )
              )
            ) : (
              <p className="muted">No copy improvements were returned for this run.</p>
            )}
          </div>

          <h3>Rewritten Sections</h3>
          <div className="stack">
            {recommendation.revisedSections?.length ? (
              recommendation.revisedSections.map(
                (
                  item: { section: string; current?: string; revised: string; rationale: string },
                  index: number
                ) => (
                  <article className="recommendation-block" key={`${item.section}-${index}`}>
                    <h4>{item.section}</h4>
                    {item.current ? (
                      <>
                        <strong>Current</strong>
                        <pre>{item.current}</pre>
                      </>
                    ) : null}
                    <strong>Suggested Rewrite</strong>
                    <pre>{item.revised}</pre>
                    <p className="muted">{item.rationale}</p>
                  </article>
                )
              )
            ) : (
              <p className="muted">No rewritten sections were returned for this run.</p>
            )}
          </div>

          <h3>Content Gaps and Additions</h3>
          <div className="grid">
            <div className="stack">
              {recommendation.contentGaps?.map(
                (
                  item: { gap: string; whyItMatters: string; suggestedCopy: string },
                  index: number
                ) => (
                  <article className="recommendation-block" key={`${item.gap}-${index}`}>
                    <h4>{item.gap}</h4>
                    <p className="muted">{item.whyItMatters}</p>
                    {item.suggestedCopy ? <pre>{item.suggestedCopy}</pre> : null}
                  </article>
                )
              )}
            </div>
            <div className="stack">
              {recommendation.suggestedAdditions?.map(
                (
                  item: { type: string; placement: string; copy: string; rationale: string },
                  index: number
                ) => (
                  <article className="recommendation-block" key={`${item.type}-${index}`}>
                    <span className="eyebrow">{item.type}</span>
                    <h4>{item.placement}</h4>
                    <pre>{item.copy}</pre>
                    <p className="muted">{item.rationale}</p>
                  </article>
                )
              )}
            </div>
          </div>

          <h3>All Keyword Targets</h3>
          <ul>
            {recommendation.keywords?.map((keyword: { keyword: string; rationale: string; volume?: number; difficulty?: number; intent?: string }) => (
              <li key={keyword.keyword}>
                <strong>{keyword.keyword}</strong> ({keyword.intent || "intent n/a"}, vol{" "}
                {keyword.volume ?? "n/a"}, KD {keyword.difficulty ?? "n/a"}): {keyword.rationale}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="card">
          <p className="muted">Recommendations will appear here when the worker finishes.</p>
        </section>
      )}
    </div>
  );
}
