"use client";
import { useState } from "react";
import type { StandingsEntry } from "@/utils/getStandings";
import style from "./StandingsTable.module.scss";

function Rider({ entry }: { entry: StandingsEntry }) {
  const rider = entry.rider;
  const name = rider.fullName?.trim() || "Unknown rider";
  const parts = name.split(/\s+/);
  const initials = parts.map(part => part[0]).filter(Boolean);
  const portrait = rider.pictures?.portrait || rider.pictures?.profile;
  const [failed, setFailed] = useState<string | null>(null);
  const iso = rider.country?.iso;
  return <div className={style.rider}>
    <span className={style.portraitSlot} aria-hidden="true">
      {portrait && failed !== portrait ?
        // eslint-disable-next-line @next/next/no-img-element
        <img src={portrait} alt="" onError={() => setFailed(portrait)} /> :
        <span>{initials[0]}{initials.length > 1 ? initials[initials.length - 1] : ""}</span>}
    </span>
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

export function StandingsTable({ entries }: { entries: StandingsEntry[] }) {
  const leader = entries[0]?.points ?? 0;
  return <div className={style.container}>
    <table className={style.table}>
      <caption className={style.srOnly}>Rider championship standings, ordered by position</caption>
      <thead><tr><th scope="col" className={style.position}>Pos</th><th scope="col">Rider</th><th scope="col" className={style.team}>Team</th><th scope="col" className={style.gap}>Gap</th><th scope="col" className={style.points}>Points</th></tr></thead>
      <tbody>{entries.map(entry => <tr key={entry.rider.id} data-position={entry.position}>
        <td className={style.position}>{entry.position}</td>
        <td><Rider entry={entry} /></td>
        <td className={style.team}>{entry.team || "—"}</td>
        <td className={style.gap}>{entry.points === leader ? "—" : `−${Number((leader - entry.points).toFixed(3)).toLocaleString("en-GB")}`}</td>
        <td className={style.points}>{entry.points.toLocaleString("en-GB")}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}
