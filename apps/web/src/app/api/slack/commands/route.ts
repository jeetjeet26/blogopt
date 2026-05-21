import { NextResponse } from "next/server";
import { articleBriefSchema } from "@blogoptimizer/shared";
import { getEnv } from "@/lib/env";
import { createOptimizationJob, listJobs } from "@/lib/jobs";
import { jobUrl } from "@/lib/slack";
import { verifySlackSignature } from "@/lib/security";

export async function POST(request: Request) {
  const env = getEnv();
  const rawBody = await request.text();

  if (
    env.SLACK_SIGNING_SECRET &&
    !verifySlackSignature({
      signingSecret: env.SLACK_SIGNING_SECRET,
      timestamp: request.headers.get("x-slack-request-timestamp"),
      rawBody,
      signature: request.headers.get("x-slack-signature")
    })
  ) {
    return NextResponse.json({ error: "Invalid Slack signature" }, { status: 401 });
  }

  const form = new URLSearchParams(rawBody);
  const command = form.get("command") || "";
  const text = form.get("text")?.trim() || "";

  if (text.startsWith("status")) {
    const id = text.replace(/^status\s*/, "").trim();
    return NextResponse.json({
      response_type: "ephemeral",
      text: id ? `Open job status: ${jobUrl(id)}` : "Use `status <job-id>`."
    });
  }

  if (text === "latest") {
    const jobs = await listJobs(5);
    return NextResponse.json({
      response_type: "ephemeral",
      text:
        jobs.map((job) => `${job.articles?.title || "Untitled"}: ${job.status} ${jobUrl(job.id)}`).join("\n") ||
        "No jobs yet."
    });
  }

  if (command === "/buzz-write") {
    const brief = articleBriefSchema.parse({
      topic: text || "New P11creative real estate marketing article",
      audience: "Real estate marketing decision makers",
      goal: "Create an authoritative SEO and GEO ready blog article",
      requiredTalkingPoints: []
    });
    const job = await createOptimizationJob({
      mode: "write",
      brief,
      submitterLabel: `slack:${form.get("user_name") || form.get("user_id") || "unknown"}`,
      slack: slackContext(form)
    });

    return NextResponse.json({
      response_type: "in_channel",
      text: `Started article brief job: ${jobUrl(job.id)}`
    });
  }

  return NextResponse.json({
    response_type: "ephemeral",
    text: "Use `/buzz-optimize latest`, `/buzz-optimize status <job-id>`, or `/buzz-write <topic>`."
  });
}

function slackContext(form: URLSearchParams) {
  return {
    teamId: form.get("team_id") || undefined,
    channelId: form.get("channel_id") || undefined,
    channelName: form.get("channel_name") || undefined,
    userId: form.get("user_id") || undefined,
    responseUrl: form.get("response_url") || undefined
  };
}
