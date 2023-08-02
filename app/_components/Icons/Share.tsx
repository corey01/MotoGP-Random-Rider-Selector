import style from "./Share.module.scss";

const ShareIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    data-name="Layer 1"
    viewBox="0 0 100 125"
    x="0px"
    y="0px"
  >
    <line className={style.cls1} x1="50" y1="56.74" x2="50" y2="26.84" />
    <polyline className={style.cls1} points="56.4 33.24 50 26.84 43.6 33.24" />
    <path
      className={style.cls2}
      d="M53.95,40.32H65.12a1.3,1.3,0,0,1,1.3,1.3V71.86a1.3,1.3,0,0,1-1.3,1.3H34.88a1.3,1.3,0,0,1-1.3-1.3V41.62a1.3,1.3,0,0,1,1.3-1.3H46.05"
    />
  </svg>
);
export default ShareIcon;
