"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "./Logo";
import { WalletButton } from "./WalletButton";

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/tokens", label: "Tokens" },
  { href: "/history", label: "Throne History" },
  { href: "/how-it-works", label: "How It Works" },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className={`header${scrolled ? " is-scrolled" : ""}${open ? " is-open" : ""}`}>
      <div className="container">
        <div className="header-bar">
          <Link href="/" className="brand" aria-label="Peak home">
            <Logo />
          </Link>

          <nav className="nav" aria-label="Main">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={isActive(pathname, item.href) ? "is-active" : undefined}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="header-actions">
            <Link href="/launch" className="btn btn-ghost btn-sm header-launch">
              <Icon name="rocket" /> Launch
            </Link>
            <div className="header-wallet">
              <WalletButton />
            </div>
            <button
              type="button"
              className="menu-toggle"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              <Icon name={open ? "close" : "menu"} />
            </button>
          </div>
        </div>
      </div>

      <div className="mobile-nav" id="mobile-nav" hidden={!open}>
        <nav aria-label="Mobile">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(pathname, item.href) ? "is-active" : undefined}
            >
              {item.label}
              <Icon name="arrowRight" />
            </Link>
          ))}
          <Link href="/launch" className={isActive(pathname, "/launch") ? "is-active" : undefined}>
            Launch a Token
            <Icon name="arrowRight" />
          </Link>
        </nav>
        <WalletButton block />
      </div>
    </header>
  );
}
