"use client";

import { Calendar } from "../_components/Calendar/Calendar";
import { useEffect, useState } from "react";
import {
  filterAndFormatSessions,
  getBsbSeasonDataLocal,
  getUnsortedSeasonDataLocal,
  getWsbkSeasonDataLocal,
} from "@/utils/getSeasonDataLocal";

export default function CalendarPage() {
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [motoGpData, setMotoGpData] = useState(getUnsortedSeasonDataLocal(true));

  useEffect(() => {
    let cancelled = false;

    const fetchMotoGpCalendar = async () => {
      const fallback = getUnsortedSeasonDataLocal(!showAllSessions);
      try {
        const year = Number(
          process.env.NEXT_PUBLIC_MOTOGP_SEASON_YEAR || new Date().getFullYear()
        );
        const defaultBaseUrl =
          process.env.NODE_ENV === "development"
            ? "http://localhost:8787"
            : "https://cascading-monkeys.corey-obeirne.workers.dev";
        const baseUrl =
          process.env.NEXT_PUBLIC_MOTOGP_WORKER_URL || defaultBaseUrl;

        const res = await fetch(
          `${baseUrl.replace(/\/$/, "")}/season-events?year=${year}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error(`season-events failed (${res.status})`);

        const payload = await res.json();
        const events = Array.isArray(payload?.events) ? payload.events : [];
        const sessions = events.flatMap((ev: any) => filterAndFormatSessions(ev));
        const filtered = showAllSessions
          ? sessions
          : sessions.filter((s: any) => s.extendedProps?.session === "RACE");

        if (!cancelled) {
          setMotoGpData(filtered.length ? filtered : fallback);
        }
      } catch {
        if (!cancelled) {
          setMotoGpData(fallback);
        }
      }
    };

    void fetchMotoGpCalendar();

    return () => {
      cancelled = true;
    };
  }, [showAllSessions]);

  const wsbkData = getWsbkSeasonDataLocal(!showAllSessions);
  const bsbData = getBsbSeasonDataLocal(!showAllSessions);

  return (
    <Calendar
      motoGPData={motoGpData}
      wsbkData={wsbkData}
      bsbData={bsbData}
      showAllSessions={showAllSessions}
      onToggleSessions={() => setShowAllSessions((prev) => !prev)}
    />
  );
}
