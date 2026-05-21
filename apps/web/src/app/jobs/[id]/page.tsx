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

          <h3>Keyword Targets</h3>
          <ul>
            {recommendation.keywords?.map((keyword: { keyword: string; rationale: string }) => (
              <li key={keyword.keyword}>
                <strong>{keyword.keyword}</strong>: {keyword.rationale}
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
