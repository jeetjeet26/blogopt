import Link from "next/link";
import { SubmitButton } from "@/components/SubmitButton";
import { listJobs } from "@/lib/jobs";

export const dynamic = "force-dynamic";

export default async function Home() {
  const jobs = await listJobs().catch(() => []);

  return (
    <div className="stack">
      <section className="hero stack">
        <span className="eyebrow">P11creative The Buzz</span>
        <h1>SEO and GEO blog optimization, guided by research.</h1>
        <p className="muted">
          Upload an existing draft for optimization or brief a GPT-5 content agent to create a
          source-backed article from scratch. Slack commands can start work and report status, while
          this app stays the review workspace.
        </p>
        <p>
          <Link className="button" href="/write">
            Start Guided Article Conversation
          </Link>{" "}
          <Link className="button" href="/settings">
            Integration Settings
          </Link>
        </p>
      </section>

      <section className="grid">
        <form className="card stack" action="/api/articles" method="post">
          <input type="hidden" name="mode" value="optimize" />
          <h2>Optimize Existing Draft</h2>
          <label>
            Title
            <input name="title" required />
          </label>
          <label>
            Source URL
            <input name="sourceUrl" type="url" placeholder="https://p11.com/..." />
          </label>
          <label>
            Draft body
            <textarea name="body" required />
          </label>
          <label>
            Notes
            <textarea name="notes" />
          </label>
          <SubmitButton pendingText="Creating review...">Run SEO/GEO Review</SubmitButton>
        </form>

        <form className="card stack" action="/api/articles" method="post">
          <input type="hidden" name="mode" value="write" />
          <h2>Write New Article</h2>
          <label>
            Topic
            <input name="topic" required />
          </label>
          <label>
            Audience
            <input name="audience" required placeholder="Real estate developers, brokers..." />
          </label>
          <label>
            Goal
            <input name="goal" required placeholder="Educate, rank, generate leads..." />
          </label>
          <label>
            Target market
            <input name="targetMarket" />
          </label>
          <label>
            Desired POV and talking points
            <textarea name="sourceMaterial" />
          </label>
          <SubmitButton pendingText="Starting article...">Start Article Brief</SubmitButton>
        </form>
      </section>

      <section className="card stack">
        <h2>Recent Jobs</h2>
        <ul className="jobs">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link href={`/jobs/${job.id}`}>
                <strong>{job.articles?.title || "Untitled article"}</strong>
              </Link>{" "}
              <span className="status">{job.status}</span>
              <p className="muted">
                {job.mode} · {new Date(job.created_at).toLocaleString()}
              </p>
            </li>
          ))}
          {jobs.length === 0 ? <li className="muted">No jobs yet.</li> : null}
        </ul>
      </section>
    </div>
  );
}
