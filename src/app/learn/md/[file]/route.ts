import { index } from "@/lib/index";
import { articleMarkdown } from "@/lib/markdown";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-static";
export const dynamicParams = false;
export const generateStaticParams = () => index().guides.map((g) => ({ file: `${g.slug}.md` }));

/**
 * An article as plain Markdown, at /learn/md/<slug>.md. The article's own page names it in its
 * head (rel="alternate", type text/markdown), and /learn/<slug>.md leads here. It is the same
 * article, so it names the page as the one to index.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const g = index().guideBySlug.get(file.replace(/\.md$/, ""));
  if (!g) return new Response("No such article.", { status: 404 });
  return new Response(articleMarkdown(g), {
    headers: { "Content-Type": "text/markdown; charset=utf-8", Link: `<${siteUrl}/learn/${g.slug}>; rel="canonical"`, "X-Robots-Tag": "noindex", "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
