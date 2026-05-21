"use client";

import { useEffect, useMemo, useState } from "react";

type JobStatus = "queued" | "researching" | "drafting" | "reviewing" | "completed" | "failed";

type JobProgressProps = {
  jobId: string;
  initialStatus: JobStatus;
  initialError?: string | null;
};

const progressByStatus: Record<JobStatus, number> = {
  queued: 8,
  researching: 32,
  drafting: 58,
  reviewing: 82,
  completed: 100,
  failed: 100
};

const labelByStatus: Record<JobStatus, string> = {
  queued: "Queued for worker",
  researching: "Collecting SEMrush, web, and technical signals",
  drafting: "Drafting with GPT-5",
  reviewing: "Building SEO/GEO recommendations",
  completed: "Complete",
  failed: "Failed"
};

export function JobProgress({ jobId, initialStatus, initialError }: JobProgressProps) {
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState(initialError);

  useEffect(() => {
    if (status === "completed" || status === "failed") {
      return;
    }

    const interval = window.setInterval(async () => {
      const response = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
      if (!response.ok) {
        return;
      }

      const job = await response.json();
      setStatus(job.status);
      setError(job.error_message);

      if (job.status === "completed") {
        window.location.reload();
      }
    }, 3000);

    return () => window.clearInterval(interval);
  }, [jobId, status]);

  const progress = progressByStatus[status];
  const progressLabel = useMemo(() => labelByStatus[status], [status]);

  return (
    <div className="progress-card" aria-live="polite">
      <div className="progress-heading">
        <span className={`status ${status === "failed" ? "status-error" : ""}`}>{status}</span>
        <strong>{progressLabel}</strong>
        <span className="muted">{progress}%</span>
      </div>
      <div className="progress-track" aria-label={`Job progress ${progress}%`}>
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      {status !== "completed" && status !== "failed" ? (
        <p className="muted">This page updates automatically while the worker runs.</p>
      ) : null}
      {error ? <p className="error-text">{error}</p> : null}
    </div>
  );
}
