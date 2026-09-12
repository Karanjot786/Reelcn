import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import { Archivo, Caveat } from "next/font/google";
import "./global.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo" });
const caveat = Caveat({ subsets: ["latin"], weight: "600", variable: "--font-caveat" });

export const metadata: Metadata = {
  title: { default: "reelcn: Remotion components you own", template: "%s | reelcn" },
  description:
    "Copy-paste Remotion components for product demos, shorts and explainers. Restyle from one theme and render at 16:9, 9:16 and 1:1.",
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} ${caveat.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
