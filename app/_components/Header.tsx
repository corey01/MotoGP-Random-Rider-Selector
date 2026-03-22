"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "./AuthProvider";
import style from "./Header.module.scss";

export default function Header() {
  const pathname = usePathname();
  const { isAuthenticated, isAdmin, isLegacy, logout, user } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    router.push("/login");
  };

  const navLinks = [
    { href: "/", label: "Dashboard", show: isAuthenticated },
    { href: "/calendar", label: "Calendar", show: isAuthenticated },
    { href: "/sweepstake", label: "Sweepstake", show: isAuthenticated && (isAdmin || isLegacy) },
    { href: "/settings", label: "Settings", show: isAuthenticated },
    { href: "/admin", label: "Admin", show: isAdmin },
  ].filter((l) => l.show);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const initials = user?.displayName
    ? user.displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <header className={style.header}>
      <div className={style.inner}>
        <Link href="/" className={style.wordmark} onClick={() => setMenuOpen(false)}>
          Race<span className={style.wordmarkAccent}>Cal</span>
        </Link>

        {/* Desktop nav */}
        <nav className={style.desktopNav} aria-label="Main navigation">
          <ul>
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={isActive(link.href) ? style.active : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={style.actions}>
          {isAuthenticated ? (
            <>
              <button className={style.avatar} onClick={handleLogout} title="Sign out" aria-label="Sign out">
                {user?.profilePhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.profilePhotoUrl} alt={user.displayName} className={style.avatarImg} />
                ) : (
                  <span className={style.avatarInitials}>{initials}</span>
                )}
              </button>
            </>
          ) : (
            <Link href="/login" className={style.signIn}>Sign in</Link>
          )}

          {/* Hamburger (mobile) */}
          <button
            className={style.hamburger}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className={style.drawer} role="dialog" aria-label="Navigation menu">
          <nav>
            <ul>
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={isActive(link.href) ? style.drawerActive : undefined}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {isAuthenticated ? (
                <li>
                  <button className={style.drawerSignOut} onClick={handleLogout}>
                    Sign out
                  </button>
                </li>
              ) : (
                <li>
                  <Link href="/login" onClick={() => setMenuOpen(false)}>Sign in</Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
