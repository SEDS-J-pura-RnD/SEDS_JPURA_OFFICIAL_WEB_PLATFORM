"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth-client";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  permission?: string | string[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: "🏠" },
      { href: "/admin/audit-logs", label: "Audit Logs", icon: "📋", permission: "VIEW_LOGS" },
    ],
  },
  {
    label: "Users & Access",
    items: [
      { href: "/admin/users", label: "Users", icon: "👥", permission: "VIEW_USERS" },
      { href: "/admin/roles", label: "Roles", icon: "🎭", permission: "MANAGE_ROLES" },
      { href: "/admin/permissions", label: "Permissions", icon: "🔑", permission: "MANAGE_PERMISSIONS" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/projects", label: "Projects", icon: "🔬", permission: ["CREATE_PROJECT", "EDIT_PROJECT", "DELETE_PROJECT", "ASSIGN_PROJECT_MEMBER", "VIEW_ALL_PROJECTS"] },
      { href: "/admin/news", label: "News", icon: "📰", permission: ["CREATE_NEWS", "EDIT_NEWS", "DELETE_NEWS", "PUBLISH_NEWS"] },
      { href: "/admin/events", label: "Events", icon: "📅", permission: ["CREATE_EVENT", "EDIT_EVENT", "DELETE_EVENT", "MANAGE_EVENTS"] },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/certificates", label: "Certificates", icon: "🏆", permission: ["ISSUE_CERTIFICATE", "REVOKE_CERTIFICATE"] },
      { href: "/admin/sponsors", label: "Sponsors", icon: "🤝", permission: "MANAGE_SPONSORS" },
      { href: "/admin/collaborators", label: "Collaborators", icon: "🏢", permission: "MANAGE_SPONSORS" },
      { href: "/admin/divisions", label: "Divisions", icon: "⚗️", permission: "MANAGE_DIVISIONS" },
      { href: "/admin/contact", label: "Inquiries", icon: "✉️", permission: "MANAGE_CONTACT" },
    ],
  },
];

interface AdminSidebarProps {
  user: { name: string; email: string; image?: string | null };
  permissions: string[];
}

export default function AdminSidebar({ user, permissions }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-logo">
        <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none" }}>
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
            <circle cx="16" cy="16" r="14" stroke="url(#sbGrad)" strokeWidth="1.5"/>
            <ellipse cx="16" cy="16" rx="14" ry="6" stroke="url(#sbGrad)" strokeWidth="1.5"/>
            <circle cx="16" cy="16" r="3" fill="url(#sbGrad)"/>
            <defs>
              <linearGradient id="sbGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#6366f1"/>
                <stop offset="100%" stopColor="#38bdf8"/>
              </linearGradient>
            </defs>
          </svg>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "0.9375rem", fontWeight: 800, letterSpacing: "0.08em", background: "var(--gradient-cosmic)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              SEDS J&apos;pura
            </div>
            <div style={{ fontSize: "0.6rem", color: "var(--color-text-dim)", letterSpacing: "0.1em" }}>ADMIN PORTAL</div>
          </div>
        </Link>
      </div>

      {navGroups.map((group) => {
        const visibleItems = group.items.filter(item => {
          if (!item.permission) return true;
          if (Array.isArray(item.permission)) {
            return item.permission.some(p => permissions.includes(p));
          }
          return permissions.includes(item.permission);
        });

        if (visibleItems.length === 0) return null;

        return (
          <div key={group.label} className="sidebar-nav-group">
            <div className="sidebar-nav-label">{group.label}</div>
            {visibleItems.map((item) => {
              const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-nav-item ${active ? "active" : ""}`}
                >
                  <span className="sidebar-nav-icon">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        );
      })}

      {/* User + actions at bottom */}
      <div style={{ marginTop: "auto", padding: "0 1rem", borderTop: "1px solid var(--color-border)", paddingTop: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.875rem" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--gradient-cosmic)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem", fontWeight: 700, flexShrink: 0 }}>
            {user.name[0]}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontWeight: 600, fontSize: "0.8125rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--color-text-dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link href="/" className="btn btn-ghost btn-sm" style={{ flex: 1, fontSize: "0.75rem" }}>🌐 Site</Link>
          <button onClick={() => signOut()} className="btn btn-danger btn-sm" style={{ flex: 1, fontSize: "0.75rem" }}>Sign Out</button>
        </div>
      </div>
    </aside>
  );
}
