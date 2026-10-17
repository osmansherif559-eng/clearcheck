import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClearCheck — Know the warning signs before you act",
  description: "A privacy-first message and link investigation tool that explains suspicious signals.",
};

function Mark() {
  return <span className="brand-mark" aria-hidden="true">✓</span>;
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="site-header-inner shell">
            <Link className="brand" href="/" aria-label="ClearCheck home">
              <Mark />
              <span>ClearCheck</span>
            </Link>
            <nav className="main-nav" aria-label="Main navigation">
              <Link href="/check">Investigate</Link>
              <Link href="/learn">Learn</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/about">About</Link>
            </nav>
            <Link className="header-cta" href="/check">Check something <span aria-hidden="true">↗</span></Link>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <div className="shell footer-inner">
            <div className="footer-brand"><Mark /> <span>ClearCheck</span></div>
            <p>Local-first analysis for clearer, safer decisions.</p>
            <div className="footer-links"><Link href="/privacy">Privacy</Link><Link href="/about">Limitations</Link></div>
          </div>
        </footer>
      </body>
    </html>
  );
}
