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
            News &amp; <span className="text-gradient">Announcements</span>
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
                <Link
                  key={article.id}
                  href={`/news/${article.slug}`}
                  className="news-card card"
                  style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}
                >
                  {/* Cover Image */}
                  <div style={{
                    width: "100%",
                    height: "160px",
                    position: "relative",
                    overflow: "hidden",
                    background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(245,158,11,0.08))",
                    flexShrink: 0,
                  }}>
                    {article.imageUrl ? (
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <div style={{
                        width: "100%", height: "100%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "2.5rem", opacity: 0.2,
                      }}>📰</div>
                    )}
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "linear-gradient(to top, rgba(5,13,26,0.85) 0%, transparent 55%)",
                    }} />
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: "1.25rem", flex: 1, display: "flex", flexDirection: "column" }}>
                    <div className="news-tags" style={{ marginBottom: "0.75rem" }}>
                      {article.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="badge badge-cosmic">{tag}</span>
                      ))}
                    </div>
                    <h2 className="news-title" style={{ flex: 1 }}>{article.title}</h2>
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
