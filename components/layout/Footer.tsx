import Image from "next/image";
import Link from "next/link";

const divisions = [
  "IT & Satellite",
  "Rocketry",
  "Rover & Robotics",
  "Biomedical",
  "Observation",
];

const quickLinks = [
  { href: "/about", label: "About Us" },
  { href: "/projects", label: "Projects" },
  { href: "/events", label: "Events" },
  { href: "/news", label: "News" },
  { href: "/certificates/verify", label: "Verify Certificate" },
  { href: "/sponsors", label: "Sponsors" },
  { href: "/contact", label: "Contact" },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-glow" aria-hidden="true" />
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <div className="footer-logo">
              <Image
                src="/SEDS_Jpura_logo_large.png"
                alt="SEDS J'pura Logo"
                width={40}
                height={40}
              />
              <div>
                <div className="footer-logo-name">SEDS J&apos;pura</div>
                <div className="footer-logo-sub">University of Sri Jayewardenepura</div>
              </div>
            </div>
            <p className="footer-tagline">
              Exploring the cosmos, one discovery at a time.
              Pioneering space research and technology in Sri Lanka.
            </p>
            <div className="footer-social">
              <a href="https://www.facebook.com/share/1Hzgu5ruCM/" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Facebook">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a href="https://www.instagram.com/seds_jpura?igsh=ZjNmMjQxMGYwYmxp" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a href="https://lk.linkedin.com/company/sedsjpura" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="LinkedIn">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" /><circle cx="4" cy="4" r="2" />
                </svg>
              </a>
              <a href="https://medium.com/@sedsjapura" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Medium">
                <svg viewBox="0 0 16 16" fill="currentColor" width="18" height="18">
                  <path d="M9.025 8c0 2.485-2.02 4.5-4.513 4.5A4.506 4.506 0 0 1 0 8c0-2.486 2.02-4.5 4.512-4.5A4.506 4.506 0 0 1 9.025 8m4.95 0c0 2.34-1.01 4.236-2.256 4.236S9.463 10.339 9.463 8c0-2.34 1.01-4.236 2.256-4.236S13.975 5.661 13.975 8M16 8c0 2.096-.355 3.795-.794 3.795-.438 0-.793-1.7-.793-3.795 0-2.096.355-3.795.794-3.795.438 0 .793 1.699.793 3.795"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="footer-heading">Quick Links</h3>
            <ul className="footer-links">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="footer-link">
                    <span className="footer-link-arrow">›</span> {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Divisions */}
          <div>
            <h3 className="footer-heading">Divisions</h3>
            <ul className="footer-links">
              {divisions.map((div) => (
                <li key={div}>
                  <Link href="/about#divisions" className="footer-link">
                    <span className="footer-link-arrow">›</span> {div}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="footer-heading">Contact</h3>
            <div className="footer-contact">
              <div className="contact-item">
                <span>📍</span>
                <span>University of Sri Jayewardenepura,<br />Gangodawila, Nugegoda, Sri Lanka.</span>
              </div>
              <div className="contact-item">
                <span>✉️</span>
                <a href="mailto:sedsjpura@gmail.com" className="footer-link">sedsjpura@gmail.com</a>
              </div>
              <div className="contact-item">
                <span>🌐</span>
                <span>SEDS Sri Lanka</span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-divider" />
          <div className="footer-bottom-inner">
            <p className="footer-copyright">
              © {new Date().getFullYear()} SEDS J&apos;pura. All rights reserved.
              Built with ❤️ for the stars.
            </p>
            <div className="footer-bottom-links">
              <Link href="/certificates/verify" className="footer-link">Verify Certificate</Link>
              <Link href="/auth/login" className="footer-link">Member Login</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
