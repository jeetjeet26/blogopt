"use client";

import { useState } from "react";

export function SubmitButton({
  children,
  pendingText
}: {
  children: React.ReactNode;
  pendingText: string;
}) {
  const [submitting, setSubmitting] = useState(false);

  return (
    <button type="submit" disabled={submitting} onClick={() => setSubmitting(true)}>
      {submitting ? pendingText : children}
    </button>
  );
}
