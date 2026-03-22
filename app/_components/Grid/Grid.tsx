"use client";

import { useEffect, useMemo, useState } from "react";
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

  const ridersByExternalId = useMemo(
    () => new Map(_riders.map((rider) => [rider.id, rider])),
    [_riders]
  );

  const ridersByNumber = useMemo(
    () => new Map(_riders.map((rider) => [rider.number, rider])),
    [_riders]
  );

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
    <div className={style.GridPanel}>
      <div className={style.header}>
        <div>
          <p className={style.eyebrow}>Grid Focus</p>
          <h2 className={style.title}>{eventName || "Current grid"}</h2>
        </div>
        {!loading && !hasGrid && (
          <span className={style.headerMeta}>
            {hasSessionInfo ? "Qualifying upcoming" : "Grid unavailable"}
          </span>
        )}
      </div>

      <p className={style.summary}>
        Use the qualifying order to preview the sharp end before narrowing the rider pool.
      </p>

      {loading && <div className={style.loading}>Loading…</div>}
      {error && <div className={style.error}>{error}</div>}

      {/* Grid cards */}
      {!loading && hasGrid && (
        <div className={style.rows}>
          {gridRows.map((row, rowIndex) => (
            <div key={rowIndex} className={style.row}>
              {row.map((item, colIndex) => {
                const riderFallback =
                  (item.riderExternalId ? ridersByExternalId.get(item.riderExternalId) : undefined) ??
                  (item.riderNumber != null ? ridersByNumber.get(item.riderNumber) : undefined);

                const riderName =
                  item.riderName?.trim() ||
                  [riderFallback?.name, riderFallback?.surname].filter(Boolean).join(" ") ||
                  "Unknown rider";
                const teamName = item.teamName?.trim() || riderFallback?.sponsoredTeam || null;
                const riderNumber = item.riderNumber ?? riderFallback?.number ?? null;
                const teamColor = item.teamColor ?? riderFallback?.teamColor ?? "#161616";
                const textColor = item.textColor ?? riderFallback?.textColor ?? "#fff";
                const portraitPicture =
                  item.pictures?.portrait ??
                  item.pictures?.profile ??
                  riderFallback?.pictures.portrait ??
                  riderFallback?.pictures.profile.main ??
                  null;

                const cardBg = teamColor;
                const pillBg = teamColor;
                const pillText = textColor;

                return (
                  <div
                    key={item.position}
                    className={`${style.cell} ${COL_CLASSES[colIndex]}`}
                  >
                    <span className={style.posLabel}>{item.position}</span>
                    <div className={style.card} style={{ background: cardBg }}>
                      <div className={style.bikeBackdrop} />

                      {riderNumber != null && (
                        <span
                          className={style.numberPill}
                          style={{ background: pillBg, color: pillText }}
                        >
                          {riderNumber}
                        </span>
                      )}

                      {portraitPicture && (
                        <div className={style.portraitWrap}>
                          <Image
                            src={portraitPicture}
                            alt=""
                            width={80}
                            height={110}
                            className={style.portraitImg}
                            unoptimized
                          />
                        </div>
                      )}

                        <div className={style.textWrap}>
                          <div className={style.name}>{riderName}</div>
                          {teamName && (
                            <div
                              className={style.meta}
                              style={{ color: textColor ?? "rgba(255,255,255,0.6)" }}
                            >
                              {teamName}
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
        <div className={style.sessionGrid}>
          {sessions.Q1 && (
            <div className={style.sessionCard}>
              <span className={style.sessionLabel}>Q1</span>
              <strong className={style.sessionValue}>
                {format(new Date(sessions.Q1), "EEEE, d MMM yy")}
              </strong>
              <span className={style.sessionMeta}>
                {format(new Date(sessions.Q1), "HH:mm")}
              </span>
            </div>
          )}
          {sessions.Q2 && (
            <div className={style.sessionCard}>
              <span className={style.sessionLabel}>Q2</span>
              <strong className={style.sessionValue}>
                {format(new Date(sessions.Q2), "EEEE, d MMM yy")}
              </strong>
              <span className={style.sessionMeta}>
                {format(new Date(sessions.Q2), "HH:mm")}
              </span>
            </div>
          )}
        </div>
      )}

      {!loading && !hasGrid && !hasSessionInfo && !error && (
        <div className={style.loading}>Grid data is not available from RaceCal yet.</div>
      )}
    </div>
  );
}
