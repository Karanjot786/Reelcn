import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  agentRules: false,
  // Registry items ship as TypeScript source; the site compiles them like its own files.
  transpilePackages: ["@reelcn/registry"],
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
