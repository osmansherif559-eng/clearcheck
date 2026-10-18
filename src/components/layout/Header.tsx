"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/ui/Icon";
import ThemeToggle from "./ThemeToggle";

const links = [{ href: "/check", label: "Investigate" }, { href: "/recover", label: "Recovery" }, { href: "/learn", label: "Learn" }, { href: "/privacy", label: "Privacy" }, { href: "/about", label: "About" }];

function Brand() {
  return <><span className="brand-symbol" aria-hidden="true"><Icon name="shield-check" size={18} strokeWidth={2.3} /></span><span>ClearCheck</span></>;
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="brand" href="/" aria-label="ClearCheck home" onClick={() => setMenuOpen(false)}><Brand /></Link>
        <nav className="desktop-nav" aria-label="Main navigation">{links.map((link) => { const active = link.href === "/check" && (pathname === "/" || pathname.startsWith("/check")); return <Link className={active ? "active" : undefined} aria-current={active ? "page" : undefined} key={link.href} href={link.href}>{link.label}</Link>; })}</nav>
        <div className="header-tools"><ThemeToggle /><Link className="header-cta" href="/check">Check something <Icon name="arrow-right" size={14} /></Link><button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label={menuOpen ? "Close navigation" : "Open navigation"} onClick={() => setMenuOpen((open) => !open)}><Icon name={menuOpen ? "x" : "menu"} size={21} /></button></div>
      </div>
      <div className={menuOpen ? "mobile-nav open" : "mobile-nav"} id="mobile-navigation"><nav aria-label="Mobile navigation">{links.map((link) => <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>{link.label}<Icon name="arrow-up-right" size={15} /></Link>)}</nav><div className="mobile-nav-note"><Icon name="lock" size={15} /> Analysis stays in this browser</div></div>
    </header>
  );
}
