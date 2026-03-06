"use client";

import Link from "next/link";
import { inter, motoGP } from "../fonts";
import style from "./Header.module.scss";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useEffect, useState } from "react";
import { fetchWithAuthJson } from "@/utils/auth";

type InvitesResponse = {
  ok: boolean;
  invites: unknown[];
};

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, isLoading, logout } = useAuth();
  const [pendingInviteCount, setPendingInviteCount] = useState(0);

  const isHomePage =
    pathname.includes("/sweepstake") ||
    pathname.includes("/results") ||
    pathname.includes("/race-lineup");
  const isCalendarPage = pathname.includes("/calendar");
  const isLoginPage = pathname.startsWith("/login");
  const isRegisterPage = pathname.startsWith("/register");
  const isAdminPage = pathname.startsWith("/admin");
  const isInvitesPage = pathname.startsWith("/invites");

  const handleLogout = async () => {
    await logout();
    setPendingInviteCount(0);
    router.push("/");
  };

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      setPendingInviteCount(0);
      return;
    }

    let cancelled = false;
    const loadInvites = async () => {
      try {
        const payload = await fetchWithAuthJson<InvitesResponse>("/invites");
        if (!cancelled) {
          setPendingInviteCount(Array.isArray(payload.invites) ? payload.invites.length : 0);
        }
      } catch {
        if (!cancelled) {
          setPendingInviteCount(0);
        }
      }
    };

    void loadInvites();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading, pathname]);

  return (
    <div className={style.header}>
      <nav className={`${style.headerNav} ${inter.className}`}>
        {isCalendarPage && (
          <div id="calendar-filters-slot" className={style.calendarFiltersSlot} />
        )}

        <ul>
          <li className={isHomePage ? style.active : undefined}>
            <Link href="/sweepstake">Sweepstake</Link>
          </li>
          <li className={isCalendarPage ? style.active : undefined}>
            <Link href="/calendar">Calendar</Link>
          </li>
          {isAdmin && (
            <li className={isAdminPage ? style.active : undefined}>
              <Link href="/admin">Admin</Link>
            </li>
          )}
          {!isLoading && !isAuthenticated && (
            <>
              <li className={isLoginPage ? style.active : undefined}>
                <Link href="/login">Login</Link>
              </li>
              <li className={isRegisterPage ? style.active : undefined}>
                <Link href="/register">Register</Link>
              </li>
            </>
          )}
          {!isLoading && isAuthenticated && (
            <>
              <li className={isInvitesPage ? style.active : undefined}>
                <Link href="/invites" className={style.invitesLink}>
                  Invites
                  {pendingInviteCount > 0 && (
                    <span className={style.inviteBadge}>{pendingInviteCount}</span>
                  )}
                </Link>
              </li>
              <li className={style.userItem}>
                <span className={style.userName}>{user?.displayName}</span>
              </li>
              <li>
                <button type="button" onClick={handleLogout} className={style.logoutButton}>
                  Logout
                </button>
              </li>
            </>
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
