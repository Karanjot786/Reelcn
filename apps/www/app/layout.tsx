import { Analytics } from "@vercel/analytics/next";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Sans_Condensed } from "next/font/google";
import { ClarityAnalytics } from "@/components/clarity";
import { JsonLd } from "@/components/json-ld";
import { REPO_URL } from "@/lib/layout.shared";
import { SITE_URL } from "@/lib/registry";
import "./global.css";

const sans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans" });
const display = IBM_Plex_Sans_Condensed({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-display" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

const DESCRIPTION =
  "Copy-paste Remotion components for product demos, shorts and explainers. Restyle from one theme and render at 16:9, 9:16 and 1:1.";

export const metadata: Metadata = {
  // Makes og:image absolute. SITE_URL is registry.json's homepage (https://www.reelcn.dev after Task 12).
  metadataBase: new URL(SITE_URL),
  // X falls back to og:image when twitter:image is missing; this makes it show large.
  twitter: { card: "summary_large_image" },
  title: { default: "reelcn: Remotion components you own", template: "%s | reelcn" },
  description: DESCRIPTION,
};

// Who publishes the site, and the site itself; pages point at these by @id.
const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "reelcn",
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
      sameAs: [REPO_URL],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "reelcn",
      url: SITE_URL,
      description: DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`dark ${sans.variable} ${display.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <JsonLd data={siteJsonLd} />
        <RootProvider theme={{ defaultTheme: "dark", forcedTheme: "dark" }} search={{ options: { type: "static" } }}>
          {children}
        </RootProvider>
        {/* Page views and referrers, so search traffic is visible. Collects nothing until Web Analytics is on in Vercel. */}
        <Analytics />
        <ClarityAnalytics />
      </body>
    </html>
  );
}
