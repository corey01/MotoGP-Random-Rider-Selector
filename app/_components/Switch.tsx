import style from "./Switch.module.scss";

const Switch = ({
  uniqueId,
  checked,
  onChange,
  leftText,
  rightText,
}: {
  uniqueId: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  leftText: string;
  rightText: string;
}) => {
  return (
    <div className={style.outer}>
      <div className={style.inputContainer}>
        <p className={checked ? undefined : style.active}>{leftText}</p>
        <input
          checked={checked}
          onChange={onChange}
          type="checkbox"
          id={uniqueId + "-switch"}
          className={style.checkbox}
        />
        <label className={style.checkboxLabel} htmlFor={uniqueId + "-switch"}>
          Toggle
        </label>
        <p className={checked ? style.active : undefined}>{rightText}</p>
      </div>
    </div>
  );
};
export default Switch;
