/* eslint-disable @next/next/no-img-element */

import { SelectedRider } from "@/models/rider";
import style from "../Riders.module.scss";
import classNames from "classnames";
import { FALLBACK_NUMBER_COLOR, FALLBACK_RIDER_COLOR, FALLBACK_TOWER_COLOR } from "@/app/consts";
import { getEntrantImage, placeholderImage } from "@/utils/entrants";
import type { CSSProperties } from "react";

const ResultsRiderCard = ({
  selected: { entrant, rider },
  participantPhotoUrl,
  participantName,
}: {
  selected: SelectedRider;
  participantPhotoUrl?: string | null;
  participantName: string;
}) => {
  const imgUrl = rider.pictures.profile.main as string;

  const buildSurnameCode = (name: string, surname: string) => {
    const normalize = (value: string) =>
      value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

    const cleanedSurname = normalize(surname);
    if (!cleanedSurname) return "";

    const surnameParts = cleanedSurname.split(/\s+/).filter(Boolean);
    const nameParts = normalize(name).split(/\s+/).filter(Boolean);
    const prefixes = new Set(["di", "de", "del", "della", "da", "van", "von", "la", "le"]);

    if (surnameParts.length >= 2 && prefixes.has(surnameParts[0].toLowerCase())) {
      return `${surnameParts[0].slice(0, 2)}${surnameParts[1][0] || ""}`
        .toUpperCase()
        .slice(0, 3);
    }

    const trailingNamePart = nameParts[nameParts.length - 1]?.toLowerCase();
    if (trailingNamePart && prefixes.has(trailingNamePart)) {
      return `${trailingNamePart.slice(0, 2)}${surnameParts[0][0] || ""}`
        .toUpperCase()
        .slice(0, 3);
    }

    return surnameParts[0].slice(0, 3).toUpperCase();
  };

  const riderShortName = `${rider.name.slice(0, 1).toUpperCase()} ${buildSurnameCode(rider.name, rider.surname)}`;
  const cardStyle = {
    "--team-accent": rider.teamColor || "var(--kc-primary)",
  } as CSSProperties;

  return (
    <div className={classNames(style.listItem, style.resultsCard)} style={cardStyle}>
      {imgUrl && (
        <img
          alt=""
          className={style.riderPic__img}
          src={imgUrl}
          width={250}
          height={375}
        />
      )}
      <div className={style.details}>
        <span className={style.kicker}>Sweepstake pairing</span>
        <span className={style.riderName}>
          {rider.name} {rider.surname}
        </span>
        <span className={style.entrantTitle}>
          {entrant}
        </span>
        <span style={{ color: rider.teamColor || FALLBACK_NUMBER_COLOR }} className={style.riderNumber}>
          #{rider.number}
        </span>
      </div>
      <div className={style.entrantPic__container}>
        <img
          className={style.entrantPic__img}
          src={participantPhotoUrl || getEntrantImage(participantName)}
          alt=""
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = placeholderImage;
          }}
        />
        <div className={style.towerName}>
          <div style={{ backgroundColor: rider.teamColor || FALLBACK_TOWER_COLOR }} className={style.towerBar} />
          {riderShortName}{" "}
          <span style={{ color: rider.textColor || FALLBACK_RIDER_COLOR, backgroundColor: rider.teamColor || FALLBACK_TOWER_COLOR }}>
            {rider.number}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ResultsRiderCard;
