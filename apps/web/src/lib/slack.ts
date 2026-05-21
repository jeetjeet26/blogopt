import { getEnv } from "./env";

export async function postSlackMessage({
  channel,
  text,
  blocks
}: {
  channel: string;
  text: string;
  blocks?: unknown[];
}) {
  const env = getEnv();
  if (!env.SLACK_BOT_TOKEN) {
    return;
  }

  await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      channel,
      text,
      blocks
    })
  });
}

export function jobUrl(jobId: string) {
  return `${getEnv().NEXT_PUBLIC_APP_URL}/jobs/${jobId}`;
}
