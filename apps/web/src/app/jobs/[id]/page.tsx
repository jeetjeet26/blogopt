import Link from "next/link";
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
        <p>
          <span className="status">{job.status}</span>
        </p>
        {job.error_message ? <p className="muted">{job.error_message}</p> : null}
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
