import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";
import { JobProgress } from "@/components/JobProgress";
import { getJob } from "@/lib/jobs";

export const dynamic = "force-dynamic";

type RewriteOption = {
  optionName: string;
  useWhen: string;
  strategy: string;
  primaryKeyword?: string;
  supportingKeywords?: string[];
  fullDraft: string;
  changeSummary?: string[];
  implementationNotes?: string;
};

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id);
  const recommendation = job.recommendations?.[0]?.payload;
  const isWriteMode = job.mode === "write";
  const brief = Array.isArray(job.articles?.article_briefs)
    ? job.articles.article_briefs[0]
    : undefined;
  const researchPayloads = [
    {
      label: "SEMrush Keyword Payload",
      provider: job.seo_research?.[0]?.provider,
      payload: job.seo_research?.[0]?.payload ?? []
    },
    {
      label: "Web Source Payload",
      provider: job.source_research?.[0]?.provider,
      payload: job.source_research?.[0]?.payload ?? []
    },
    {
      label: "Technical Audit Payload",
      provider: job.technical_audits?.[0]?.provider,
      payload: job.technical_audits?.[0]?.payload ?? {}
    }
  ];

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
        <h2>{isWriteMode ? "Brief Source Material" : "Article"}</h2>
        <p className="muted">{job.articles?.source_url}</p>
        <pre>{job.articles?.body || "No draft body yet."}</pre>
      </section>

      {brief ? (
        <section className="card stack">
          <h2>Brief Payload</h2>
          <pre>{JSON.stringify(brief, null, 2)}</pre>
        </section>
      ) : null}

      <section className="card stack">
        <h2>Research Payloads Injected</h2>
        <p className="muted">
          These are the saved research artifacts passed into the LLM for this run.
        </p>
        {researchPayloads.map((item) => (
          <details className="recommendation-block" key={item.label}>
            <summary>
              <strong>{item.label}</strong>
              {item.provider ? <span className="muted"> · {item.provider}</span> : null}
            </summary>
            <pre>{JSON.stringify(item.payload, null, 2)}</pre>
          </details>
        ))}
      </section>

      {recommendation ? (
        <section className="card stack">
          <h2>{isWriteMode ? "Article Drafts and Strategy" : "Recommendations"}</h2>
          <p>{recommendation.summary}</p>

          {recommendation.rewriteOptions?.length ? (
            <DraftOptions options={recommendation.rewriteOptions} isWriteMode={isWriteMode} />
          ) : null}

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

          <h3>Supporting Section-Level Rewrites</h3>
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
                    <strong>Suggested Section Copy</strong>
                    <pre>{item.revised}</pre>
                    <p className="muted">{item.rationale}</p>
                  </article>
                )
              )
            ) : (
              <p className="muted">No rewritten sections were returned for this run.</p>
            )}
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

function DraftOptions({
  options,
  isWriteMode
}: {
  options: RewriteOption[];
  isWriteMode: boolean;
}) {
  return (
    <>
      <h3>{isWriteMode ? "Full Article Draft Options" : "Ready-To-Use Rewrite Options"}</h3>
      <p className="muted">
        {isWriteMode
          ? "Each option is a complete draft with a different strategic emphasis, using the research payloads available for this run."
          : "These are complete copy directions your team can lift, edit, or combine. Each option already incorporates the keyword strategy, SEO findings, GEO readiness, and P11 voice."}
      </p>
      <div className="stack">
        {options.map((option, index) => (
          <article className="recommendation-block" key={`${option.optionName}-${index}`}>
            <div className="block-heading">
              <div>
                <span className="eyebrow">Option {index + 1}</span>
                <h4>{option.optionName}</h4>
              </div>
              <CopyButton value={option.fullDraft} />
            </div>
            <p>
              <strong>Use when:</strong> {option.useWhen}
            </p>
            <p className="muted">{option.strategy}</p>
            <p>
              <strong>Primary keyword:</strong> {option.primaryKeyword || "Not specified"}
            </p>
            {option.supportingKeywords?.length ? (
              <p>
                <strong>Supporting keywords:</strong> {option.supportingKeywords.join(", ")}
              </p>
            ) : null}
            {option.changeSummary?.length ? (
              <ul>
                {option.changeSummary.map((change, changeIndex) => (
                  <li key={`${change}-${changeIndex}`}>{change}</li>
                ))}
              </ul>
            ) : null}
            <strong>{isWriteMode ? "Article Draft" : "Draft Copy"}</strong>
            <textarea className="draft-copy" readOnly value={option.fullDraft} />
            {option.implementationNotes ? (
              <p className="muted">{option.implementationNotes}</p>
            ) : null}
          </article>
        ))}
      </div>
    </>
  );
}
