"use client";

import style from "./LiveRaceCard.module.scss";
import type { LiveSessionData } from "@/utils/getLiveSession";

function extractSurname(fullName: string): string {
  const parts = fullName.trim().split(" ");
  return (parts[parts.length - 1] ?? fullName).toUpperCase();
}

interface LiveRaceCardProps {
  liveData: LiveSessionData;
  roundName: string;
  circuit: string | null;
  seriesLabel: string;
  seriesColor: string;
}

export function LiveRaceCard({ liveData, roundName, circuit, seriesLabel, seriesColor }: LiveRaceCardProps) {
  const leader = liveData.topThree[0] ?? null;
  const p2 = liveData.topThree[1] ?? null;

  return (
    <div className={style.card} style={{ "--series-color": seriesColor } as React.CSSProperties}>
      <div className={style.topRow}>
        <span className={style.badge}>{seriesLabel}</span>
        <span className={style.liveNow}>
          <span className={style.liveDot} />
          LIVE NOW
        </span>
      </div>

      {roundName && <div className={style.roundName}>{roundName}</div>}
      {circuit && <div className={style.circuit}>{circuit}</div>}
      <hr className={style.divider} />
      <div className={style.mainStats}>
        <div className={style.mainStat}>
          <span className={style.statLabel}>Lap</span>
          <div className={style.lapValue}>
            <span className={style.lapCurrent}>{liveData.currentLap ?? "—"}</span>
            <span className={style.lapTotal}> / {liveData.totalLaps ?? "—"}</span>
          </div>
        </div>

        <div className={style.mainStat}>
          <span className={style.statLabel}>P1 - Race Leader</span>
          <span className={`${style.leaderValue} ${style.leader}`}>
            {leader ? extractSurname(leader.fullName) : "—"}
          </span>
        </div>
      </div>

      {p2?.gapToLeader && (
        <div className={style.gapBox}>
          <div className={style.gapLeft}>
            <span className={style.statLabel}>Gap to P2</span>
            <span className={style.gap}>{p2.gapToLeader}</span>
          </div>
          <div className={style.gapRiders}>
            {[liveData.topThree[1], liveData.topThree[2]].map((entry) => {
              if (!entry) return null;
              return (
                <div key={entry.position} className={style.gapRider}>
                  <span className={style.gapPos}>P{entry.position}</span>
                  <span className={style.gapName}>{extractSurname(entry.fullName)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
