import crypto from "node:crypto";

export function verifySlackSignature({
  signingSecret,
  timestamp,
  rawBody,
  signature
}: {
  signingSecret: string;
  timestamp: string | null;
  rawBody: string;
  signature: string | null;
}) {
  if (!timestamp || !signature) {
    return false;
  }

  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > 60 * 5) {
    return false;
  }

  const base = `v0:${timestamp}:${rawBody}`;
  const digest = `v0=${crypto.createHmac("sha256", signingSecret).update(base).digest("hex")}`;

  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

export function isInternalRequest(request: Request) {
  const password = process.env.INTERNAL_APP_PASSWORD;
  if (!password) {
    return true;
  }

  return request.headers.get("x-internal-app-password") === password;
}
