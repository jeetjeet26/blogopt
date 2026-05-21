import Link from "next/link";
import { BriefChat } from "@/components/BriefChat";

export default function WritePage() {
  return (
    <div className="stack">
      <Link className="button" href="/">
        Back to dashboard
      </Link>
      <section className="hero stack">
        <span className="eyebrow">GPT-5 Content Agent</span>
        <h1>Build a new Buzz article through a guided brief.</h1>
        <p className="muted">
          The agent asks for the missing strategic details, extracts the brief, then launches the
          SEMrush, Screaming Frog, web research, and drafting pipeline.
        </p>
      </section>
      <BriefChat />
    </div>
  );
}
