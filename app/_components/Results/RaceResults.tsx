"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Image from "next/image";
import { fetchRaceResults, type RaceResultsData, type RaceResultItem } from "@/utils/getRaceResults";
import { getReadableAccentColor } from "@/app/_components/Grid/gridColorUtils";
import style from "./RaceResults.module.scss";

const SESSION_LABEL: Record<string, string> = {
  RAC: "Race Result",
  SPR: "Sprint Result",
};
const COLLAPSED_COUNT = 3;

function ToggleIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={style.toggleIcon}
    >
      <path d="M5 6.5L10 11.5L15 6.5" />
      <path d="M5 10.5L10 15.5L15 10.5" />
    </svg>
  );
}

const isDNF = (item: RaceResultItem) => item.position === null;
const isWinner = (item: RaceResultItem) => item.position === 1;

function formatGap(item: RaceResultItem, leaderLaps: number | null): string {
  if (isDNF(item)) return "DNF";
  if (isWinner(item)) return "WINNER";

  if (
    leaderLaps != null &&
    item.totalLaps != null &&
    item.totalLaps < leaderLaps
  ) {
    const lapsDown = leaderLaps - item.totalLaps;
    return `+${lapsDown} lap${lapsDown === 1 ? "" : "s"}`;
  }

  if (item.gapFirst) return `+${item.gapFirst}`;

  return "";
}

function ResultRow({ item, leaderLaps }: { item: RaceResultItem; leaderLaps: number | null }) {
  const portrait = item.pictures?.portrait ?? item.pictures?.profile ?? null;
  const gap = formatGap(item, leaderLaps);
  const winner = isWinner(item);
  const dnf = isDNF(item);
  const accentColor = safeAccent(item.teamColor);
  const numberBackground = "#262626";
  const numberColor = getReadableAccentColor(numberBackground, accentColor, 2.1);

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
        className={`${style.position} ${winner ? style.positionWinner : ""} ${
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
          className={`${style.gap} ${winner ? style.gapWinner : ""} ${dnf ? style.gapDnf : ""}`}
        >
          {gap}
        </div>
      </div>
    </div>
  );
}

function SessionResults({
  label,
  items,
  collapsed,
}: {
  label: string;
  items: RaceResultItem[];
  collapsed: boolean;
}) {
  const leaderLaps = items.find((item) => isWinner(item))?.totalLaps ?? null;
  const visibleItems = collapsed ? items.slice(0, COLLAPSED_COUNT) : items;

  return (
    <div className={style.session}>
      <h3 className={style.sessionTitle}>{label}</h3>
      {visibleItems.map((item, index) => (
        <ResultRow
          key={item.riderExternalId ?? `${label}-${index}`}
          item={item}
          leaderLaps={leaderLaps}
        />
      ))}
    </div>
  );
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

export function RaceResults({ roundId }: { roundId: number }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RaceResultsData | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let alive = true;
    setExpanded(false);
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
  const canExpand = sessionKeys.some((key) => (data.sessions[key]?.length ?? 0) > COLLAPSED_COUNT);

  return (
    <div className={style.root}>
      {sessionKeys.map((key) => (
        <SessionResults
          key={key}
          label={SESSION_LABEL[key] ?? key}
          items={data.sessions[key]}
          collapsed={!expanded}
        />
      ))}
      {canExpand && (
        <button
          type="button"
          className={style.toggle}
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse classification preview" : "Expand full classification"}
        >
          <ToggleIcon />
        </button>
      )}
    </div>
  );
}
