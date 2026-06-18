import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "News & Announcements",
  description: "Stay updated with the latest news, research updates, and achievements from SEDS J'pura.",
};

async function getNews() {
  try {
    return await prisma.news.findMany({
      where: { isPublished: true },
      include: { author: { select: { name: true } } },
      orderBy: { publishedAt: "desc" },
    });
  } catch {
    return [];
  }
}

export default async function NewsPage() {
  const articles = await getNews();

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="section-tag">📰 LATEST NEWS</div>
          <h1 className="section-title" style={{ textAlign: "center" }}>
            News & <span className="text-gradient">Announcements</span>
          </h1>
          <p className="section-desc">
            Research updates, achievements, events, and announcements from SEDS J&apos;pura.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {articles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📡</div>
              <h3 className="empty-state-title">No Articles Yet</h3>
              <p>News articles will appear here once published by the SEDS team.</p>
            </div>
          ) : (
            <div className="grid-3">
              {articles.map((article) => (
                <Link key={article.id} href={`/news/${article.slug}`} className="news-card card">
                  <div className="news-tags">
                    {article.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="badge badge-cosmic">{tag}</span>
                    ))}
                  </div>
                  <h2 className="news-title">{article.title}</h2>
                  <p className="news-excerpt">{article.excerpt}</p>
                  <div className="news-meta">
                    <span className="text-muted" style={{ fontSize: "0.8125rem" }}>
                      By {article.author.name}
                    </span>
                    {article.publishedAt && (
                      <span className="text-muted" style={{ fontSize: "0.8125rem" }}>
                        {new Date(article.publishedAt).toLocaleDateString("en-LK", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
