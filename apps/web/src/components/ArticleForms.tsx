"use client";

import { FormEvent, useState } from "react";

export function ArticleForms() {
  const [pendingForm, setPendingForm] = useState<"optimize" | "write" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submitForm(event: FormEvent<HTMLFormElement>, mode: "optimize" | "write") {
    event.preventDefault();
    setPendingForm(mode);
    setError(null);

    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Unable to create review. Please try again.");
      }

      const data = await response.json();
      window.location.assign(`/jobs/${data.jobId}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create review.");
      setPendingForm(null);
    }
  }

  return (
    <section className="grid">
      <form className="card stack" onSubmit={(event) => submitForm(event, "optimize")}>
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
        <button type="submit" disabled={pendingForm !== null}>
          {pendingForm === "optimize" ? "Creating review..." : "Run SEO/GEO Review"}
        </button>
      </form>

      <form className="card stack" onSubmit={(event) => submitForm(event, "write")}>
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
        <button type="submit" disabled={pendingForm !== null}>
          {pendingForm === "write" ? "Starting article..." : "Start Article Brief"}
        </button>
      </form>

      {error ? <p className="error-text">{error}</p> : null}
    </section>
  );
}
