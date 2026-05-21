"use client";

import { FormEvent, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Brief = {
  topic?: string;
  audience?: string;
  goal?: string;
  targetMarket?: string;
  pointOfView?: string;
  sourceMaterial?: string;
  toneNotes?: string;
  requiredTalkingPoints?: string[];
};

export function BriefChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Tell me what article you want to create. Include the topic, audience, goal, or any rough notes you already have."
    }
  ]);
  const [input, setInput] = useState("");
  const [brief, setBrief] = useState<Brief>({});
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.trim()) {
      return;
    }

    const nextMessages = [...messages, { role: "user" as const, content: input.trim() }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    const response = await fetch("/api/agent/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: nextMessages })
    });
    const payload = await response.json();

    setMessages([...nextMessages, { role: "assistant", content: payload.reply || "Got it." }]);
    setBrief(payload.brief || payload);
    setReady(Boolean(payload.ready));
    setLoading(false);
  }

  async function startJob() {
    const response = await fetch("/api/articles", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        mode: "write",
        topic: brief.topic,
        audience: brief.audience,
        goal: brief.goal,
        targetMarket: brief.targetMarket,
        pointOfView: brief.pointOfView,
        sourceMaterial: brief.sourceMaterial,
        toneNotes: brief.toneNotes,
        requiredTalkingPoints: brief.requiredTalkingPoints || []
      })
    });
    const payload = await response.json();
    window.location.href = `/jobs/${payload.jobId}`;
  }

  return (
    <section className="grid">
      <div className="card stack">
        <h2>Briefing Conversation</h2>
        <div className="stack">
          {messages.map((message, index) => (
            <p key={`${message.role}-${index}`}>
              <strong>{message.role === "assistant" ? "Agent" : "You"}:</strong> {message.content}
            </p>
          ))}
        </div>
        <form className="stack" onSubmit={sendMessage}>
          <textarea value={input} onChange={(event) => setInput(event.target.value)} />
          <button type="submit" disabled={loading}>
            {loading ? "Thinking..." : "Send"}
          </button>
        </form>
      </div>

      <aside className="card stack">
        <h2>Extracted Brief</h2>
        <p>
          <strong>Topic:</strong> {brief.topic || "Not captured yet"}
        </p>
        <p>
          <strong>Audience:</strong> {brief.audience || "Not captured yet"}
        </p>
        <p>
          <strong>Goal:</strong> {brief.goal || "Not captured yet"}
        </p>
        <p>
          <strong>Market:</strong> {brief.targetMarket || "Not specified"}
        </p>
        <p>
          <strong>POV:</strong> {brief.pointOfView || "Not specified"}
        </p>
        <button type="button" disabled={!ready} onClick={startJob}>
          Generate Article
        </button>
        {!ready ? <p className="muted">The agent will enable generation when the brief is ready.</p> : null}
      </aside>
    </section>
  );
}
