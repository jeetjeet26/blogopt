import Link from "next/link";
import { ArticleForms } from "@/components/ArticleForms";
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

      <ArticleForms />

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
