"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { fetchGridData, type GridData, type GridItem } from "@/utils/getGridData";
import style from "./Grid.module.scss";

const COL_CLASSES = [style.left, style.center, style.right] as const;

export function RaceGrid({ roundId }: { roundId: number }) {
  const [loading, setLoading] = useState(true);
  const [gridData, setGridData] = useState<GridData | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    fetchGridData(roundId)
      .then((data) => { if (alive) { setGridData(data); setLoading(false); } })
      .catch(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, [roundId]);

  if (loading) return <p className={style.loading}>Loading grid…</p>;
  if (!gridData || gridData.grid.length === 0) {
    return <p className={style.loading}>Grid not yet available for this round.</p>;
  }

  const gridRows: GridItem[][] = [];
  for (let i = 0; i < gridData.grid.length; i += 3) {
    gridRows.push(gridData.grid.slice(i, i + 3));
  }

  return (
    <div className={style.rows}>
      {gridRows.map((row, rowIndex) => (
        <div key={rowIndex} className={style.row}>
          {row.map((item, colIndex) => {
            const cardBg = item.teamColor ?? "#161616";
            const pillBg = item.teamColor ?? "#333";
            const pillText = item.textColor ?? "#fff";

            return (
              <div key={item.position} className={`${style.cell} ${COL_CLASSES[colIndex]}`}>
                <span className={style.posLabel}>{item.position}</span>
                <div className={style.card} style={{ background: cardBg }}>
                  <div className={style.bikeBackdrop} />

                  {item.riderNumber != null && (
                    <span
                      className={style.numberPill}
                      style={{ background: pillBg, color: pillText }}
                    >
                      {item.riderNumber}
                    </span>
                  )}

                  {(item.pictures?.portrait ?? item.pictures?.profile) && (
                    <div className={style.portraitWrap}>
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

                  <div className={style.textWrap}>
                    <div className={style.name}>{item.riderName}</div>
                    {item.teamName && (
                      <div
                        className={style.meta}
                        style={{ color: item.textColor ?? "rgba(255,255,255,0.6)" }}
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
  );
}
