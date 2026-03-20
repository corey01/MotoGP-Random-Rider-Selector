"use client";

import { useState } from "react";
import { SelectedRider } from "@/models/rider";
import style from "./ResultsCard.module.scss";
import { getEntrantImage, placeholderImage } from "@/utils/entrants";

const ResultsCard = ({
  selected: { entrant, rider },
}: {
  selected: SelectedRider;
}) => {
  const [isExpanded, setExpanded] = useState(false);

  return (
    <div className={style.card} onClick={() => setExpanded(!isExpanded)}>
      <div className={style.cardBody}>
        <img
          alt=""
          width={140}
          height={140}
          className={style.entrantPic}
          src={getEntrantImage(entrant)}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = placeholderImage;
          }}
        />
        <div className={style.equal}>=</div>
        <img
          width={140}
          height={140}
          alt=""
          className={style.riderPic}
          src={(rider.pictures.portrait || rider.pictures.profile.main) as string}
        />
      </div>
      <div className={style.details}>
        <div className={style.detailsTop}>
          <span>{entrant}</span>
          <span>
            {rider.name} {rider.surname} #{rider.number}
          </span>
        </div>
        {isExpanded && (
          <div className={style.expanded}>
            <p>Team: {rider.sponsoredTeam}</p>
            <p>
              From: {rider.from.birthCity}, {rider.from.countryName}
            </p>
            <p>Age: {rider.yearsOld} years old</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsCard;
