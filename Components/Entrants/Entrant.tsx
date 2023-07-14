/* eslint-disable @next/next/no-img-element */
"use client";

import { isInDefaultEntrants } from "@/utils/entrants";
import style from "./Entrant.module.css";

const Entrant = ({
  value,
  removeEvent,
}: {
  value: string;
  removeEvent: (a: string) => void;
}) => {
  return (
    <div className={style.listItem} key={value}>
      <img
        alt=""
        className={style.entrantPic}
        src={
          isInDefaultEntrants(value)
            ? `/entrants/${value}.jpg`
            : `/entrants/placeholder.png`
        }
      />
      <div className={style.details}>
        {value}{" "}
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
      </div>
    </div>
  );
};

export default Entrant;
