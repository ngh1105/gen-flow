/**
 * Escape a string for safe insertion into a Python f-string literal.
 * Handles quotes, backslashes, newlines, and curly braces.
 */
export function escapePythonString(input: string): string {
  return input
    .replace(/\\/g, "\\\\") // backslashes first
    .replace(/"/g, '\\"') // double quotes
    .replace(/\n/g, "\\n") // newlines
    .replace(/\r/g, "\\r") // carriage returns
    .replace(/\t/g, "\\t") // tabs
    .replace(/\{/g, "{{") // escape { for f-strings
    .replace(/\}/g, "}}"); // escape } for f-strings
}

/**
 * Sanitize a class name for Python: PascalCase, alphanumeric only.
 * Strips leading digits to ensure valid Python identifier.
 * Returns "MyContract" if input is empty or invalid.
 */
export function sanitizeClassName(input: string): string {
  let cleaned = input.replace(/[^a-zA-Z0-9\s]/g, "").trim();
  if (!cleaned) return "MyContract";

  // Strip leading digits (invalid Python identifier)
  cleaned = cleaned.replace(/^\d+/, "");
  if (!cleaned) return "MyContract";

  // If single word (no spaces), preserve original casing but ensure first letter is uppercase
  if (!cleaned.includes(" ")) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  // Multiple words: capitalize first letter of each word
  return cleaned
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

/**
 * Sanitize a URL string. Returns a placeholder if clearly invalid.
 */
export function sanitizeURL(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "https://example.com";

  // Basic URL validation
  try {
    new URL(trimmed);
    return trimmed;
  } catch {
    // If it looks like a partial URL, prepend https://
    if (trimmed.includes(".") && !trimmed.startsWith("http")) {
      return `https://${trimmed}`;
    }
    return trimmed; // Return as-is, user may be typing
  }
}
