import { jsonLd } from "@/lib/json-ld";

/** Structured data for search engines and AI crawlers, rendered as a JSON-LD script tag. */
export function JsonLd({ data }: { data: object }) {
  // JSON-LD is raw script text; jsonLd() escapes "<" so no value can break out of the tag.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />;
}
