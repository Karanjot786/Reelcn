import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Registry items ship as TypeScript source; the site compiles them like its own files.
  transpilePackages: ["@reelcn/registry"],
};

export default withMDX(config);
