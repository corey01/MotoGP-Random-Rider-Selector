import { motoGP } from "../fonts";
import Link from "next/link";
import style from "./Header.module.scss";

const Header = () => {
  return (
    <div className={style.header}>
      <Link href="/">
        <h1 className={motoGP.className}> MotoGP Random Rider Selector</h1>
      </Link>
    </div>
  );
};

export default Header;
