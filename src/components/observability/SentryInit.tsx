"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/browser";

let sentryInitialized = false;

function parseSampleRate(raw: string | undefined, fallback: number): number {
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  if (value < 0 || value > 1) return fallback;
  return value;
}

export default function SentryInit() {
  useEffect(() => {
    if (sentryInitialized) return;

    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) return;

    Sentry.init({
      dsn,
      environment: process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV,
      release: process.env.NEXT_PUBLIC_APP_RELEASE,
      tracesSampleRate: parseSampleRate(
        process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
        0.1
      ),
      replaysSessionSampleRate: parseSampleRate(
        process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
        0.0
      ),
      replaysOnErrorSampleRate: parseSampleRate(
        process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE,
        1.0
      ),
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
    });

    sentryInitialized = true;
  }, []);

  return null;
}
