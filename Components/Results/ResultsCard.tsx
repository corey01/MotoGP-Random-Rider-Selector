/* eslint-disable @next/next/no-img-element */
import { SelectedRider } from "@/models/rider";
import style from "./ResultsCard.module.css";
import { isInDefaultEntrants } from "@/utils/entrants";

const ResultsCard = ({
  selected: { entrant, rider },
}: {
  selected: SelectedRider;
}) => (
  <div className={style.card}>
    <div className={style.cardBody}>
      <div style={{ color: rider.teamColor }} className={style.floatingBadge}>
        {rider.number}
      </div>
      <img
        alt=""
        className={style.entrantPic}
        src={`/entrants/${
          isInDefaultEntrants(entrant) ? entrant + ".jpg" : "placeholder.png"
        }`}
      />
      <div className={style.equal}>=</div>
      <img alt="" className={style.riderPic} src={rider.pictures.portrait} />
    </div>
    <div className={style.details}>
      <span>{entrant}</span>
      <span>
        {rider.name} {rider.surname} {rider.shortNickname}
      </span>
    </div>
  </div>
);

export default ResultsCard;
