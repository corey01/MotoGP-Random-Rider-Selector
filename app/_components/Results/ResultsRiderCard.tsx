/* eslint-disable @next/next/no-img-element */

import { SelectedRider } from "@/models/rider";
import style from "../Riders.module.scss";
import { motoGP } from "@/app/fonts";
import classNames from "classnames";
import { getEntrantImage } from "@/utils/entrants";

const ResultsRiderCard = ({
  selected: { entrant, rider },
}: {
  selected: SelectedRider;
}) => {
  const getImageUrl = () => {
    const endUrl = rider.pictures.profile.main.split("/");

    return require(`/public/riders/24/${
      endUrl[endUrl.length - 1]
    }?resize&size=500&webp`);
  };

  const riderShortName = `${rider.name.slice(0,1)} ${rider.surname.slice(0,3)}`

  return (
    <div className={classNames(style.listItem, style.resultsCard)}>
      <img
        alt=""
        className={style.riderPic__img}
        src={getImageUrl()}
        width={250}
        height={375}
      />
      <div className={style.details}>
        <span className={classNames(motoGP.className, style.entrantTitle)}>
          {entrant}
        </span>
        <span className={`${motoGP.className} ${style.riderName}`}>
          {rider.name} {rider.surname}
        </span>
        <span style={{ color: rider.teamColor }} className={style.riderNumber}>
          #{rider.number}
        </span>
      </div>
      <div className={style.entrantPic__container}>
        <img
          className={style.entrantPic__img}
          src={getEntrantImage(entrant)}
          alt=""
          />
      <div className={`${motoGP.className} ${style.towerName}`}><div style={{backgroundColor: rider.teamColor}} className={style.towerBar} />{riderShortName} <span style={{color: rider.textColor, backgroundColor: rider.teamColor}}>{rider.number}</span></div>
      </div>
    </div>
  );
};

export default ResultsRiderCard;
