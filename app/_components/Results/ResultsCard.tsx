import { SelectedRider } from "@/models/rider";
import style from "./ResultsCard.module.scss";
import { getEntrantImage } from "@/utils/entrants";
import Image from "next/image";

const ResultsCard = ({
  selected: { entrant, rider },
}: {
  selected: SelectedRider;
}) => (
  <div className={style.card}>
    <div className={style.cardBody}>
      <Image
        alt=""
        width={140}
        height={140}
        className={style.entrantPic}
        src={getEntrantImage(entrant)}
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
    </div>
  </div>
);

export default ResultsCard;
