import { getJob } from "@/lib/jobs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id);
  const recommendation = job.recommendations?.[0]?.payload;
  const brief = Array.isArray(job.articles?.article_briefs)
    ? job.articles.article_briefs[0]
    : undefined;
  const researchPayloads = {
    semrush: job.seo_research?.[0]?.payload ?? [],
    webSources: job.source_research?.[0]?.payload ?? [],
    technicalAudit: job.technical_audits?.[0]?.payload ?? {}
  };
  const draftOptions = recommendation?.rewriteOptions || [];

  const markdown = [
    `# ${job.articles?.title || "Untitled article"}`,
    "",
    `Status: ${job.status}`,
    `Mode: ${job.mode}`,
    "",
    "## Draft",
    "",
    job.articles?.body || "",
    "",
    ...(brief
      ? [
          "## Brief Payload",
          "",
          "```json",
          JSON.stringify(brief, null, 2),
          "```",
          ""
        ]
      : []),
    ...(draftOptions.length
      ? [
          "## Article Draft Options",
          "",
          ...draftOptions.flatMap(
            (option: { optionName?: string; fullDraft?: string }, index: number) => [
              `### Option ${index + 1}: ${option.optionName || "Draft"}`,
              "",
              option.fullDraft || "",
              ""
            ]
          )
        ]
      : []),
    "## Research Payloads Injected",
    "",
    "```json",
    JSON.stringify(researchPayloads, null, 2),
    "```",
    "",
    "## Recommendations",
    "",
    recommendation ? JSON.stringify(recommendation, null, 2) : "No recommendations yet."
  ].join("\n");

  return new Response(markdown, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": `attachment; filename=\"${id}.md\"`
    }
  });
}
