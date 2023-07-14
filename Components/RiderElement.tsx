/* eslint-disable @next/next/no-img-element */
"use client";

import style from "./RemovableList.module.css";

const RiderElement = ({
  value,
  removeEvent,
}: {
  value: string;
  removeEvent: (a: string) => void;
}) => {
  const displayValue = () => {
    const [newLabel, number] = value.split(" #");

    return (
      <>
        <span>{newLabel}</span>{" "}
        <span className={style.riderNumber}>#{number}</span>
      </>
    );
  };

  return (
    <div className={style.listItem} key={value}>
      <img alt="" className={style.riderPic__img} src="/pecco.png" />
      <p>
        {displayValue()}{" "}
        <div
          className={style.remove}
          onClick={() => {
            removeEvent(value);
          }}
        >
          <svg viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
      </p>
    </div>
  );
};

export default RiderElement;
