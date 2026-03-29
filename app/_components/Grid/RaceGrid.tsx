"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { fetchGridData, type GridData, type GridItem } from "@/utils/getGridData";
import style from "./Grid.module.scss";
import raceStyle from "./RaceGrid.module.scss";
import { getReadableTextColor } from "./gridColorUtils";

const COL_CLASSES = [style.left, style.center, style.right] as const;
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

export function RaceGrid({ roundId }: { roundId: number }) {
  const [loading, setLoading] = useState(true);
  const [gridData, setGridData] = useState<GridData | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setExpanded(false);

    fetchGridData(roundId)
      .then((data) => { if (alive) { setGridData(data); setLoading(false); } })
      .catch(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, [roundId]);

  if (loading) return <p className={style.loading}>Loading grid…</p>;
  if (!gridData || gridData.grid.length === 0) {
    return <p className={style.loading}>Grid not yet available for this round.</p>;
  }

  const visibleGrid = expanded ? gridData.grid : gridData.grid.slice(0, COLLAPSED_COUNT);
  const canExpand = gridData.grid.length > COLLAPSED_COUNT;
  const gridRows: GridItem[][] = [];
  for (let i = 0; i < visibleGrid.length; i += 3) {
    gridRows.push(visibleGrid.slice(i, i + 3));
  }

  return (
    <div className={style.collapsible}>
      <div className={style.rows}>
        {gridRows.map((row, rowIndex) => (
          <div key={rowIndex} className={style.row}>
            {row.map((item, colIndex) => {
              const cardBg = item.teamColor ?? "#161616";
              const pillBg = item.teamColor ?? "#333";
              const readableText = getReadableTextColor(cardBg, item.textColor ?? "#fff");
              const pillText = readableText;

              return (
                <div key={item.position} className={`${style.cell} ${COL_CLASSES[colIndex]}`}>
                  <span className={style.posLabel}>{item.position}</span>
                  <div className={`${style.card} ${raceStyle.card}`} style={{ background: cardBg, color: readableText }}>
                    {item.riderNumber != null && (
                      <span
                        className={`${style.numberPill} ${raceStyle.numberPill}`}
                        style={{ background: pillBg, color: pillText }}
                      >
                        {item.riderNumber}
                      </span>
                    )}

                    {(item.pictures?.portrait ?? item.pictures?.profile) && (
                      <div className={`${style.portraitWrap} ${raceStyle.portraitWrap}`}>
                        <Image
                          src={(item.pictures!.portrait ?? item.pictures!.profile)!}
                          alt=""
                          width={80}
                          height={110}
                          className={style.portraitImg}
                          unoptimized
                        />
                      </div>
                    )}

                    <div className={`${style.textWrap} ${raceStyle.textWrap}`}>
                      <div className={`${style.name} ${raceStyle.name}`}>{item.riderName}</div>
                      {item.teamName && (
                        <div
                          className={style.meta}
                          style={{ color: readableText, opacity: 0.82 }}
                        >
                          {item.teamName}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {canExpand && (
        <button
          type="button"
          className={style.toggle}
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse grid preview" : "Expand full grid"}
        >
          <ToggleIcon />
        </button>
      )}
    </div>
  );
}
