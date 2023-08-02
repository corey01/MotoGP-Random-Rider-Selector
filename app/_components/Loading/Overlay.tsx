import Loading from "./Loading";
import style from "./Loading.module.scss";

const LoadingOverlay = () => (
  <div className={style.overlay}>
    <Loading />
  </div>
);

export default LoadingOverlay;
