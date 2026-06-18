"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "@/lib/auth-client";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/projects", label: "Projects" },
  { href: "/news", label: "News" },
  { href: "/events", label: "Events" },
  { href: "/sponsors", label: "Sponsors" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <>
      <nav className="navbar">
        <div className="container">
          <div className="navbar-inner">
            {/* Logo */}
            <Link href="/" className="navbar-logo">
              <div className="logo-icon">
                <Image
                  src="/SEDS_Jpura_logo_large.png"
                  alt="SEDS J'pura Logo"
                  width={36}
                  height={36}
                  priority
                />
              </div>
              <div className="logo-text">
                <span className="logo-name">SEDS</span>
                <span className="logo-sub">J&apos;pura</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="navbar-links">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`navbar-link ${pathname === link.href ? "active" : ""}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Auth Controls */}
            <div className="navbar-actions">
              {session ? (
                <div className="navbar-user">
                  <Link href="/dashboard" className="btn btn-ghost btn-sm">
                    Dashboard
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="btn btn-secondary btn-sm"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link href="/auth/login" className="btn btn-primary btn-sm">
                  <span>🚀</span> Sign In
                </Link>
              )}

              {/* Mobile Hamburger */}
              <button
                className="mobile-menu-btn"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                <span className={`hamburger ${mobileOpen ? "open" : ""}`}>
                  <span />
                  <span />
                  <span />
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="mobile-menu">
            <div className="container">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`mobile-link ${pathname === link.href ? "active" : ""}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mobile-auth">
                {session ? (
                  <>
                    <Link href="/dashboard" className="btn btn-ghost w-full" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                    <button onClick={() => { signOut(); setMobileOpen(false); }} className="btn btn-secondary w-full">Sign Out</button>
                  </>
                ) : (
                  <Link href="/auth/login" className="btn btn-primary w-full" onClick={() => setMobileOpen(false)}>Sign In</Link>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
