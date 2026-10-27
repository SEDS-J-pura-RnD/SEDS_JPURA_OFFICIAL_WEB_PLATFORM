"use client";

import { useState, useTransition } from "react";
import { HomePageStatsSettings, DEFAULT_HOME_STATS } from "@/lib/site-settings";
import { updateHomePageStatsAction } from "@/lib/actions/admin";
import Link from "next/link";

interface SiteSettingsClientProps {
  initialData: {
    settings: HomePageStatsSettings;
    liveCounts: {
      members: number;
      projects: number;
      events: number;
      divisions: number;
    };
    displayStats: Array<{
      key: string;
      number: string;
      label: string;
      mode: "auto" | "custom";
    }>;
    updatedAt: Date | string | null;
  };
}

type MetricKey = "activeMembers" | "projectsLaunched" | "eventsHosted" | "researchDivisions";

const METRIC_METADATA: Record<
  MetricKey,
  {
    icon: string;
    title: string;
    color: string;
    dbField: keyof SiteSettingsClientProps["initialData"]["liveCounts"];
    dbLabel: string;
    hint: string;
  }
> = {
  activeMembers: {
    icon: "👥",
    title: "Active Members",
    color: "#6366f1",
    dbField: "members",
    dbLabel: "Registered User Accounts in Database",
    hint: "Use Custom Override to display an established membership count (e.g., 150+) if member registration is ongoing.",
  },
  projectsLaunched: {
    icon: "🚀",
    title: "Projects Launched",
    color: "#38bdf8",
    dbField: "projects",
    dbLabel: "Total Projects in Database",
    hint: "Counts from public projects table or use Custom Override for past milestone counts.",
  },
  eventsHosted: {
    icon: "📅",
    title: "Events Hosted",
    color: "#10b981",
    dbField: "events",
    dbLabel: "Published Events in Database",
    hint: "Counts published events in database or use Custom Override to represent total historical events.",
  },
  researchDivisions: {
    icon: "⚗️",
    title: "Research Divisions",
    color: "#ec4899",
    dbField: "divisions",
    dbLabel: "Divisions in Database",
    hint: "Official divisions (IT & Satellite, Rocketry, Rover & Robotics, Biomedical, Observation).",
  },
};

export default function SiteSettingsClient({ initialData }: SiteSettingsClientProps) {
  const [settings, setSettings] = useState<HomePageStatsSettings>(initialData.settings);
  const [liveCounts] = useState(initialData.liveCounts);
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(
    initialData.updatedAt ? new Date(initialData.updatedAt) : null
  );

  const handleModeChange = (key: MetricKey, mode: "auto" | "custom") => {
    setSettings((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        mode,
      },
    }));
  };

  const handleValueChange = (key: MetricKey, value: number) => {
    setSettings((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        value: isNaN(value) ? 0 : value,
      },
    }));
  };

  const handleSuffixChange = (key: MetricKey, suffix: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        suffix,
      },
    }));
  };

  const handleLabelChange = (key: MetricKey, label: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        label,
      },
    }));
  };

  const handleResetToDefaults = () => {
    if (confirm("Reset all 4 metrics to default system values?")) {
      setSettings(DEFAULT_HOME_STATS);
    }
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const res = await updateHomePageStatsAction(settings);
        if (res.success) {
          setNotification({
            type: "success",
            message: "Home page metrics successfully updated and published to public site!",
          });
          setLastSaved(res.updatedAt ? new Date(res.updatedAt) : new Date());
          setTimeout(() => setNotification(null), 5000);
        } else {
          setNotification({
            type: "error",
            message: "Failed to update site metrics.",
          });
        }
      } catch (err: unknown) {
        setNotification({
          type: "error",
          message: err instanceof Error ? err.message : "An unexpected error occurred while saving.",
        });
      }
    });
  };

  // Compute live preview numbers
  const previewMetrics = (
    Object.keys(METRIC_METADATA) as MetricKey[]
  ).map((key) => {
    const config = settings[key];
    const meta = METRIC_METADATA[key];
    const liveVal = liveCounts[meta.dbField];
    const displayNum =
      config.mode === "auto" ? `${liveVal}${config.suffix}` : `${config.value}${config.suffix}`;
    return {
      key,
      meta,
      config,
      liveVal,
      displayNum,
    };
  });

  return (
    <div style={{ paddingBottom: "4rem" }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: "1.75rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
            <h1 className="page-title">📊 Home Page Metrics</h1>
            <span
              style={{
                fontSize: "0.7rem",
                padding: "0.2rem 0.6rem",
                borderRadius: "9999px",
                background: "rgba(16,185,129,0.15)",
                color: "#10b981",
                border: "1px solid rgba(16,185,129,0.3)",
                fontWeight: 600,
              }}
            >
              ● LIVE PUBLIC DISPLAY
            </span>
          </div>
          <p className="page-subtitle">
            Configure the 4 highlighted statistics shown prominently on the public Home page landing banner.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Link href="/" target="_blank" className="btn btn-secondary btn-sm">
            <span>🌐</span> View Home Page
          </Link>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="btn btn-primary btn-sm"
            style={{ minWidth: 130 }}
          >
            {isPending ? "Saving..." : "💾 Save Changes"}
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          style={{
            padding: "0.875rem 1.25rem",
            borderRadius: "var(--radius-md)",
            marginBottom: "1.5rem",
            background:
              notification.type === "success"
                ? "rgba(16,185,129,0.12)"
                : "rgba(239,68,68,0.12)",
            border: `1px solid ${
              notification.type === "success"
                ? "rgba(16,185,129,0.3)"
                : "rgba(239,68,68,0.3)"
            }`,
            color: notification.type === "success" ? "#10b981" : "#ef4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: 500 }}>
            <span>{notification.type === "success" ? "✅" : "⚠️"}</span>
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            style={{
              background: "none",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* ─── LIVE HOME PAGE PREVIEW ─── */}
      <div
        className="card"
        style={{
          marginBottom: "2rem",
          background: "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12) 0%, rgba(5,6,15,0.7) 70%)",
          borderColor: "rgba(99,102,241,0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.1rem" }}>👁️</span>
            <div>
              <h2 style={{ fontSize: "0.875rem", fontWeight: 700, letterSpacing: "0.08em", color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                Live Home Page Banner Preview
              </h2>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-dim)" }}>
                This is the exact aesthetic and numbers public visitors see right below the hero banner.
              </p>
            </div>
          </div>
          {lastSaved && (
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-dim)" }}>
              Last saved: {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
          )}
        </div>

        {/* Real Home Page Stats Grid Preview */}
        <div className="stats-grid" style={{ marginTop: "1rem" }}>
          {previewMetrics.map((item) => (
            <div
              key={item.key}
              className="stat-card"
              style={{
                borderColor: `${item.meta.color}40`,
                background: `linear-gradient(135deg, ${item.meta.color}10, rgba(255,255,255,0.02))`,
                boxShadow: `0 8px 24px ${item.meta.color}15`,
              }}
            >
              <div className="stat-number" style={{ color: item.meta.color }}>
                {item.displayNum}
              </div>
              <div className="stat-label">{item.config.label}</div>
              <div
                style={{
                  fontSize: "0.65rem",
                  marginTop: "0.35rem",
                  color: item.config.mode === "auto" ? "#10b981" : "#f59e0b",
                  letterSpacing: "0.05em",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                {item.config.mode === "auto" ? "⚡ Live DB Auto" : "✍️ Custom Override"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── METRIC CONFIGURATION CONTROLS ─── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
            Configure Individual Statistics
          </h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            Choose whether to pull directly from the database or set an intentional milestone number for public display.
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetToDefaults}
          className="btn btn-ghost btn-sm"
          style={{ fontSize: "0.75rem", color: "var(--color-text-dim)" }}
        >
          🔄 Reset to System Defaults
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "1.5rem" }}>
        {previewMetrics.map(({ key, meta, config, liveVal, displayNum }) => {
          const isAuto = config.mode === "auto";

          return (
            <div
              key={key}
              className="card"
              style={{
                borderColor: isAuto ? "rgba(99,102,241,0.2)" : "rgba(245,158,11,0.3)",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              {/* Card Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "var(--radius-md)",
                      background: `${meta.color}18`,
                      color: meta.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.35rem",
                    }}
                  >
                    {meta.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>
                      {meta.title}
                    </h3>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", marginTop: "0.15rem" }}>
                      Live Database:{" "}
                      <strong style={{ color: meta.color }}>
                        {liveVal} {meta.dbLabel.toLowerCase()}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Display Value Tag */}
                <div
                  style={{
                    padding: "0.35rem 0.75rem",
                    borderRadius: "var(--radius-sm)",
                    background: `${meta.color}15`,
                    border: `1px solid ${meta.color}35`,
                    color: meta.color,
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    fontSize: "1.1rem",
                    textAlign: "right",
                  }}
                >
                  {displayNum}
                </div>
              </div>

              {/* Mode Selector Tabs */}
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.5rem" }}>
                  DATA SOURCE MODE
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    background: "rgba(0,0,0,0.35)",
                    padding: "0.25rem",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleModeChange(key, "auto")}
                    style={{
                      padding: "0.5rem 0.75rem",
                      borderRadius: "calc(var(--radius-sm) - 2px)",
                      border: "none",
                      background: isAuto ? "rgba(99,102,241,0.25)" : "transparent",
                      color: isAuto ? "#fff" : "var(--color-text-dim)",
                      fontWeight: isAuto ? 700 : 500,
                      fontSize: "0.8125rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.35rem",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span>⚡</span> Auto (Live: {liveVal})
                  </button>

                  <button
                    type="button"
                    onClick={() => handleModeChange(key, "custom")}
                    style={{
                      padding: "0.5rem 0.75rem",
                      borderRadius: "calc(var(--radius-sm) - 2px)",
                      border: "none",
                      background: !isAuto ? "rgba(245,158,11,0.25)" : "transparent",
                      color: !isAuto ? "#fff" : "var(--color-text-dim)",
                      fontWeight: !isAuto ? 700 : 500,
                      fontSize: "0.8125rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.35rem",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span>✍️</span> Custom Override
                  </button>
                </div>
              </div>

              {/* Custom Value & Suffix Inputs */}
              <div style={{ display: "grid", gridTemplateColumns: isAuto ? "1fr" : "1.2fr 0.8fr", gap: "0.75rem" }}>
                {!isAuto ? (
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.35rem" }}>
                      CUSTOM COUNT VALUE
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={config.value}
                      onChange={(e) => handleValueChange(key, parseInt(e.target.value, 10))}
                      className="input"
                      placeholder="e.g. 150"
                      style={{ fontFamily: "var(--font-mono)", fontSize: "0.95rem" }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "0.625rem 0.875rem",
                      borderRadius: "var(--radius-sm)",
                      background: "rgba(16,185,129,0.08)",
                      border: "1px dashed rgba(16,185,129,0.25)",
                      fontSize: "0.75rem",
                      color: "var(--color-text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <span>ℹ️</span>
                    <span>
                      Live value is automatically calculated from {meta.dbLabel.toLowerCase()} (Currently:{" "}
                      <strong style={{ color: "#10b981" }}>{liveVal}</strong>).
                    </span>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.35rem" }}>
                    DISPLAY SUFFIX
                  </label>
                  <input
                    type="text"
                    value={config.suffix}
                    onChange={(e) => handleSuffixChange(key, e.target.value)}
                    className="input"
                    placeholder="+ or blank"
                    maxLength={5}
                    style={{ fontFamily: "var(--font-mono)", fontSize: "0.95rem" }}
                  />
                </div>
              </div>

              {/* Metric Label Input */}
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.35rem" }}>
                  CARD TITLE / LABEL
                </label>
                <input
                  type="text"
                  value={config.label}
                  onChange={(e) => handleLabelChange(key, e.target.value)}
                  className="input"
                  placeholder={meta.title}
                />
              </div>

              {/* Hint text */}
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.625rem" }}>
                💡 {meta.hint}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Action Sticky Footer */}
      <div
        style={{
          marginTop: "2.5rem",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "1rem",
          padding: "1rem 1.5rem",
          background: "rgba(13,17,32,0.85)",
          backdropFilter: "blur(12px)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid rgba(99,102,241,0.2)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        }}
      >
        <span style={{ fontSize: "0.8125rem", color: "var(--color-text-dim)" }}>
          Changes take effect immediately on public home page upon saving.
        </span>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="btn btn-primary btn-lg"
          style={{ minWidth: 160 }}
        >
          {isPending ? "Publishing..." : "💾 Save Changes"}
        </button>
      </div>
    </div>
  );
}
