import { isMarkdownPreferred, rewritePath } from "fumadocs-core/negotiation";
import { type NextRequest, NextResponse } from "next/server";
import { docsContentRoute, docsRoute } from "@/lib/shared";

const { rewrite: rewriteDocs } = rewritePath(`${docsRoute}{/*path}`, `${docsContentRoute}{/*path}/content.md`);
const { rewrite: rewriteSuffix } = rewritePath(`${docsRoute}{/*path}.md`, `${docsContentRoute}{/*path}/content.md`);

// Scope the proxy to docs paths only, so it's the sole request-time function on the site
// (everything else stays static/prerendered).
export const config = { matcher: ["/docs", "/docs.md", "/docs/:path*"] };

// `/docs/x.md`, or `/docs/x` requested with `Accept: text/markdown`, serves the page as markdown for agents.
export default function proxy(request: NextRequest) {
  const suffixed = rewriteSuffix(request.nextUrl.pathname);
  if (suffixed) return NextResponse.rewrite(new URL(suffixed, request.nextUrl));
  if (isMarkdownPreferred(request)) {
    const negotiated = rewriteDocs(request.nextUrl.pathname);
    if (negotiated) return NextResponse.rewrite(new URL(negotiated, request.nextUrl), { headers: { Vary: "Accept" } });
  }
  const response = NextResponse.next();
  response.headers.set("Vary", "Accept");
  return response;
}
