"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Rider } from "@/models/rider";
import style from "./Grid.module.scss";
import { format } from "date-fns";
import { fetchCalendarEvents } from "@/utils/getCalendarData";
import { fetchGridData, type GridData, type GridItem } from "@/utils/getGridData";

const COL_CLASSES = [style.left, style.center, style.right] as const;

type Sessions = {
  Q1: string | null;
  Q2: string | null;
};

const parseDateSafe = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

export default function GridPanel({ riders: _riders }: { riders: Rider[] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventName, setEventName] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Sessions>({ Q1: null, Q2: null });
  const [gridData, setGridData] = useState<GridData | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const year = Number(
          process.env.NEXT_PUBLIC_MOTOGP_SEASON_YEAR || new Date().getFullYear()
        );
        const events = await fetchCalendarEvents({
          year,
          series: ["motogp"],
          subSeries: ["motogp"],
        });

        const now = Date.now();

        // Find the next upcoming race to determine the current active round
        const upcomingRaces = events
          .filter((event) => {
            const start = parseDateSafe(event.start);
            return !!start && start.getTime() >= now && event.type?.toUpperCase() === "RACE";
          })
          .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

        if (!alive) return;

        if (!upcomingRaces.length) {
          setEventName(null);
          setSessions({ Q1: null, Q2: null });
          setGridData(null);
          return;
        }

        const nextRace = upcomingRaces[0];
        const roundId = nextRace.round?.id;
        setEventName(nextRace.round?.name || nextRace.title || "Next Race");

        // Find Q1/Q2 qualifying times for this round
        const qualifying = events.filter(
          (e) => e.round?.id === roundId && e.type?.toUpperCase() === "QUALIFYING"
        );
        const q1 =
          qualifying.find((e) => /\bq1\b/i.test(String(e.sessionName || "")))?.start || null;
        const q2 =
          qualifying.find((e) => /\bq2\b/i.test(String(e.sessionName || "")))?.start || null;

        setSessions({ Q1: q1, Q2: q2 });

        // Load grid data for this round
        if (roundId) {
          const data = await fetchGridData(roundId);
          if (alive) setGridData(data);
        }
      } catch {
        if (alive) setError("Failed to load grid data.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    void load();
    return () => { alive = false; };
  }, []);

  const hasGrid = (gridData?.grid?.length ?? 0) > 0;
  const hasSessionInfo = sessions.Q1 !== null || sessions.Q2 !== null;

  // Group grid positions into rows of 3
  const rows: GridItem[] = gridData?.grid ?? [];
  const gridRows: GridItem[][] = [];
  for (let i = 0; i < rows.length; i += 3) {
    gridRows.push(rows.slice(i, i + 3));
  }

  return (
    <div className={`panel ${style.GridPanel}`}>
      <div className={style.header}>
        <h3 style={{ margin: 0 }}>{eventName || "Current Grid"}</h3>
        {!loading && !hasGrid && (
          <span className={style.meta}>
            {hasSessionInfo ? "Qualifying upcoming" : "Grid unavailable"}
          </span>
        )}
      </div>

      {loading && <div className={style.loading}>Loading…</div>}
      {error && <div className={style.error}>{error}</div>}

      {/* Grid cards */}
      {!loading && hasGrid && (
        <div className={style.rows}>
          {gridRows.map((row, rowIndex) => (
            <div key={rowIndex} className={style.row}>
              {row.map((item, colIndex) => {
                const cardBg = item.teamColor ?? "#161616";
                const pillBg = item.teamColor ?? "#333";
                const pillText = item.textColor ?? "#fff";

                return (
                  <div
                    key={item.position}
                    className={`${style.cell} ${COL_CLASSES[colIndex]}`}
                  >
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

                      {item.pictures?.bike && (
                        <div className={style.bikeWrap}>
                          <Image
                            src={item.pictures.bike}
                            alt=""
                            width={80}
                            height={56}
                            className={style.bikeImg}
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
      )}

      {/* Fallback: upcoming qualifying session times */}
      {!loading && !hasGrid && hasSessionInfo && (
        <>
          <h5>Next sessions</h5>
          {sessions.Q1 && (
            <h6>Q1: {format(new Date(sessions.Q1), "EEEE, d MMMM yy HH:mm aaaaa'm'")}</h6>
          )}
          {sessions.Q2 && (
            <h6>Q2: {format(new Date(sessions.Q2), "EEEE, d MMMM yy HH:mm aaaaa'm'")}</h6>
          )}
        </>
      )}

      {!loading && !hasGrid && !hasSessionInfo && !error && (
        <div className={style.loading}>Grid data is not available from RaceCal yet.</div>
      )}
    </div>
  );
}
