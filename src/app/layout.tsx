import type { Metadata } from "next";
import Link from "next/link";
import type { Viewport } from "next";
import Header from "@/components/layout/Header";
import InstallPrompt from "@/components/layout/InstallPrompt";
import ServiceWorkerRegister from "@/components/layout/ServiceWorkerRegister";
import ThemeProvider from "@/components/layout/ThemeProvider";
import ReportSessionProvider from "@/components/report/ReportSessionProvider";
import Icon from "@/components/ui/Icon";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClearCheck — Know the warning signs before you act",
  description: "A privacy-first message and link investigation tool that explains suspicious signals.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, title: "ClearCheck", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#071c2b" };

const themeScript = `(() => { try { const saved = localStorage.getItem("clearcheck-theme"); const theme = saved === "dark" || saved === "light" ? saved : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme; } catch { document.documentElement.dataset.theme = "light"; } })()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        <ThemeProvider><ReportSessionProvider><a className="skip-link" href="#main-content">Skip to content</a><Header /><div id="main-content" tabIndex={-1}>{children}</div><InstallPrompt /><footer className="site-footer"><div className="shell footer-inner"><Link className="footer-brand" href="/"><span className="brand-symbol"><Icon name="shield-check" size={16} /></span><span>ClearCheck</span></Link><p>Local-first analysis for clearer, safer decisions.</p><div className="footer-links"><Link href="/recover">Recovery</Link><Link href="/learn">Learn</Link><Link href="/privacy">Privacy</Link><Link href="/about">Limitations</Link></div></div></footer><ServiceWorkerRegister /></ReportSessionProvider></ThemeProvider>
      </body>
    </html>
  );
}
