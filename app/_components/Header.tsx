import Link from "next/link";
import { motoGP } from "../fonts";
import style from "./Header.module.scss";

const Header = () => {
  return (
    <div className={style.header}>
      <nav className={style.headerNav}>
        <ul>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/calendar">Calendar</Link>
          </li>
        </ul>
      </nav>
      <h1 className={motoGP.className}> MotoGP Random Rider Selector</h1>
    </div>
  );
};

export default Header;
