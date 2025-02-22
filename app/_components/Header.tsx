"use client";

import Link from "next/link";
import { inter, motoGP } from "../fonts";
import style from "./Header.module.scss";
import { usePathname } from "next/navigation";

const Header = () => {
  const pathname = usePathname();

  const isHomePage = pathname.includes("/sweepstake");
  const isCalendarPage = pathname.includes("/calendar");

  return (
    <div className={style.header}>
      <nav className={`${style.headerNav} ${inter.className}`}>
        <ul>
          <li className={isHomePage ? style.active : undefined}>
            <Link href="/sweepstake">Sweepstake</Link>
          </li>
          <li className={isCalendarPage ? style.active : undefined}>
            <Link href="/calendar">Calendar</Link>
          </li>
        </ul>
      </nav>
      {
        !isCalendarPage && (
          <h1 className={motoGP.className}>
        {" "}
        MotoGP
        <br />
        Sweepstake Generator
      </h1>
        )
      }
    </div>
  );
};

export default Header;
