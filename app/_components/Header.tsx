import { motoGP } from "../fonts";
import style from "./Header.module.scss";

const Header = () => {
  return (
    <div className={style.header}>
      <h1 className={motoGP.className}> MotoGP Random Rider Selector</h1>
    </div>
  );
};

export default Header;
