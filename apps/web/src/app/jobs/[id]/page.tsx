import Link from "next/link";
import type { Recommendation } from "@blogoptimizer/shared";
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
  const recommendation = job.recommendations?.[0]?.payload as Recommendation | undefined;
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
          <RecommendationReport recommendation={recommendation} isWriteMode={isWriteMode} />
        </section>
      ) : (
        <section className="card">
          <p className="muted">Recommendations will appear here when the worker finishes.</p>
        </section>
      )}
    </div>
  );
}

function RecommendationReport({
  recommendation,
  isWriteMode
}: {
  recommendation: Recommendation;
  isWriteMode: boolean;
}) {
  return (
    <>
      <div className="report-intro">
        <div>
          <span className="eyebrow">Recommended Strategy</span>
          <h2>{isWriteMode ? "Article Drafts and Strategy" : "Drafts, Roadmap, and SEO Notes"}</h2>
        </div>
        <p>{recommendation.summary}</p>
      </div>

      {recommendation.rewriteOptions?.length ? (
        <DraftOptions options={recommendation.rewriteOptions} isWriteMode={isWriteMode} />
      ) : null}

      <SectionRewriteCards sections={recommendation.revisedSections} />
      <OverviewCards recommendation={recommendation} />
      <MetadataSnapshot recommendation={recommendation} />
      <PriorityRoadmap actions={recommendation.prioritizedActions} />
      <KeywordPlacementMap items={recommendation.sectionKeywordMap} />
      <KeywordAppendix recommendation={recommendation} />
    </>
  );
}

function OverviewCards({ recommendation }: { recommendation: Recommendation }) {
  const primaryKeyword = recommendation.keywordStrategy?.primaryKeyword;

  return (
    <div className="report-overview" aria-label="Recommendation overview">
      <article className="metric-card">
        <span className="eyebrow">Primary Keyword</span>
        <strong>{primaryKeyword || "Not specified"}</strong>
        <p className="muted">
          {recommendation.keywordStrategy?.primaryIntent || "Intent not specified"}
          {recommendation.keywordStrategy?.primaryVolume
            ? ` · Vol ${recommendation.keywordStrategy.primaryVolume}`
            : ""}
          {recommendation.keywordStrategy?.primaryDifficulty
            ? ` · KD ${recommendation.keywordStrategy.primaryDifficulty}`
            : ""}
        </p>
      </article>
      <article className="metric-card">
        <span className="eyebrow">Recommended Meta Title</span>
        <strong>{recommendation.metaTitle?.recommended || "Not provided"}</strong>
        <p className="muted">{recommendation.metaTitle?.rationale}</p>
      </article>
      <article className="metric-card">
        <span className="eyebrow">Recommended Slug</span>
        <strong>{recommendation.slug?.recommended || "Not provided"}</strong>
        <p className="muted">{recommendation.slug?.rationale}</p>
      </article>
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

function SectionRewriteCards({ sections }: { sections: Recommendation["revisedSections"] }) {
  return (
    <section className="stack">
      <div>
        <span className="eyebrow">Copy-Ready Drafts</span>
        <h3>Recommended Drafts and Rationale</h3>
        <p className="muted">
          Start here: these are the edits users can lift into the article, with the reasoning kept
          beside the copy instead of buried in the audit.
        </p>
      </div>
      <div className="stack">
        {sections?.length ? (
          sections.map((item, index) => (
            <article className="recommendation-block draft-card" key={`${item.section}-${index}`}>
              <div className="block-heading">
                <div>
                  <span className="eyebrow">{item.section}</span>
                  <h4>{titleCase(item.section)} Draft</h4>
                </div>
                <CopyButton value={item.revised} />
              </div>
              <div className="section-copy-grid">
                {item.current ? (
                  <div className="copy-panel">
                    <strong>Current</strong>
                    <pre>{item.current}</pre>
                  </div>
                ) : null}
                <div className="copy-panel copy-panel-recommended">
                  <strong>Suggested Copy</strong>
                  <pre>{item.revised}</pre>
                </div>
              </div>
              <p className="muted">
                <strong>Why this works:</strong> {item.rationale}
              </p>
            </article>
          ))
        ) : (
          <p className="muted">No rewritten sections were returned for this run.</p>
        )}
      </div>
    </section>
  );
}

function MetadataSnapshot({ recommendation }: { recommendation: Recommendation }) {
  return (
    <section className="stack">
      <div>
        <span className="eyebrow">Publishing Setup</span>
        <h3>Metadata Snapshot</h3>
      </div>
      <div className="comparison">
        <article className="recommendation-block">
          <span className="eyebrow">Current Meta Title</span>
          <p>{recommendation.metaTitle?.current || "Not provided"}</p>
        </article>
        <article className="recommendation-block">
          <span className="eyebrow">Recommended Meta Title</span>
          <p>{recommendation.metaTitle?.recommended}</p>
          <p className="muted">{recommendation.metaTitle?.rationale}</p>
        </article>
      </div>
      <div className="comparison">
        <article className="recommendation-block">
          <span className="eyebrow">Current Slug</span>
          <p>{recommendation.slug?.current || "Not provided"}</p>
        </article>
        <article className="recommendation-block">
          <span className="eyebrow">Recommended Slug</span>
          <p>{recommendation.slug?.recommended}</p>
          <p className="muted">{recommendation.slug?.rationale}</p>
        </article>
      </div>
    </section>
  );
}

function PriorityRoadmap({ actions }: { actions: Recommendation["prioritizedActions"] }) {
  if (!actions?.length) {
    return null;
  }

  const groups = [
    { priority: "high", title: "Do First" },
    { priority: "medium", title: "Do Next" },
    { priority: "low", title: "Nice To Have" }
  ] as const;

  return (
    <section className="stack">
      <div>
        <span className="eyebrow">Action Plan</span>
        <h3>Priority Roadmap</h3>
        <p className="muted">
          Supporting tasks are grouped by urgency so the user can act without rereading the full
          recommendation list.
        </p>
      </div>
      <div className="priority-roadmap">
        {groups.map((group) => {
          const groupedActions = actions.filter((item) => item.priority === group.priority);

          return (
            <section className="priority-lane" key={group.priority}>
              <span className="eyebrow">{group.priority} priority</span>
              <h4>{group.title}</h4>
              {groupedActions.length ? (
                groupedActions.map((item, index) => (
                  <article className="roadmap-item" key={`${item.action}-${index}`}>
                    <strong>{item.action}</strong>
                    <div className="impact-meta">
                      {item.keyword ? <span>Keyword: {item.keyword}</span> : null}
                      {item.effort ? <span>Effort: {item.effort}</span> : null}
                    </div>
                    <p className="muted">{item.expectedImpact}</p>
                  </article>
                ))
              ) : (
                <p className="muted">No actions in this lane.</p>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}

function KeywordPlacementMap({ items }: { items: Recommendation["sectionKeywordMap"] }) {
  if (!items?.length) {
    return null;
  }

  return (
    <section className="stack">
      <div>
        <span className="eyebrow">Page Anatomy</span>
        <h3>Keyword Placement Map</h3>
        <p className="muted">
          This turns keyword guidance into a top-to-bottom edit map for the article.
        </p>
      </div>
      <div className="placement-map">
        {items.map((item, index) => (
          <article className="placement-step" key={`${item.section}-${index}`}>
            <span className="placement-number">{index + 1}</span>
            <div>
              <span className="eyebrow">{item.section}</span>
              <h4>{item.targetKeyword}</h4>
              <p>
                <strong>{item.placement}:</strong> {item.exactRecommendation}
              </p>
              <p className="muted">{item.rationale}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function KeywordAppendix({ recommendation }: { recommendation: Recommendation }) {
  return (
    <details className="recommendation-block appendix">
      <summary>
        <strong>Keyword Research Appendix</strong>
        <span className="muted"> Reference material for the strategy above</span>
      </summary>

      {recommendation.keywordStrategy?.rationale ? (
        <p className="muted">{recommendation.keywordStrategy.rationale}</p>
      ) : null}

      {recommendation.keywordStrategy?.secondaryKeywords?.length ? (
        <>
          <h4>Secondary Keywords</h4>
          <div className="keyword-chips">
            {recommendation.keywordStrategy.secondaryKeywords.map((keyword, index) => (
              <span key={`${keyword.keyword}-${index}`}>
                {keyword.keyword}
                {keyword.intent ? ` · ${keyword.intent}` : ""}
              </span>
            ))}
          </div>
        </>
      ) : null}

      {recommendation.keywords?.length ? (
        <>
          <h4>All Keyword Targets</h4>
          <ul className="appendix-list">
            {recommendation.keywords.map((keyword) => (
              <li key={keyword.keyword}>
                <strong>{keyword.keyword}</strong> ({keyword.intent || "intent n/a"}, vol{" "}
                {keyword.volume ?? "n/a"}, KD {keyword.difficulty ?? "n/a"}): {keyword.rationale}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </details>
  );
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
