"use client";

import { Calendar } from "../_components/Calendar/Calendar";
import { useEffect, useState } from "react";
import type {
  SessionView,
  SeriesKey,
} from "../_components/Calendar/SessionToggle";
import {
  getBsbSeasonDataLocal,
  getFimSpeedwaySeasonDataLocal,
  getFormula1SeasonDataLocal,
  getUnsortedSeasonDataLocal,
  getWsbkSeasonDataLocal,
} from "@/utils/getSeasonDataLocal";

export default function CalendarPage() {
  const [sessionView, setSessionView] = useState<SessionView>("races");
  const showAllSessions = sessionView === "all";
  const [visibleSeries, setVisibleSeries] = useState<Record<SeriesKey, boolean>>({
    motogp: true,
    wsbk: true,
    bsb: true,
    speedway: true,
    f1: true,
  });
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
        const racesOnly = showAllSessions ? 0 : 1;
        const requestUrl = `${baseUrl.replace(
          /\/$/,
          ""
        )}/calendar-events?year=${year}&racesOnly=${racesOnly}`;

        const res = await fetch(requestUrl, { cache: "no-store" });
        if (!res.ok) throw new Error(`calendar-events failed (${res.status})`);

        const payload = await res.json();
        const sessions = Array.isArray(payload?.sessions) ? payload.sessions : [];
        const mapped = sessions.map((session: any) => {
          const start = session?.start || "";
          const tzSuffix = start.includes("+") ? ` (GMT${start.slice(-5)})` : "";
          return {
            title: session?.calendarLabel || "Grand Prix",
            start,
            className: "motogp-event",
            extendedProps: {
              session: session?.sessionKind || "SESSION",
              meta: {
                round:
                  session?.modal?.round ||
                  session?.modal?.eventName ||
                  "Grand Prix",
                name: `${session?.series || "MotoGP"} ${
                  session?.sessionName || "Session"
                }`
                  .replace(/\s+/g, " ")
                  .trim(),
                deviceTime: start,
                deviceEndTime: session?.end || undefined,
                raceTime: `${start.split("+")[0] || start}${tzSuffix}`,
              },
            },
          };
        });

        if (!cancelled) {
          setMotoGpData(mapped.length ? mapped : fallback);
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
  const fimSpeedwayData = getFimSpeedwaySeasonDataLocal(!showAllSessions);
  const formula1Data = getFormula1SeasonDataLocal(!showAllSessions);

  return (
    <Calendar
      motoGPData={motoGpData}
      wsbkData={wsbkData}
      bsbData={bsbData}
      fimSpeedwayData={fimSpeedwayData}
      formula1Data={formula1Data}
      sessionView={sessionView}
      onSessionViewChange={setSessionView}
      visibleSeries={visibleSeries}
      onToggleSeries={(series) =>
        setVisibleSeries((prev) => ({
          ...prev,
          [series]: !prev[series],
        }))
      }
    />
  );
}
