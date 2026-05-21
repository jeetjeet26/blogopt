# Slack App Setup

The app exposes one Slack endpoint:

```text
POST /api/slack/commands
```

Configure two slash commands in Slack:

- `/buzz-optimize`: supports `latest` and `status <job-id>`.
- `/buzz-write`: starts a new article writing job from the command text and links back to the web review page.

Required Slack environment variables:

- `SLACK_SIGNING_SECRET`: verifies incoming Slack requests.
- `SLACK_BOT_TOKEN`: used for future proactive job notifications.
- `SLACK_DEFAULT_CHANNEL`: optional fallback channel for completion notices.

Slack requests are verified with the `x-slack-signature` and `x-slack-request-timestamp` headers. Draft content is not posted back into Slack by default; Slack receives links and concise job summaries so confidential article content stays in the app.
