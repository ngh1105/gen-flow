import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

const css = readFileSync("src/app/globals.css", "utf8");

function tokenValue(name: string): string {
  const match = css.match(new RegExp(`${name}:\\s*(#[0-9A-Fa-f]{6})`));
  return match?.[1] ?? "";
}

describe("premium dark theme tokens", () => {
  test("uses a softened dark background instead of pure black", () => {
    expect(tokenValue("--background")).not.toBe("#000000");
    expect(tokenValue("--background")).toBe("#070A12");
  });

  test("defines real accent colors for demo hierarchy", () => {
    expect(tokenValue("--accent-blue")).toBe("#38BDF8");
    expect(tokenValue("--accent-green")).toBe("#34D399");
    expect(tokenValue("--accent-orange")).toBe("#F59E0B");
  });
});
