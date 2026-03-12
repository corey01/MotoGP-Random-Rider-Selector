"use client";

import { Calendar } from "./_components/Calendar/Calendar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SessionView } from "./_components/Calendar/SessionToggle";
import {
  DEFAULT_SUB_SERIES_VISIBILITY,
  SERIES_GROUPS,
  SeriesKey,
  SubSeriesKey,
  seriesChildren,
} from "./_components/Calendar/filterConfig";
import {
  fetchCalendarData,
  emptyCalendarData,
  type AllCalendarData,
} from "@/utils/getCalendarData";

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

const activeCalendarFilters = (visibleSubSeries: Record<SubSeriesKey, boolean>) => {
  const subSeries = (Object.keys(visibleSubSeries) as SubSeriesKey[]).filter(
    (key) => visibleSubSeries[key]
  );
  const series = SERIES_GROUPS
    .filter((group) => group.children.some((child) => visibleSubSeries[child.key]))
    .map((group) => group.key);

  return { series, subSeries };
};

export default function CalendarPage() {
  const router = useRouter();
  const [sessionView, setSessionView] = useState<SessionView>("races");
  const showAllSessions = sessionView === "all";
  const [visibleSubSeries, setVisibleSubSeries] = useState<Record<SubSeriesKey, boolean>>(
    () => ({ ...DEFAULT_SUB_SERIES_VISIBILITY })
  );
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [calendarData, setCalendarData] = useState<AllCalendarData>(() =>
    emptyCalendarData()
  );

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

    const fetchAllCalendarData = async () => {
      const fallback = emptyCalendarData();
      try {
        const filters = activeCalendarFilters(visibleSubSeries);
        if (!filters.subSeries.length) {
          if (!cancelled) setCalendarData(emptyCalendarData());
          return;
        }

        const year = Number(
          process.env.NEXT_PUBLIC_MOTOGP_SEASON_YEAR || new Date().getFullYear()
        );
        const nextData = await fetchCalendarData(year, !showAllSessions, filters);
        if (!cancelled) {
          setCalendarData(nextData);
        }
      } catch {
        if (!cancelled) {
          setCalendarData(fallback);
        }
      }
    };

    void fetchAllCalendarData();

    return () => {
      cancelled = true;
    };
  }, [showAllSessions, visibleSubSeries]);

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
      motoGPData={calendarData.motoGpData}
      wsbkData={calendarData.wsbkData}
      bsbData={calendarData.bsbData}
      fimSpeedwayData={calendarData.fimSpeedwayData}
      formula1Data={calendarData.formula1Data}
      sessionView={sessionView}
      onSessionViewChange={setSessionView}
      visibleSubSeries={visibleSubSeries}
      onToggleSeries={handleToggleSeries}
      onToggleSubSeries={handleToggleSubSeries}
      onCreateSweepstake={(roundId) =>
        router.push(`/sweepstake/wizard?roundId=${roundId}`)
      }
    />
  );
}
