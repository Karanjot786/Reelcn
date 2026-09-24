import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  agentRules: false,
  // Registry items ship as TypeScript source; the site compiles them like its own files.
  transpilePackages: ["@reelcn/registry"],
  // /r/custom reads the item's source at request time to validate props (lib/props-table.ts).
  // ponytail: unverified until a deploy; precompute props per item at build if tracing misses type imports.
  outputFileTracingIncludes: { "/r/custom/[item]/[payload]": ["../../registry/items/**"] },
  async headers() {
    const noindex = [{ key: "X-Robots-Tag", value: "noindex" }];
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      // Registry payloads are for the shadcn CLI and /api for the docs search box, not for search results.
      { source: "/r/:path*", headers: noindex },
      { source: "/api/:path*", headers: noindex },
    ];
  },
};

export default withMDX(config);
