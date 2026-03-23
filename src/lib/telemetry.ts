"use client";

import * as Sentry from "@sentry/browser";

type BuilderTelemetryPayload = Record<string, string | number | boolean | string[] | null | undefined>;

function sanitizePayload(
  payload: BuilderTelemetryPayload = {}
): Record<string, string | number | boolean | string[]> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null)
  ) as Record<string, string | number | boolean | string[]>;
}

export function addBuilderBreadcrumb(
  message: string,
  payload: BuilderTelemetryPayload = {}
) {
  if (!Sentry.getClient()) return;

  Sentry.addBreadcrumb({
    category: "genflow.builder",
    level: "info",
    message,
    data: sanitizePayload(payload),
  });
}

export function captureBuilderEvent(
  message: string,
  payload: BuilderTelemetryPayload = {}
) {
  addBuilderBreadcrumb(message, payload);

  if (!Sentry.getClient()) return;

  Sentry.captureMessage(message, {
    level: "info",
    tags: {
      area: "builder",
    },
    extra: sanitizePayload(payload),
  });
}
