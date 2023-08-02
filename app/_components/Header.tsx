"use client";

import Link from "next/link";
import { motoGP } from "../fonts";
import style from "./Header.module.scss";
import { usePathname } from "next/navigation";

const Header = () => {
  const pathname = usePathname();

  const isCalendarPage = pathname.includes("/calendar");

  return (
    <div className={style.header}>
      <nav className={style.headerNav}>
        <ul>
          <li className={!isCalendarPage ? style.active : undefined}>
            <Link href="/">Home</Link>
          </li>
          <li className={isCalendarPage ? style.active : undefined}>
            <Link href="/calendar">Calendar</Link>
          </li>
        </ul>
      </nav>
      <h1 className={motoGP.className}> MotoGP Random Rider Selector</h1>
    </div>
  );
};

export default Header;
