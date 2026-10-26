"use client";
import {CompetitorPortrait} from "../_components/Classification/ClassificationList";
import type { StandingsEntry } from "@/utils/getStandings";
import style from "./StandingsTable.module.scss";

function Rider({ entry }: { entry: StandingsEntry }) {
  const rider = entry.rider;
  const name = rider.fullName?.trim() || "Unknown rider";
  const iso = rider.country?.iso;
  return <div className={style.rider}>
    <CompetitorPortrait name={name} pictures={rider.pictures} compact />
    <div className={style.identity}>
      <div className={style.nameLine}>
        {iso && /^[a-z]{2}$/i.test(iso) &&
          // eslint-disable-next-line @next/next/no-img-element
          <img className={style.flag} src={`https://flagcdn.com/24x18/${iso.toLowerCase()}.png`} alt={rider.country?.name || iso} />}
        <span className={style.fullName}>{name}</span>
        {rider.number != null && <span className={style.number}>#{rider.number}</span>}
      </div>
      {entry.team && <span className={style.mobileTeam}>{entry.team}</span>}
    </div>
  </div>;
}

export function StandingsTable({ entries,competitorLabel="Rider" }: { entries: StandingsEntry[];competitorLabel?:string }) {
  const leader = entries[0]?.points ?? 0;
  return <div className={style.container}>
    <table className={style.table}>
      <caption className={style.srOnly}>{competitorLabel} championship standings, ordered by position</caption>
      <thead><tr><th scope="col" className={style.position}>Pos</th><th scope="col">{competitorLabel}</th><th scope="col" className={style.team}>Team</th><th scope="col" className={style.gap}>Gap</th><th scope="col" className={style.points}>Points</th></tr></thead>
      <tbody>{entries.map(entry => <tr key={entry.rider.id} data-position={entry.position}>
        <td className={style.position} style={entry.teamColor && /^#?[0-9a-f]{6}$/i.test(entry.teamColor) ? {boxShadow:`inset 3px 0 #${entry.teamColor.replace("#","")}`} : undefined}>{entry.position}</td>
        <td><Rider entry={entry} /></td>
        <td className={style.team}>{entry.team || "—"}</td>
        <td className={style.gap}>{entry.points === leader ? "—" : `−${Number((leader - entry.points).toFixed(3)).toLocaleString("en-GB")}`}</td>
        <td className={style.points}>{entry.points.toLocaleString("en-GB")}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}
