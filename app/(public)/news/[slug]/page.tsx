import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const article = await prisma.news.findUnique({ where: { slug } });
    return { title: article?.title || "News", description: article?.excerpt };
  } catch {
    return { title: "News" };
  }
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let article;
  try {
    article = await prisma.news.findUnique({
      where: { slug, isPublished: true },
      include: { author: { select: { name: true } } },
    });
  } catch {
    article = null;
  }

  if (!article) notFound();

  return (
    <div>
      <article style={{ padding: "4rem 0" }}>
        <div className="container-sm">
          {/* Tags */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            {article.tags.map((tag) => (
              <span key={tag} className="badge badge-cosmic">{tag}</span>
            ))}
          </div>

          {/* Title */}
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 900, letterSpacing: "0.03em", lineHeight: 1.15, marginBottom: "1.25rem" }}>
            {article.title}
          </h1>

          {/* Meta */}
          <div style={{ display: "flex", gap: "1.5rem", color: "var(--color-text-muted)", fontSize: "0.875rem", marginBottom: "3rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "1.5rem" }}>
            <span>✍️ {article.author.name}</span>
            {article.publishedAt && (
              <span>📅 {new Date(article.publishedAt).toLocaleDateString("en-LK", { day: "numeric", month: "long", year: "numeric" })}</span>
            )}
          </div>

          {/* Content */}
          <div className="article-content" dangerouslySetInnerHTML={{ __html: article.content }} />
        </div>
      </article>
    </div>
  );
}
