/* eslint-disable @next/next/no-img-element */
import { SelectedRider } from "@/models/rider";
import style from "./ResultsCard.module.css";
import { getEntrantImage } from "@/utils/entrants";
import Image from "next/image";

const ResultsCard = ({
  selected: { entrant, rider },
}: {
  selected: SelectedRider;
}) => {
  const getRiderPortrait = () => {
    const endUrl = rider.pictures.portrait.split("/");

    return require(`/public/riders/portrait/${
      endUrl[endUrl.length - 1]
    }?resize&size=400&webp`);
  };

  return (
    <div className={style.card}>
      <div className={style.cardBody}>
        <div style={{ color: rider.teamColor }} className={style.floatingBadge}>
          {rider.number}
        </div>
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
        <span>{entrant}</span>
        <span>
          {rider.name} {rider.surname} {rider.shortNickname}
        </span>
      </div>
    </div>
  );
};

export default ResultsCard;
