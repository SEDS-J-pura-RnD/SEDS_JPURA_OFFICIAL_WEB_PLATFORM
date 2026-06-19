"use client";

import { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("success");
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div>
      <section style={{ padding: "4rem 0 2rem", textAlign: "center", background: "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.1) 0%, transparent 60%)" }}>
        <div className="container">
          <div className="section-tag">✉️ CONTACT</div>
          <h1 className="section-title">
            Get In <span className="text-gradient">Touch</span>
          </h1>
          <p className="section-desc">
            Have questions about SEDS J&apos;pura? Want to collaborate or join us?
            We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="contact-grid">
            {/* Info */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {[
                { icon: "📍", title: "Location", text: "University of Sri Jayewardenepura\nGangodawila, Nugegoda\nSri Lanka." },
                { icon: "✉️", title: "Email", text: "sedsjpura@gmail.com" },
                { icon: "🌐", title: "Social", text: "Follow us on Instagram, Facebook, LinkedIn, and Medium for updates." },
                { icon: "🕐", title: "Response Time", text: "We typically respond within 1-3 business days." },
              ].map((item) => (
                <div key={item.title} className="card" style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "0.875rem", fontWeight: 700, letterSpacing: "0.05em", color: "var(--color-cosmic)", marginBottom: "0.375rem" }}>{item.title}</div>
                    <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", whiteSpace: "pre-line", lineHeight: 1.6 }}>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Form */}
            <div className="card">
              {status === "success" ? (
                <div style={{ textAlign: "center", padding: "2rem 0" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🚀</div>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.75rem" }}>Message Sent!</h2>
                  <p style={{ color: "var(--color-text-muted)" }}>Thanks for reaching out. We&apos;ll get back to you soon!</p>
                  <button className="btn btn-primary" style={{ marginTop: "1.5rem" }} onClick={() => setStatus("idle")}>Send Another Message</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Send a Message</h2>

                  <div className="grid-2" style={{ gap: "1rem" }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="contact-name">Your Name *</label>
                      <input id="contact-name" type="text" className="form-input" placeholder="Amal Perera" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required minLength={2} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="contact-email">Email Address *</label>
                      <input id="contact-email" type="email" className="form-input" placeholder="amal@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="contact-subject">Subject *</label>
                    <input id="contact-subject" type="text" className="form-input" placeholder="Inquiry about joining SEDS" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required minLength={5} />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="contact-message">Message *</label>
                    <textarea id="contact-message" className="form-textarea" placeholder="Tell us about yourself or your inquiry..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required minLength={20} style={{ minHeight: "140px" }} />
                  </div>

                  {status === "error" && (
                    <div style={{ padding: "0.75rem 1rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-md)", color: "#fca5a5", fontSize: "0.875rem" }}>
                      ❌ Failed to send message. Please try again.
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary" disabled={status === "loading"}>
                    {status === "loading" ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Sending...</> : "✉️ Send Message"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .contact-grid {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 2rem;
          align-items: start;
        }
        @media (max-width: 768px) {
          .contact-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
