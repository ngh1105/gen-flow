import type { NextConfig } from "next";

/**
 * Security headers for production deployment.
 * ⚠️  `output: "export"` means headers() is IGNORED by Next.js static export.
 * Apply these at your CDN / web server level instead:
 *   - Vercel: vercel.json > "headers"
 *   - nginx:  add_header directives in server block
 *   - Cloudflare Pages: _headers file in /public
 *
 * Reference values (copy to your deployment config):
 *   X-Frame-Options: DENY
 *   X-Content-Type-Options: nosniff
 *   Referrer-Policy: strict-origin-when-cross-origin
 *   Permissions-Policy: camera=(), microphone=(), geolocation=()
 *   Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; worker-src blob:; connect-src 'self'; img-src 'self' data:; font-src 'self' data:
 */
export const SECURITY_HEADERS_REFERENCE = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; worker-src blob:; connect-src 'self'; img-src 'self' data:; font-src 'self' data:",
  },
] as const;

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
