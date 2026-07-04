"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "@/lib/auth-client";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);
  const { data: session } = useSession();

  const isAboutActive = ["/about", "/team", "/contact", "/news"].includes(pathname);

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
              <Link
                href="/"
                className={`navbar-link ${pathname === "/" ? "active" : ""}`}
              >
                Home
              </Link>

              <Link
                href="/projects"
                className={`navbar-link ${pathname === "/projects" ? "active" : ""}`}
              >
                Projects
              </Link>
              <Link
                href="/events"
                className={`navbar-link ${pathname === "/events" ? "active" : ""}`}
              >
                Events
              </Link>
              <Link
                href="/sponsors"
                className={`navbar-link ${pathname === "/sponsors" ? "active" : ""}`}
              >
                Sponsors
              </Link>

              <div className="navbar-dropdown-wrapper">
                <button
                  className={`navbar-link navbar-dropdown-toggle ${isAboutActive ? "active" : ""}`}
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  About Us
                  <svg
                    className="dropdown-chevron"
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 1L5 5L9 1"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <div className="navbar-dropdown-menu">
                  <Link
                    href="/about"
                    className={`navbar-dropdown-item ${pathname === "/about" ? "active" : ""}`}
                  >
                    About
                  </Link>
                  <Link
                    href="/team"
                    className={`navbar-dropdown-item ${pathname === "/team" ? "active" : ""}`}
                  >
                    Team
                  </Link>
                  <Link
                    href="/contact"
                    className={`navbar-dropdown-item ${pathname === "/contact" ? "active" : ""}`}
                  >
                    Contact
                  </Link>
                  <Link
                    href="/news"
                    className={`navbar-dropdown-item ${pathname === "/news" ? "active" : ""}`}
                  >
                    News
                  </Link>
                </div>
              </div>
            </div>

            {/* Auth Controls */}
            <div className="navbar-actions">
              {session && (
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
              )}

              {/* Mobile Hamburger */}
              <button
                className="mobile-menu-btn"
                onClick={() => {
                  setMobileOpen(!mobileOpen);
                  setMobileAboutOpen(false);
                }}
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
              <Link
                href="/"
                className={`mobile-link ${pathname === "/" ? "active" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                Home
              </Link>

              <Link
                href="/projects"
                className={`mobile-link ${pathname === "/projects" ? "active" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                Projects
              </Link>
              <Link
                href="/events"
                className={`mobile-link ${pathname === "/events" ? "active" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                Events
              </Link>
              <Link
                href="/sponsors"
                className={`mobile-link ${pathname === "/sponsors" ? "active" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                Sponsors
              </Link>

              <div className="mobile-dropdown-wrapper">
                <button
                  className={`mobile-link mobile-dropdown-toggle ${isAboutActive ? "active" : ""}`}
                  onClick={() => setMobileAboutOpen(!mobileAboutOpen)}
                >
                  About Us
                  <svg
                    className={`dropdown-chevron ${mobileAboutOpen ? "open" : ""}`}
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 1L5 5L9 1"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                {mobileAboutOpen && (
                  <div className="mobile-dropdown-menu">
                    <Link
                      href="/about"
                      className={`mobile-dropdown-item ${pathname === "/about" ? "active" : ""}`}
                      onClick={() => {
                        setMobileOpen(false);
                        setMobileAboutOpen(false);
                      }}
                    >
                      About
                    </Link>
                    <Link
                      href="/team"
                      className={`mobile-dropdown-item ${pathname === "/team" ? "active" : ""}`}
                      onClick={() => {
                        setMobileOpen(false);
                        setMobileAboutOpen(false);
                      }}
                    >
                      Team
                    </Link>
                    <Link
                      href="/contact"
                      className={`mobile-dropdown-item ${pathname === "/contact" ? "active" : ""}`}
                      onClick={() => {
                        setMobileOpen(false);
                        setMobileAboutOpen(false);
                      }}
                    >
                      Contact
                    </Link>
                    <Link
                      href="/news"
                      className={`mobile-dropdown-item ${pathname === "/news" ? "active" : ""}`}
                      onClick={() => {
                        setMobileOpen(false);
                        setMobileAboutOpen(false);
                      }}
                    >
                      News
                    </Link>
                  </div>
                )}
              </div>

              {session && (
                <div className="mobile-auth">
                  <Link href="/dashboard" className="btn btn-ghost w-full" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                  <button onClick={() => { signOut(); setMobileOpen(false); }} className="btn btn-secondary w-full">Sign Out</button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
