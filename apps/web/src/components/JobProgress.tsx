"use client";

import { useEffect, useMemo, useState } from "react";

type JobStatus = "queued" | "researching" | "drafting" | "reviewing" | "completed" | "failed";
type DetailedJobStatus =
  | JobStatus
  | "preparing"
  | "keyword_research"
  | "source_research"
  | "technical_audit"
  | "saving_research"
  | "generating_rewrites"
  | "saving_recommendations";

type JobProgressProps = {
  jobId: string;
  initialStatus: DetailedJobStatus;
  initialError?: string | null;
};

const progressByStatus: Record<DetailedJobStatus, number> = {
  queued: 8,
  preparing: 16,
  researching: 28,
  keyword_research: 28,
  source_research: 42,
  technical_audit: 54,
  saving_research: 62,
  drafting: 72,
  reviewing: 82,
  generating_rewrites: 82,
  saving_recommendations: 94,
  completed: 100,
  failed: 100
};

const labelByStatus: Record<DetailedJobStatus, string> = {
  queued: "Queued for worker",
  preparing: "Cleaning article copy and preparing inputs",
  researching: "Collecting research signals",
  keyword_research: "Pulling SEMrush keyword opportunities",
  source_research: "Gathering supplemental source context",
  technical_audit: "Checking technical SEO signals",
  saving_research: "Saving research artifacts",
  drafting: "Drafting article options with GPT-5",
  reviewing: "Building SEO/GEO recommendations",
  generating_rewrites: "Generating copy-ready rewrite options",
  saving_recommendations: "Saving recommendations",
  completed: "Complete",
  failed: "Failed"
};

const stageOrder: DetailedJobStatus[] = [
  "queued",
  "preparing",
  "keyword_research",
  "source_research",
  "technical_audit",
  "saving_research",
  "generating_rewrites",
  "saving_recommendations",
  "completed"
];

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
      <ol className="progress-steps">
        {stageOrder.map((stage) => (
          <li
            className={progressByStatus[stage] <= progress ? "step-complete" : undefined}
            key={stage}
          >
            {labelByStatus[stage]}
          </li>
        ))}
      </ol>
      {status !== "completed" && status !== "failed" ? (
        <p className="muted">This page updates automatically while the worker runs.</p>
      ) : null}
      {status === "failed" ? (
        <div className="error-panel">
          <strong>Run failed</strong>
          <p>{error || "The worker failed without returning a detailed error."}</p>
        </div>
      ) : null}
    </div>
  );
}
