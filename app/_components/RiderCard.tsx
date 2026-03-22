/* eslint-disable @next/next/no-img-element */
"use client";

import { Rider } from "@/models/rider";
import style from "./Riders.module.scss";
import { motoGP } from "@/app/fonts";
import classNames from "classnames";
import { FALLBACK_TEAM_COLOR } from "../consts";
import type { CSSProperties } from "react";

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
  const handleAdd = () => {
    if (!addEvent) return;

    addEvent(rider);
  };

  const isGuest = rider.riderType === "guest";
  const highlightGuest = !inGuestArray && rider.riderType === "guest";
  const isLongName = `${rider.name} ${rider.surname}`.length > 18;

  const getContrastText = (hex?: string | null) => {
    if (!hex || !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return "#ffffff";
    let h = hex.slice(1);
    if (h.length === 3) h = h.split("").map(c => c + c).join("");
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luma > 0.62 ? "#111111" : "#ffffff";
  };

  const teamBg = rider.teamColor || "rgba(255,255,255,0.12)";
  const teamFg = rider.textColor || getContrastText(rider.teamColor || "");
  const cardStyle = {
    "--team-accent": rider.teamColor || "var(--kc-primary)",
  } as CSSProperties;

  return (
    <div
      className={`${classNames(
        style.listItem,
        isGuest && style.guest,
        highlightGuest && style.highlightGuest,
      )} rider-${rider.name}-${rider.surname}` }
      style={cardStyle}
    >
      <img
        alt=""
        className={style.riderPic__img}
        src={rider.pictures.profile.main as string}
        width={250}
        height={375}
      />
      <div className={style.details}>
        <span className={classNames(style.kicker, motoGP.className)}>
          {isGuest ? "Wildcard entry" : "MotoGP rider"}
        </span>
        <span className={classNames(style.riderName, isLongName && style.riderNameCompact)}>
          {rider.name} {rider.surname}
          {highlightGuest && (
            <>
              <br />
              <span className={style.displayGuestTitle}>(guest)</span>
            </>
          )}
        </span>
        <span
          className={`${style.team} ${rider.teamColor ? '' : style.teamOutline}`}
          style={{
            color: rider.teamColor ? teamFg : FALLBACK_TEAM_COLOR,
            backgroundColor: teamBg,
          }}
        >
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
