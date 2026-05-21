import { getJob } from "@/lib/jobs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id);
  const recommendation = job.recommendations?.[0]?.payload;

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
