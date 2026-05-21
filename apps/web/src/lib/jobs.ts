import type { ArticleBrief, ArticleInput, JobMode } from "@blogoptimizer/shared";
import { getEnv } from "./env";
import { getSupabaseAdmin } from "./supabase";

type CreateJobInput =
  | {
      mode: "optimize";
      article: ArticleInput;
      submitterLabel?: string;
      slack?: SlackContext;
    }
  | {
      mode: "write";
      brief: ArticleBrief;
      submitterLabel?: string;
      slack?: SlackContext;
    };

type SlackContext = {
  teamId?: string;
  channelId?: string;
  channelName?: string;
  userId?: string;
  responseUrl?: string;
};

export async function createOptimizationJob(input: CreateJobInput) {
  const supabase = getSupabaseAdmin();

  const article =
    input.mode === "optimize"
      ? await createArticle(input.article)
      : await createArticleFromBrief(input.brief);

  const { data: job, error } = await supabase
    .from("optimization_jobs")
    .insert({
      mode: input.mode,
      status: "queued",
      article_id: article.id,
      submitter_label: input.submitterLabel,
      slack_team_id: input.slack?.teamId,
      slack_channel_id: input.slack?.channelId,
      slack_channel_name: input.slack?.channelName,
      slack_user_id: input.slack?.userId,
      slack_response_url: input.slack?.responseUrl,
      requested_checks: ["seo", "geo", "web_research", "semrush", "screaming_frog"]
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await enqueueWorker(job.id, input.mode);

  return job;
}

export async function listJobs(limit = 10) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("optimization_jobs")
    .select("*, articles(title, source_url)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data;
}

export async function getJob(jobId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("optimization_jobs")
    .select(
      "*, articles(*), recommendations(*), seo_research(*), source_research(*), technical_audits(*)"
    )
    .eq("id", jobId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function createArticle(article: ArticleInput) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("articles")
    .insert({
      title: article.title,
      body: article.body,
      source_url: article.sourceUrl || null,
      author: article.author || null,
      target_market: article.targetMarket || null,
      notes: article.notes || null,
      input_type: "uploaded"
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function createArticleFromBrief(brief: ArticleBrief) {
  const supabase = getSupabaseAdmin();

  const { data: article, error: articleError } = await supabase
    .from("articles")
    .insert({
      title: brief.topic,
      body: brief.sourceMaterial || "",
      target_market: brief.targetMarket || null,
      notes: brief.toneNotes || null,
      input_type: "generated"
    })
    .select("*")
    .single();

  if (articleError) {
    throw articleError;
  }

  const { error: briefError } = await supabase.from("article_briefs").insert({
    article_id: article.id,
    topic: brief.topic,
    audience: brief.audience,
    goal: brief.goal,
    target_market: brief.targetMarket || null,
    point_of_view: brief.pointOfView || null,
    required_talking_points: brief.requiredTalkingPoints,
    source_material: brief.sourceMaterial || null,
    tone_notes: brief.toneNotes || null,
    approval_state: "draft"
  });

  if (briefError) {
    throw briefError;
  }

  return article;
}

async function enqueueWorker(jobId: string, mode: JobMode) {
  const env = getEnv();

  const response = await fetch(`${env.WORKER_API_URL}/jobs/${jobId}/run`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.WORKER_API_TOKEN}`
    },
    body: JSON.stringify({ mode })
  }).catch(() => null);

  if (!response?.ok) {
    const supabase = getSupabaseAdmin();
    await supabase.from("optimization_jobs").update({ status: "queued" }).eq("id", jobId);
  }
}
