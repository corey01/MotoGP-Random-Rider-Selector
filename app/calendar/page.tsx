"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar } from "../_components/Calendar/Calendar";
import { CalendarSidebar } from "../_components/Calendar/CalendarSidebar";
import { DayDetailPanel } from "../_components/Calendar/DayDetailPanel";
import type { SessionView } from "../_components/Calendar/SessionToggle";
import {
  DEFAULT_SUB_SERIES_VISIBILITY,
  SERIES_GROUPS,
  SeriesKey,
  SubSeriesKey,
  seriesChildren,
} from "../_components/Calendar/filterConfig";
import {
  emptyEffectiveCalendarFilters,
  fetchCalendarDate,
  fetchCalendarMonth,
  fetchRoundById,
  toFullCalendarRoundEvent,
  type CalendarRound,
  type CalendarRoundEvent,
  type EffectiveCalendarFilters,
} from "@/utils/getCalendarData";
import { useAuth } from "../_components/AuthProvider";
import { fetchPreferences, savePreferences } from "@/utils/preferences";
import style from "./Calendar.module.scss";

const createEmptyVisibility = () =>
  Object.fromEntries(
    Object.keys(DEFAULT_SUB_SERIES_VISIBILITY).map((key) => [key, false])
  ) as Record<SubSeriesKey, boolean>;

const activeCalendarFilters = (visibleSubSeries: Record<SubSeriesKey, boolean>) => {
  const subSeries = (Object.keys(visibleSubSeries) as SubSeriesKey[]).filter(
    (key) => visibleSubSeries[key]
  );
  const series = SERIES_GROUPS
    .filter((group) => group.children.some((child) => visibleSubSeries[child.key]))
    .map((group) => group.key);

  return {
    series,
    subSeries: [...new Set([...subSeries, ...series])],
  };
};

const monthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const isMobileViewport = () =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;

const visibilityFromFilters = (
  filters: EffectiveCalendarFilters
): Record<SubSeriesKey, boolean> => {
  const next = createEmptyVisibility();

  for (const series of filters.series) {
    const children = seriesChildren(series as SeriesKey);
    children.forEach((child) => {
      next[child.key] = true;
    });
  }

  for (const value of filters.subSeries) {
    if (value in next) {
      next[value as SubSeriesKey] = true;
    }
  }

  return next;
};

const sameVisibility = (
  left: Record<SubSeriesKey, boolean>,
  right: Record<SubSeriesKey, boolean>
) =>
  (Object.keys(left) as SubSeriesKey[]).every((key) => left[key] === right[key]);

type FocusMode = "date" | "round";

export default function CalendarPage() {
  const { isAuthenticated } = useAuth();
  const [sessionView, setSessionView] = useState<SessionView>("races");
  const [visibleSubSeries, setVisibleSubSeries] = useState<Record<SubSeriesKey, boolean>>(
    () => ({ ...DEFAULT_SUB_SERIES_VISIBILITY })
  );
  const [useBackendDefaults, setUseBackendDefaults] = useState(true);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [roundEvents, setRoundEvents] = useState<CalendarRoundEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateRounds, setSelectedDateRounds] = useState<CalendarRound[]>([]);
  const [focusedRoundId, setFocusedRoundId] = useState<number | null>(null);
  const [focusedRound, setFocusedRound] = useState<CalendarRound | null>(null);
  const [focusMode, setFocusMode] = useState<FocusMode>("date");
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => monthStart(new Date()));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMonthLoading, setIsMonthLoading] = useState(false);
  const [isDateLoading, setIsDateLoading] = useState(false);
  const [isRoundLoading, setIsRoundLoading] = useState(false);
  const isPanelOpen = selectedDate !== null;

  useEffect(() => {
    if (isMobileViewport()) return;
    setSelectedDate((current) => current ?? new Date());
  }, []);

  const explicitFilters = useMemo(
    () => (useBackendDefaults ? null : activeCalendarFilters(visibleSubSeries)),
    [useBackendDefaults, visibleSubSeries]
  );

  const syncVisibleSubSeries = (filters: EffectiveCalendarFilters) => {
    setVisibleSubSeries((prev) => {
      const next = visibilityFromFilters(filters);
      return sameVisibility(prev, next) ? prev : next;
    });
  };

  useEffect(() => {
    const load = async () => {
      if (isAuthenticated) {
        try {
          const prefs = await fetchPreferences();
          if (prefs.sessionView) setSessionView(prefs.sessionView);
        } catch {
          // ignore — default stays
        }
      }

      setPreferencesLoaded(true);
    };
    void load();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!preferencesLoaded) return;
    if (isAuthenticated) void savePreferences({ sessionView }).catch(() => {});
  }, [preferencesLoaded, sessionView, isAuthenticated]);

  useEffect(() => {
    let cancelled = false;

    const loadMonth = async () => {
      if (explicitFilters && explicitFilters.subSeries.length === 0) {
        if (!cancelled) {
          setRoundEvents([]);
          syncVisibleSubSeries(emptyEffectiveCalendarFilters());
        }
        return;
      }

      setIsMonthLoading(true);

      try {
        const payload = await fetchCalendarMonth({
          year: selectedMonth.getFullYear(),
          month: selectedMonth.getMonth() + 1,
          series: explicitFilters?.series,
          subSeries: explicitFilters?.subSeries,
        });

        if (cancelled) return;

        setRoundEvents(payload.rounds.map(toFullCalendarRoundEvent));
        syncVisibleSubSeries(payload.effectiveFilters);
      } catch {
        if (!cancelled) {
          setRoundEvents([]);
        }
      } finally {
        if (!cancelled) setIsMonthLoading(false);
      }
    };

    void loadMonth();

    return () => {
      cancelled = true;
    };
  }, [selectedMonth, explicitFilters]);

  useEffect(() => {
    let cancelled = false;

    const loadDate = async () => {
      if (focusMode !== "date") return;

      if (!selectedDate) {
        if (!cancelled) setSelectedDateRounds([]);
        return;
      }

      if (explicitFilters && explicitFilters.subSeries.length === 0) {
        if (!cancelled) setSelectedDateRounds([]);
        return;
      }

      setIsDateLoading(true);

      try {
        const payload = await fetchCalendarDate({
          date: selectedDate,
          series: explicitFilters?.series,
          subSeries: explicitFilters?.subSeries,
        });

        if (cancelled) return;

        setSelectedDateRounds(payload.rounds);
        syncVisibleSubSeries(payload.effectiveFilters);
      } catch {
        if (!cancelled) {
          setSelectedDateRounds([]);
        }
      } finally {
        if (!cancelled) setIsDateLoading(false);
      }
    };

    void loadDate();

    return () => {
      cancelled = true;
    };
  }, [selectedDate, explicitFilters, focusMode]);

  useEffect(() => {
    let cancelled = false;

    const loadRound = async () => {
      if (focusMode !== "round" || !focusedRoundId) {
        if (!cancelled) setFocusedRound(null);
        return;
      }

      setIsRoundLoading(true);

      try {
        const payload = await fetchRoundById(focusedRoundId);
        if (cancelled) return;
        setFocusedRound(payload.round ?? null);
      } catch {
        if (!cancelled) setFocusedRound(null);
      } finally {
        if (!cancelled) setIsRoundLoading(false);
      }
    };

    void loadRound();

    return () => {
      cancelled = true;
    };
  }, [focusMode, focusedRoundId]);

  const handleToggleSeries = (series: SeriesKey) => {
    setUseBackendDefaults(false);
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

  return (
    <div className={style.layout}>
      <div className={style.mobileFilterBar}>
        <button
          className={style.mobileFilterBtn}
          onClick={() => setSidebarOpen((open) => !open)}
        >
          {sidebarOpen ? "Close Filters" : "Filters"}
        </button>
      </div>

      {sidebarOpen && (
        <div
          className={style.sidebarOverlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`${style.sidebarWrap} ${sidebarOpen ? style.sidebarWrapOpen : ""}`}>
        <CalendarSidebar
          visibleSubSeries={visibleSubSeries}
          onToggleSeries={handleToggleSeries}
        />
      </div>

      <div className={`${style.calendarWrap} ${isPanelOpen ? style.calendarWrapPanelOpen : ""}`}>
        <Calendar
          roundEvents={roundEvents}
          selectedDate={selectedDate}
          isPanelOpen={isPanelOpen}
          onDaySelect={(date) => {
            setFocusMode("date");
            setFocusedRoundId(null);
            setFocusedRound(null);
            setSelectedDate(date);
            setSidebarOpen(false);
          }}
          onRoundSelect={(roundId, date) => {
            setFocusMode("round");
            setFocusedRoundId(roundId);
            setFocusedRound(null);
            if (date) setSelectedDate(date);
            setSidebarOpen(false);
          }}
          onMonthChange={(date) => {
            const nextMonth = monthStart(date);
            setSelectedMonth((prev) =>
              prev.getFullYear() === nextMonth.getFullYear() &&
              prev.getMonth() === nextMonth.getMonth()
                ? prev
                : nextMonth
            );
          }}
        />
        {isMonthLoading && <div className={style.loadingHint}>Loading month…</div>}
      </div>

      {selectedDate && (
        <DayDetailPanel
          date={selectedDate}
          rounds={focusMode === "round" ? (focusedRound ? [focusedRound] : []) : selectedDateRounds}
          focusMode={focusMode}
          focusedRound={focusMode === "round" ? focusedRound : null}
          sessionView={sessionView}
          onSessionViewChange={setSessionView}
          isLoading={focusMode === "round" ? isRoundLoading : isDateLoading}
          onClose={() => {
            setSelectedDate(null);
            setFocusedRoundId(null);
            setFocusedRound(null);
            setFocusMode("date");
          }}
        />
      )}
    </div>
  );
}
