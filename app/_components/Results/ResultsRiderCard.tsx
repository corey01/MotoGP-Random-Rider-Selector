/* eslint-disable @next/next/no-img-element */

import { SelectedRider } from "@/models/rider";
import style from "../Riders.module.scss";
import { motoGP, motoGPTextBold } from "@/app/fonts";
import classNames from "classnames";
import { FALLBACK_NUMBER_COLOR } from "@/app/consts";

const ResultsRiderCard = ({
  selected: { entrant, rider },
  participantPhotoUrl,
}: {
  selected: SelectedRider;
  participantPhotoUrl: string | null;
}) => {
  const imgUrl = rider.pictures.profile.main as string;

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
        <span className={`${motoGPTextBold.className} ${style.riderName}`}>
          {rider.name} {rider.surname}
        </span>
        <span className={classNames(motoGP.className, style.entrantTitle)}>
          {entrant}
        </span>
        <span style={{ color: rider.teamColor || FALLBACK_NUMBER_COLOR }} className={style.riderNumber}>
          #{rider.number}
        </span>
      </div>
      <div className={style.entrantPic__container}>
        <img
          className={style.entrantPic__img}
          src={participantPhotoUrl ?? "/entrants/placeholder.png"}
          alt=""
        />
      </div>
    </div>
  );
};

export default ResultsRiderCard;
