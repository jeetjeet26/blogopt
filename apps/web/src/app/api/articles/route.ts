import { NextResponse } from "next/server";
import { articleBriefSchema, articleInputSchema } from "@blogoptimizer/shared";
import { createOptimizationJob } from "@/lib/jobs";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  const payload = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries());

  const mode = payload.mode;

  if (mode === "write") {
    const brief = articleBriefSchema.parse({
      topic: payload.topic,
      audience: payload.audience,
      goal: payload.goal,
      targetMarket: payload.targetMarket || undefined,
      pointOfView: payload.pointOfView || undefined,
      sourceMaterial: payload.sourceMaterial || undefined,
      toneNotes: payload.toneNotes || undefined,
      requiredTalkingPoints: Array.isArray(payload.requiredTalkingPoints)
        ? payload.requiredTalkingPoints
        : []
    });

    const job = await createOptimizationJob({ mode, brief, submitterLabel: "web" });
    return redirectOrJson(request, job.id);
  }

  const article = articleInputSchema.parse({
    title: payload.title,
    body: payload.body,
    sourceUrl: payload.sourceUrl || undefined,
    author: payload.author || undefined,
    targetMarket: payload.targetMarket || undefined,
    notes: payload.notes || undefined
  });

  const job = await createOptimizationJob({ mode: "optimize", article, submitterLabel: "web" });
  return redirectOrJson(request, job.id);
}

function redirectOrJson(request: Request, jobId: string) {
  const accepts = request.headers.get("accept") || "";
  if (accepts.includes("text/html")) {
    return NextResponse.redirect(new URL(`/jobs/${jobId}`, request.url), 303);
  }

  return NextResponse.json({ jobId });
}
