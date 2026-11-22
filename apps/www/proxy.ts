import { isMarkdownPreferred, rewritePath } from "fumadocs-core/negotiation";
import { type NextRequest, NextResponse } from "next/server";
import { withTrail } from "trail-analytics/next/proxy";
import { docsContentRoute, docsRoute } from "@/lib/shared";

const { rewrite: rewriteDocs } = rewritePath(`${docsRoute}{/*path}`, `${docsContentRoute}{/*path}/content.md`);
const { rewrite: rewriteSuffix } = rewritePath(`${docsRoute}{/*path}.md`, `${docsContentRoute}{/*path}/content.md`);

// Pages run the proxy so Trail sees AI crawler hits; static files skip it. Pages stay prerendered.
// /t/t.js and /t/e are Trail's first-party script and beacon, listed apart since they end in .js.
export const config = {
  matcher: ["/((?!_next/|t/|.*\\.(?:js|css|json|png|jpg|jpeg|webp|svg|ico|mp4|webm|woff2?)$).*)", "/t/t.js", "/t/e"],
};

const isDocs = (path: string) => path === "/docs" || path === "/docs.md" || path.startsWith("/docs/");

// `/docs/x.md`, or `/docs/x` requested with `Accept: text/markdown`, serves the page as markdown for agents.
// Other paths continue untouched; withTrail reports crawlers and serves /t/*.
function proxy(request: NextRequest) {
  if (!isDocs(request.nextUrl.pathname)) return NextResponse.next();
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

// ponytail: Trail types the request as a plain Request; Next always passes a NextRequest here.
export default withTrail((request) => proxy(request as NextRequest));
