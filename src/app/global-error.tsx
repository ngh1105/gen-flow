"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/browser";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="max-w-md w-full border border-border bg-surface p-6 text-center">
          <h2 className="text-xl font-bold mb-3">Something went wrong</h2>
          <p className="text-sm text-muted mb-4">
            The error has been recorded. Please try again.
          </p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-foreground text-background text-sm font-medium hover:opacity-90 transition-all duration-150"
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
