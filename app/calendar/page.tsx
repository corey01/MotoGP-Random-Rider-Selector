"use client";

import { Calendar } from "../_components/Calendar/Calendar";
import { useEffect, useState } from "react";
import type { SessionView } from "../_components/Calendar/SessionToggle";
import {
  DEFAULT_SUB_SERIES_VISIBILITY,
  SeriesKey,
  SubSeriesKey,
  seriesChildren,
} from "../_components/Calendar/filterConfig";
import {
  getBsbSeasonDataLocal,
  getFimSpeedwaySeasonDataLocal,
  getFormula1SeasonDataLocal,
  getUnsortedSeasonDataLocal,
  getWsbkSeasonDataLocal,
  resolveMotoSubSeries,
} from "@/utils/getSeasonDataLocal";

const CALENDAR_SESSION_VIEW_KEY = "calendar:sessionView";
const CALENDAR_SUB_SERIES_KEY = "calendar:visibleSubSeries";

const parseStoredSessionView = (value: string | null): SessionView | null => {
  if (value === "races" || value === "all") return value;
  return null;
};

const parseStoredSubSeries = (
  value: string | null
): Record<SubSeriesKey, boolean> | null => {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return null;

    const next = { ...DEFAULT_SUB_SERIES_VISIBILITY };
    (Object.keys(DEFAULT_SUB_SERIES_VISIBILITY) as SubSeriesKey[]).forEach(
      (key) => {
        if (typeof parsed[key] === "boolean") {
          next[key] = parsed[key] as boolean;
        }
      }
    );
    return next;
  } catch {
    return null;
  }
};

export default function CalendarPage() {
  const [sessionView, setSessionView] = useState<SessionView>("races");
  const showAllSessions = sessionView === "all";
  const [visibleSubSeries, setVisibleSubSeries] = useState<Record<SubSeriesKey, boolean>>(
    () => ({ ...DEFAULT_SUB_SERIES_VISIBILITY })
  );
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [motoGpData, setMotoGpData] = useState(getUnsortedSeasonDataLocal(true));

  useEffect(() => {
    const storedSessionView = parseStoredSessionView(
      localStorage.getItem(CALENDAR_SESSION_VIEW_KEY)
    );
    const storedSubSeries = parseStoredSubSeries(
      localStorage.getItem(CALENDAR_SUB_SERIES_KEY)
    );

    if (storedSessionView) {
      setSessionView(storedSessionView);
    }

    if (storedSubSeries) {
      setVisibleSubSeries(storedSubSeries);
    }

    setPreferencesLoaded(true);
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) return;
    localStorage.setItem(CALENDAR_SESSION_VIEW_KEY, sessionView);
  }, [preferencesLoaded, sessionView]);

  useEffect(() => {
    if (!preferencesLoaded) return;
    localStorage.setItem(CALENDAR_SUB_SERIES_KEY, JSON.stringify(visibleSubSeries));
  }, [preferencesLoaded, visibleSubSeries]);

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
              subSeries: resolveMotoSubSeries(session?.series),
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

  const handleToggleSeries = (series: SeriesKey) => {
    setVisibleSubSeries((prev) => {
      const children = seriesChildren(series);
      const shouldEnable = !children.every((child) => prev[child.key]);
      const next = { ...prev };
      children.forEach((child) => {
        next[child.key] = shouldEnable;
      });
      return next;
    });
  };

  const handleToggleSubSeries = (subSeries: SubSeriesKey) => {
    setVisibleSubSeries((prev) => ({
      ...prev,
      [subSeries]: !prev[subSeries],
    }));
  };

  return (
    <Calendar
      motoGPData={motoGpData}
      wsbkData={wsbkData}
      bsbData={bsbData}
      fimSpeedwayData={fimSpeedwayData}
      formula1Data={formula1Data}
      sessionView={sessionView}
      onSessionViewChange={setSessionView}
      visibleSubSeries={visibleSubSeries}
      onToggleSeries={handleToggleSeries}
      onToggleSubSeries={handleToggleSubSeries}
    />
  );
}
