"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Image from "next/image";
import { fetchRaceResults, type RaceResultsData, type RaceResultItem } from "@/utils/getRaceResults";
import { getReadableTextColor } from "@/app/_components/Grid/gridColorUtils";
import style from "./RaceResults.module.scss";

const SESSION_LABEL: Record<string, string> = {
  RAC: "Race Result",
  SPR: "Sprint Result",
};

const isDNF = (item: RaceResultItem) => item.position === null;

function formatGap(item: RaceResultItem): string {
  if (isDNF(item)) return "DNF";
  if (!item.gapFirst || item.gapFirst === "0.000") return "WINNER";
  return `+${item.gapFirst}`;
}

function safeAccent(hex: string | null): string {
  if (!hex) return "#444";
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (lum < 0.4) return hex;
  const darken = (channel: number) =>
    Math.round(channel * 0.5 + 34)
      .toString(16)
      .padStart(2, "0");
  return `#${darken(parseInt(h.slice(0, 2), 16))}${darken(parseInt(h.slice(2, 4), 16))}${darken(parseInt(h.slice(4, 6), 16))}`;
}

function ResultRow({ item }: { item: RaceResultItem }) {
  const portrait = item.pictures?.portrait ?? item.pictures?.profile;
  const gap = formatGap(item);
  const isWinner = gap === "WINNER";
  const dnf = isDNF(item);
  const accentColor = safeAccent(item.teamColor);
  const numberBackground = "#262626";
  const numberColor = getReadableTextColor(numberBackground, item.teamColor);

  return (
    <div
      className={style.row}
      style={
        {
          "--accent": accentColor,
          "--number-color": numberColor,
          "--number-background": numberBackground,
        } as CSSProperties
      }
    >
      <div
        className={`${style.position} ${isWinner ? style.positionWinner : ""} ${
          dnf ? style.positionDnf : ""
        }`}
      >
        {dnf ? "DNF" : item.position}
      </div>

      <div className={style.portrait}>
        {portrait ? (
          <Image
            src={portrait}
            alt=""
            fill
            style={{ objectFit: "cover", objectPosition: "top center" }}
            unoptimized
          />
        ) : (
          <div className={style.portraitFallback} style={{ background: accentColor }} />
        )}
      </div>

      <div className={style.copy}>
        <div className={style.name}>{item.riderName}</div>
        {item.teamName && <div className={style.team}>{item.teamName}</div>}
      </div>

      <div className={style.number}>{item.riderNumber != null ? item.riderNumber : ""}</div>

      <div className={style.rightRail}>
        <div className={style.points}>{item.points > 0 ? `${item.points} pts` : ""}</div>
        <div
          className={`${style.gap} ${isWinner ? style.gapWinner : ""} ${dnf ? style.gapDnf : ""}`}
        >
          {gap}
        </div>
      </div>
    </div>
  );
}

function SessionResults({ label, items }: { label: string; items: RaceResultItem[] }) {
  return (
    <div className={style.session}>
      <h3 className={style.sessionTitle}>{label}</h3>
      {items.map((item, index) => (
        <ResultRow key={item.riderExternalId ?? `${label}-${index}`} item={item} />
      ))}
    </div>
  );
}

export function RaceResults({ roundId }: { roundId: number }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RaceResultsData | null>(null);

  useEffect(() => {
    let alive = true;
    fetchRaceResults(roundId)
      .then((result) => {
        if (alive) {
          setData(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [roundId]);

  if (loading) return <p className={style.state}>Loading results…</p>;
  if (!data) return <p className={style.state}>Results not yet available.</p>;

  const sessionOrder = ["RAC", "SPR"];
  const sessionKeys = Object.keys(data.sessions).sort(
    (a, b) => sessionOrder.indexOf(a) - sessionOrder.indexOf(b)
  );

  return (
    <div className={style.root}>
      {sessionKeys.map((key) => (
        <SessionResults key={key} label={SESSION_LABEL[key] ?? key} items={data.sessions[key]} />
      ))}
    </div>
  );
}
