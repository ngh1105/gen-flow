import { describe, expect, test } from "vitest";

import vercelConfig from "../../vercel.json";

describe("Vercel configuration", () => {
  test("allows Next.js inline hydration scripts in the CSP", () => {
    const cspHeader = vercelConfig.headers
      .flatMap((route) => route.headers)
      .find((header) => header.key === "Content-Security-Policy");

    const scriptSrc = cspHeader?.value
      .split(";")
      .map((directive) => directive.trim())
      .find((directive) => directive.startsWith("script-src"));

    expect(scriptSrc).toContain("'unsafe-inline'");
  });
});
