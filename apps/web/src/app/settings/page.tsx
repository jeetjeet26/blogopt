import Link from "next/link";

const settings = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "SLACK_SIGNING_SECRET",
  "SLACK_BOT_TOKEN",
  "WORKER_API_URL",
  "WORKER_API_TOKEN",
  "SEMRUSH_API_KEY",
  "SCREAMING_FROG_API_URL",
  "SCREAMING_FROG_API_KEY",
  "WEB_SEARCH_API_URL",
  "WEB_SEARCH_API_KEY"
];

export default function SettingsPage() {
  return (
    <div className="stack">
      <Link className="button" href="/">
        Back to dashboard
      </Link>
      <section className="hero stack">
        <span className="eyebrow">Internal Setup</span>
        <h1>Integration checklist</h1>
        <p className="muted">
          This app does not store integration secrets in the browser. Configure these values in the
          hosting environment for the web app and worker.
        </p>
      </section>
      <section className="card">
        <ul>
          {settings.map((setting) => (
            <li key={setting}>
              <code>{setting}</code>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
