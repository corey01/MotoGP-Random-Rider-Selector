/* eslint-disable @next/next/no-img-element */
"use client";

import { Rider } from "@/models/rider";
import style from "./Riders.module.scss";
import { motoGP } from "@/app/fonts";
import classNames from "classnames";

const RiderCard = ({
  rider,
  removeEvent,
  canBeAdded = false,
  addEvent,
  inGuestArray = false,
}: {
  rider: Rider;
  removeEvent: (rider: Rider) => void;
  canBeAdded?: Boolean;
  addEvent?: (riderToAdd: Rider) => void;
  inGuestArray?: Boolean;
}) => {
  const getImageUrl = () => {
    const endUrl = rider.pictures.profile.main.split("/");

    return require(`/public/riders/${
      endUrl[endUrl.length - 1]
    }?resize&size=500&webp`);
  };

  const handleAdd = () => {
    if (!addEvent) return;

    addEvent(rider);
  };

  const displayGuest = !inGuestArray && rider.riderType === "guest";

  return (
    <div className={classNames(style.listItem, displayGuest && style.guest)}>
      <img
        alt=""
        className={style.riderPic__img}
        src={getImageUrl()}
        width={250}
        height={375}
      />
      <div className={style.details}>
        <span className={`${motoGP.className} ${style.riderName}`}>
          {rider.name} {rider.surname}{" "}
          {displayGuest && (
            <>
              <br />
              <span className={style.displayGuestTitle}>(guest)</span>
            </>
          )}
        </span>
        <span className={style.team} style={{ color: rider.teamColor }}>
          {rider.sponsoredTeam}
        </span>
        <span className={style.riderNumber}>#{rider.number}</span>{" "}
        {canBeAdded ? (
          <div className={style.addButton} onClick={handleAdd}>
            +
          </div>
        ) : (
          <div
            className={style.remove}
            onClick={() => {
              removeEvent(rider);
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
        )}
      </div>
    </div>
  );
};

export default RiderCard;
