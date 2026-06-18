"use client";

import { useState, useTransition } from "react";
import { createNewsAction, updateNewsAction, deleteNewsAction } from "@/lib/actions/admin";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/admin/ImageUpload";

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  imageUrl: string | null;
  authorId: string;
  author: { name: string };
  isPublished: boolean;
  publishedAt: Date | null;
  tags: string[];
  createdAt: Date;
}

interface NewsClientProps {
  initialNews: NewsArticle[];
}

export default function NewsClient({ initialNews }: NewsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filteredNews = initialNews.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.excerpt.toLowerCase().includes(search.toLowerCase())
  );

  function openCreateModal() {
    setEditingArticle(null);
    setTitle("");
    setExcerpt("");
    setContent("");
    setImageUrl("");
    setTagsText("");
    setIsPublished(false);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEditModal(article: NewsArticle) {
    setEditingArticle(article);
    setTitle(article.title);
    setExcerpt(article.excerpt);
    setContent(article.content);
    setImageUrl(article.imageUrl || "");
    setTagsText(article.tags.join(", "));
    setIsPublished(article.isPublished);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim() || !excerpt.trim() || !content.trim()) {
      setError("Please fill in title, excerpt, and content fields.");
      return;
    }

    const tagsArray = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const data = {
      title,
      excerpt,
      content,
      imageUrl: imageUrl || undefined,
      tags: tagsArray,
      isPublished,
    };

    startTransition(async () => {
      try {
        if (editingArticle) {
          const res = await updateNewsAction(editingArticle.id, data);
          if (res.success) {
            setSuccess("Article updated successfully.");
            setTimeout(() => {
              setModalOpen(false);
              router.refresh();
            }, 1000);
          }
        } else {
          const res = await createNewsAction(data);
          if (res.success) {
            setSuccess("Article published successfully.");
            setTimeout(() => {
              setModalOpen(false);
              router.refresh();
            }, 1000);
          }
        }
      } catch (err: any) {
        setError(err.message || "Operation failed.");
      }
    });
  }

  async function handleDeleteArticle(id: string, titleStr: string) {
    if (!confirm(`Are you absolutely sure you want to permanently delete news article '${titleStr}'?`)) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await deleteNewsAction(id);
        if (res.success) {
          router.refresh();
        }
      } catch (err: any) {
        alert(err.message || "Failed to remove article.");
      }
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className="page-title">📰 News Desk</h1>
          <p className="page-subtitle">Draft and release research milestones, achievements, and newsletters.</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          ➕ Write Article
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: "1.5rem", padding: "1rem" }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search articles by title or snippet..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Articles Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
        {filteredNews.length === 0 ? (
          <div style={{ textAlign: "center", paddingBlock: "5rem" }} className="card">
            <span>📰</span>
            <h3 style={{ marginTop: "1rem", fontFamily: "var(--font-display)", fontWeight: 700 }}>No News Articles</h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginBlock: "0.5rem" }}>Broadcast your first research update.</p>
            <button onClick={openCreateModal} className="btn btn-primary" style={{ marginTop: "1rem" }}>
              Draft Article
            </button>
          </div>
        ) : (
          filteredNews.map((article) => (
            <div key={article.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  {article.imageUrl && (
                    <div style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "var(--color-space)", flexShrink: 0 }}>
                      <img src={article.imageUrl} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <div>
                    <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700 }}>
                      {article.title}
                    </h2>
                    <p style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", marginTop: "0.25rem" }}>
                      By {article.author.name} · Created on {new Date(article.createdAt).toLocaleDateString()} 
                      {article.isPublished && article.publishedAt && ` · Published: ${new Date(article.publishedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span className={`badge ${article.isPublished ? "badge-aurora" : "badge-nebula"}`}>
                    {article.isPublished ? "Published" : "Draft"}
                  </span>
                  <button onClick={() => openEditModal(article)} className="btn btn-ghost btn-sm">
                    Edit
                  </button>
                  <button onClick={() => handleDeleteArticle(article.id, article.title)} className="btn btn-danger btn-sm" disabled={isPending}>
                    🗑️
                  </button>
                </div>
              </div>

              <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
                {article.excerpt}
              </p>

              {/* Tags */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                {article.tags.map((tag) => (
                  <span key={tag} className="badge badge-stellar" style={{ fontSize: "0.7rem" }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Creation / Edit Modal */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div onClick={() => !isPending && setModalOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(3, 7, 18, 0.8)", backdropFilter: "blur(4px)" }} />
          
          <div className="card" style={{ width: "100%", maxWidth: "600px", position: "relative", zIndex: 1, maxHeight: "95vh", overflowY: "auto", boxShadow: "var(--glow-cosmic)" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 800, marginBottom: "1.5rem" }}>
              {editingArticle ? "⚙️ Edit Broadcast Details" : "✍️ Write Cosmic Update"}
            </h2>

            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="art-title">Article Title</label>
                <input
                  id="art-title"
                  type="text"
                  className="form-input"
                  placeholder="e.g. SEDS J'pura Rover Launches Final Phase Trials"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="art-excerpt">Excerpt Snippet</label>
                <input
                  id="art-excerpt"
                  type="text"
                  className="form-input"
                  placeholder="Short one-sentence summary for previews"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="art-content">Content (Supports markdown)</label>
                <textarea
                  id="art-content"
                  className="form-input"
                  placeholder="Full text contents..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={isPending}
                  style={{ minHeight: "150px" }}
                  required
                />
              </div>

              <ImageUpload
                label="Article Cover Image"
                value={imageUrl}
                onChange={setImageUrl}
                disabled={isPending}
              />

              <div className="form-group">
                <label className="form-label" htmlFor="art-tags">Tags (comma-separated)</label>
                <input
                  id="art-tags"
                  type="text"
                  className="form-input"
                  placeholder="rover, design, challenge"
                  value={tagsText}
                  onChange={(e) => setTagsText(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer", marginTop: "0.5rem" }}>
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  disabled={isPending}
                />
                <span>Broadcast article publicly immediately</span>
              </label>

              {error && (
                <div style={{ padding: "0.75rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-md)", color: "#fca5a5", fontSize: "0.8125rem" }}>
                  ❌ {error}
                </div>
              )}

              {success && (
                <div style={{ padding: "0.75rem", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "var(--radius-md)", color: "#6ee7b7", fontSize: "0.8125rem" }}>
                  ✔️ {success}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost" disabled={isPending}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isPending}>
                  {isPending ? "Broadcasting..." : "Save Article"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
