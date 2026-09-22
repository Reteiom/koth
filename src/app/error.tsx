"use client";

import { ErrorState } from "@/components/ui/States";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container page-state">
      <div className="card">
        <ErrorState title="Something went wrong" error={error} onRetry={reset} />
      </div>
    </div>
  );
}
