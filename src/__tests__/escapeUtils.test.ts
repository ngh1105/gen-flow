import { describe, it, expect } from "vitest";
import { escapePythonString, sanitizeClassName, sanitizeURL } from "@/engine/escapeUtils";

describe("escapePythonString", () => {
  it("escapes double quotes", () => {
    expect(escapePythonString(`say "hello"`)).toBe(`say \\"hello\\"`);
  });

  it("escapes backslashes", () => {
    expect(escapePythonString("a\\b")).toBe("a\\\\b");
  });

  it("escapes newlines", () => {
    expect(escapePythonString("line1\nline2")).toBe("line1\\nline2");
  });

  it("escapes curly braces for f-strings", () => {
    // Input: {"key": "value"} — both braces AND quotes get escaped
    expect(escapePythonString('{"key": "value"}')).toBe('{{\\"key\\": \\"value\\"}}');
  });

  it("handles empty string", () => {
    expect(escapePythonString("")).toBe("");
  });
});

describe("sanitizeClassName", () => {
  it("capitalizes first letter", () => {
    expect(sanitizeClassName("myContract")).toBe("MyContract");
  });

  it("converts spaces to PascalCase", () => {
    expect(sanitizeClassName("my cool contract")).toBe("MyCoolContract");
  });

  it("strips special characters", () => {
    expect(sanitizeClassName("my-contract!")).toBe("Mycontract");
  });

  it("strips leading digits", () => {
    expect(sanitizeClassName("123contract")).toBe("Contract");
  });

  it("returns MyContract for empty input", () => {
    expect(sanitizeClassName("")).toBe("MyContract");
  });

  it("returns MyContract for digits-only input", () => {
    expect(sanitizeClassName("123")).toBe("MyContract");
  });
});

describe("sanitizeURL", () => {
  it("returns given valid URL as-is", () => {
    expect(sanitizeURL("https://api.example.com")).toBe("https://api.example.com");
  });

  it("prepends https:// for partial URLs", () => {
    expect(sanitizeURL("api.example.com")).toBe("https://api.example.com");
  });

  it("returns placeholder for empty input", () => {
    expect(sanitizeURL("")).toBe("https://example.com");
  });
});
