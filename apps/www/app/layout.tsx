import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import { Archivo, Caveat } from "next/font/google";
import { SITE_URL } from "@/lib/registry";
import "./global.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo" });
const caveat = Caveat({ subsets: ["latin"], weight: "600", variable: "--font-caveat" });

export const metadata: Metadata = {
  // Makes og:image absolute. SITE_URL is registry.json's homepage (https://reelcn.dev after Task 12).
  metadataBase: new URL(SITE_URL),
  // X falls back to og:image when twitter:image is missing; this makes it show large.
  twitter: { card: "summary_large_image" },
  title: { default: "reelcn: Remotion components you own", template: "%s | reelcn" },
  description:
    "Copy-paste Remotion components for product demos, shorts and explainers. Restyle from one theme and render at 16:9, 9:16 and 1:1.",
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} ${caveat.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider search={{ options: { type: "static" } }}>{children}</RootProvider>
      </body>
    </html>
  );
}
