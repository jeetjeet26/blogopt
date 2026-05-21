import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string()
    })
  )
});

export async function POST(request: Request) {
  const { messages } = requestSchema.parse(await request.json());
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is required" }, { status: 500 });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are the P11creative article briefing agent. Ask one useful question at a time until the brief has enough detail. Return JSON with reply, ready boolean, and brief fields: topic, audience, goal, targetMarket, pointOfView, sourceMaterial, toneNotes, requiredTalkingPoints."
        },
        ...messages
      ]
    })
  });

  if (!response.ok) {
    return NextResponse.json({ error: "OpenAI request failed" }, { status: 502 });
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content || "{}";

  return NextResponse.json(JSON.parse(content));
}
