/* eslint-disable @next/next/no-img-element */
import { SelectedRider } from "@/models/rider";
import style from "./ResultsCard.module.scss";
import { getEntrantImage } from "@/utils/entrants";
import Image from "next/image";
import { useState } from "react";

const ResultsCard = ({
  selected: { entrant, rider },
}: {
  selected: SelectedRider;
}) => {
  const [isExpanded, setExpanded] = useState<boolean>(false);

  const getRiderPortrait = () => {
    const endUrl = rider.pictures.portrait!.split("/");

    return require(`/public/riders/25/portrait/${
      endUrl[endUrl.length - 1]
    }?resize&size=400&webp`);
  };

  return (
    <div className={style.card} onClick={() => setExpanded(!isExpanded)}>
      <div className={style.cardBody}>
        <Image
          alt=""
          width={140}
          height={140}
          className={style.entrantPic}
          src={getEntrantImage(entrant)}
        />
        <div className={style.equal}>=</div>
        <Image
          width={140}
          height={140}
          alt=""
          className={style.riderPic}
          src={getRiderPortrait()}
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
