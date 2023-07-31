/* eslint-disable @next/next/no-img-element */
"use client";

import { Rider } from "@/models/rider";
import style from "./RemovableList.module.css";
import { motoGP } from "@/app/fonts";

const RiderCard = ({
  rider,
  removeEvent,
}: {
  rider: Rider;
  removeEvent: (a: string) => void;
}) => {
  const getImageUrl = () => {
    const endUrl = rider.pictures.profile.main.split("/");

    return require(`/public/riders/${
      endUrl[endUrl.length - 1]
    }?resize&size=500&webp`);
  };

  return (
    <div className={style.listItem}>
      <img
        alt=""
        className={style.riderPic__img}
        src={getImageUrl()}
        width={250}
        height={375}
      />
      <div className={style.details}>
        <span className={`${motoGP.className} ${style.riderName}`}>
          {rider.name} {rider.surname}
        </span>
        <span className={style.team} style={{ color: rider.teamColor }}>
          {rider.sponsoredTeam}
        </span>
        <span className={style.riderNumber}>#{rider.number}</span>{" "}
        <div
          className={style.remove}
          onClick={() => {
            removeEvent(rider.id);
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

export default RiderCard;
