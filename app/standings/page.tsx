"use client";
import { useState } from "react";
import Link from "next/link";
import { ClassStandings } from "../race/ClassStandings";
import style from "./Standings.module.scss";

const championships = [
  {label: "Formula 1", options: [["f1:f1", "F1 Drivers"], ["f1:f1-constructors", "F1 Constructors"]]},
  {label: "WorldSBK", options: [["wsbk:worldsbk", "WorldSBK"], ["wsbk:worldssp", "WorldSSP"], ["wsbk:worldspb", "WorldSPB"], ["wsbk:worldwcr", "WorldWCR"]]},
  { label: "British Superbike", options: [["bsb:bsb", "British Superbike"], ["bsb:bsb-supersport", "British Supersport"], ["bsb:bsb-superstock", "National Superstock"], ["bsb:bsb-sportbike", "British Sportbike"]] },
  { label: "MotoGP", options: ["motogp", "moto2", "moto3"].flatMap((cls, index) => [[`motogp:${cls}`, `${["MotoGP", "Moto2", "Moto3"][index]} Riders`], [`motogp:${cls}:teams`, `${["MotoGP", "Moto2", "Moto3"][index]} Teams`], [`motogp:${cls}:constructors`, `${["MotoGP", "Moto2", "Moto3"][index]} Constructors`]]) },
  { label: "Red Bull Rookies Cup", options: [["rookiescup:rookiescup", "Red Bull Rookies Cup"]] },
  { label: "MotoAmerica", options: [
    ["superbike", "Superbike"], ["superbike-cup", "Superbike Cup"], ["supersport", "Supersport"],
    ["talent-cup", "Talent Cup"], ["king-of-the-baggers", "King of the Baggers"], ["twins-cup", "Twins Cup"],
    ["super-hooligan", "Super Hooligan"], ["build-train-race", "Build. Train. Race."],
  ].map(([key, label]) => ["motoamerica:" + key, label]) },
];

export default function StandingsPage() {
  const currentYear = new Date().getFullYear();
  const [choice, setChoice] = useState("motogp:motogp");
  const [year, setYear] = useState(currentYear);
  const [series, subSeries, competition = "riders"] = choice.split(":");
  const group = championships.find(group => group.options.some(([key]) => key === choice))!;
  const label = group.options.find(([key]) => key === choice)![1];
  const title = series === "motoamerica" ? `MotoAmerica ${label}` : label;

  return <main className={style.page}>
    <Link href="/" className={style.backLink}><span aria-hidden="true">←</span> Back to dashboard</Link>
    <header className={style.hero}>
      <p className={style.eyebrow}>Championships</p>
      <h1>Championship standings</h1>
      <p className={style.intro}>Explore championship standings across series and seasons.</p>
    </header>
    <div className={style.controls}>
      <label>Championship
        <select value={choice} onChange={event => setChoice(event.target.value)}>
          {championships.map(group => <optgroup key={group.label} label={group.label}>
            {group.options.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </optgroup>)}
        </select>
      </label>
      <label className={style.season}>Season
        <select value={year} onChange={event => setYear(Number(event.target.value))}>
          {Array.from({length: currentYear - 1949 + 2}, (_, i) => currentYear + 1 - i).map(value => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
    </div>
    <div className={style.results}>
      <div className={style.resultHeading}>
        <div><p className={style.eyebrow}>{year} season</p><h2>{title}</h2></div>
        <span className={style.badge}>{competition === "teams" ? "Team standings" : competition === "constructors" ? "Constructor standings" : series === "f1" ? subSeries === "f1-constructors" ? "Constructor standings" : "Driver standings" : "Rider standings"}</span>
      </div>
      <ClassStandings key={choice + year} series={series} subSeries={subSeries} year={year} competition={competition} standalone />
    </div>
  </main>;
}
