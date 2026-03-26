import { describe, expect, it } from "vitest";

import { resolveBuilderCode } from "@/lib/builderCode";

describe("builderCode", () => {
  it("prefers the active custom code override when present", () => {
    expect(resolveBuilderCode("print('generated')", "print('custom')")).toBe(
      "print('custom')"
    );
  });

  it("falls back to generated code when no override exists", () => {
    expect(resolveBuilderCode("print('generated')", "")).toBe(
      "print('generated')"
    );
  });
});
