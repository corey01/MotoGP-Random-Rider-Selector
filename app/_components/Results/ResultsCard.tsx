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
    const url = rider.pictures.portrait || rider.pictures.profile.main;
    if (!url) return "";
    const endUrl = url.split("/");
    const file = endUrl[endUrl.length - 1];

    try {
      if (url.startsWith("/riders/25/portrait/")) {
        return require(`/public/riders/25/portrait/${file}?resize&size=400&webp`);
      }
      if (url.startsWith("/riders/24/portrait/")) {
        return require(`/public/riders/24/portrait/${file}?resize&size=400&webp`);
      }
      if (url.startsWith("/riders/portrait/")) {
        return require(`/public/riders/portrait/${file}?resize&size=400&webp`);
      }
      if (url.startsWith("/riders/25/")) {
        return require(`/public/riders/25/${file}?resize&size=400&webp`);
      }
      if (url.startsWith("/riders/24/")) {
        return require(`/public/riders/24/${file}?resize&size=400&webp`);
      }
      if (url.startsWith("/riders/")) {
        return require(`/public/riders/${file}?resize&size=400&webp`);
      }
    } catch {}

    return url;
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
        <img
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
