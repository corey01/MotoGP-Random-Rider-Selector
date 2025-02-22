/* eslint-disable @next/next/no-img-element */

import { SelectedRider } from "@/models/rider";
import style from "../Riders.module.scss";
import { motoGP, motoGPTextBold, motoGPTextMed } from "@/app/fonts";
import classNames from "classnames";
import { getEntrantImage } from "@/utils/entrants";
import { FALLBACK_RIDER_COLOR, FALLBACK_TEAM_COLOR } from "@/app/consts";

const ResultsRiderCard = ({
  selected: { entrant, rider },
}: {
  selected: SelectedRider;
}) => {
  const getImageUrl = () => {
    const url = rider.pictures.profile.main;

    if(!url) return;
    const endUrl = url.split("/");

    return require(`/public/riders/25/${
      endUrl[endUrl.length - 1]
    }?resize&size=500&webp`);
  };

  const imgUrl = getImageUrl();
  const riderShortName = `${rider.name.slice(0,1)} ${rider.surname.slice(0,3)}`

  return (
    <div className={classNames(style.listItem, style.resultsCard)}>
      {
        imgUrl && (
          <img
            alt=""
            className={style.riderPic__img}
            src={imgUrl}
            width={250}
            height={375}
          />
        )
      }
      <div className={style.details}>
        <span className={classNames(motoGP.className, style.entrantTitle)}>
          {entrant}
        </span>
        <span className={`${motoGPTextBold.className} ${style.riderName}`}>
          {rider.name} {rider.surname}
        </span>
        <span style={{ color: rider.teamColor || FALLBACK_TEAM_COLOR }} className={style.riderNumber}>
          #{rider.number}
        </span>
      </div>
      <div className={style.entrantPic__container}>
        <img
          className={style.entrantPic__img}
          src={getEntrantImage(entrant)}
          alt=""
          />
      <div className={`${motoGP.className} ${style.towerName}`}><div style={{backgroundColor: rider.teamColor || FALLBACK_TEAM_COLOR}} className={style.towerBar} />{riderShortName} <span style={{color: rider.textColor || FALLBACK_RIDER_COLOR, backgroundColor: rider.teamColor || FALLBACK_TEAM_COLOR}}>{rider.number}</span></div>
      </div>
    </div>
  );
};

export default ResultsRiderCard;
