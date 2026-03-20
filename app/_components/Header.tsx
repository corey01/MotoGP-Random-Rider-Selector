"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { inter, motoGP } from "../fonts";
import style from "./Header.module.scss";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";


const Header = () => {
  const pathname = usePathname();
  const { isAuthenticated, isAdmin, isLegacy, logout } = useAuth();
  const router = useRouter();

  const isGroupsPage = pathname.startsWith("/groups");
  const isAdminPage = pathname.includes("/admin");
  const isAuthPage = pathname === "/login";
  const isSweepstakePage = pathname.startsWith("/sweepstake") || pathname.startsWith("/results");

  const isCalendarPage = !isGroupsPage && !isAdminPage && !isAuthPage && !isSweepstakePage;

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className={style.header}>
      <nav className={`${style.headerNav} ${inter.className}`}>
        {isCalendarPage && (
          <div id="calendar-filters-slot" className={style.calendarFiltersSlot} />
        )}

        <ul>
          <li className={isCalendarPage ? style.active : undefined}>
            <Link href="/">Calendar</Link>
          </li>
          {isLegacy && (
            <li className={isSweepstakePage ? style.active : undefined}>
              <Link href="/sweepstake">Sweepstake</Link>
            </li>
          )}
          {isAuthenticated && (isAdmin || !isLegacy) && (
            <li className={isGroupsPage ? style.active : undefined}>
              <Link href="/groups">Groups</Link>
            </li>
          )}

          {isAdmin && (
            <li className={isAdminPage ? style.active : undefined}>
              <Link href="/admin">Admin</Link>
            </li>
          )}
          {isAuthenticated ? (
            <li>
              <button className={style.navButton} onClick={handleLogout}>
                Sign out
              </button>
            </li>
          ) : (
            <li className={pathname === "/login" ? style.active : undefined}>
              <Link href="/login">Sign in</Link>
            </li>
          )}
        </ul>
      </nav>
      {!isCalendarPage && (
        <h1 className={motoGP.className}>
          {" "}
          MotoGP
          <br />
          Sweepstake
        </h1>
      )}
    </div>
  );
};

export default Header;
