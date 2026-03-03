"use client";

import { useEffect, useState } from "react";
import type { Rider } from "@/models/rider";
import style from "./Grid.module.scss";
import { format } from "date-fns";
import { fetchCalendarEvents } from "@/utils/getCalendarData";

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
  const [sessions, setSessions] = useState<Sessions>({
    Q1: null,
    Q2: null,
  });

  useEffect(() => {
    let alive = true;

    async function fetchGridContext() {
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
          types: ["QUALIFYING"],
        });

        const now = Date.now();
        const upcoming = events
          .filter((event) => {
            const start = parseDateSafe(event.start);
            return !!start && start.getTime() >= now;
          })
          .sort(
            (a, b) =>
              new Date(a.start).getTime() - new Date(b.start).getTime()
          );

        if (!alive) return;

        if (!upcoming.length) {
          setEventName(null);
          setSessions({ Q1: null, Q2: null });
          return;
        }

        setEventName(upcoming[0].round?.name || upcoming[0].title || "Next Qualifying");

        const q1 =
          upcoming.find((event) => /\bq1\b/i.test(String(event.sessionName || "")))?.start ||
          upcoming[0]?.start ||
          null;
        const q2 =
          upcoming.find((event) => /\bq2\b/i.test(String(event.sessionName || "")))?.start ||
          upcoming[1]?.start ||
          null;

        setSessions({ Q1: q1, Q2: q2 });
      } catch {
        if (alive) setError("Failed to load qualifying schedule.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    void fetchGridContext();

    return () => {
      alive = false;
    };
  }, []);

  const hasSessionInfo = typeof sessions.Q1 === "string" || typeof sessions.Q2 === "string";

  return (
    <div className={`panel ${style.GridPanel}`}>
      <div className={style.header}>
        <h3 style={{ margin: 0 }}>{eventName || "Current Grid"}</h3>
        <span className={style.meta}>{loading ? "Loading…" : "Grid unavailable"}</span>
      </div>

      {hasSessionInfo && (
        <>
          <h5>Next sessions</h5>
          {sessions.Q1 && (
            <h6>
              Q1: {format(new Date(sessions.Q1), "EEEE, d MMMM yy HH:mm aaaaa'm'")}
            </h6>
          )}
          {sessions.Q2 && (
            <h6>
              Q2: {format(new Date(sessions.Q2), "EEEE, d MMMM yy HH:mm aaaaa'm'")}
            </h6>
          )}
        </>
      )}

      {error && <div className={style.error}>{error}</div>}
      {loading && <div className={style.loading}>Loading grid…</div>}
      {!loading && !hasSessionInfo && (
        <div className={style.loading}>Grid data is not available from RaceCal yet.</div>
      )}
    </div>
  );
}
