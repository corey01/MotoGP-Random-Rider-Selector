"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar } from "../_components/Calendar/Calendar";
import { CalendarFilterStrip } from "../_components/Calendar/CalendarFilterStrip";
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
import { fetchSubscriptions, fetchDisabledSubSeries } from "@/utils/subscriptions";
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

const visibilityWithinSeries = (
  visibility: Record<SubSeriesKey, boolean>,
  seriesKeys: SeriesKey[]
) => {
  const allowed = new Set(
    seriesKeys.flatMap((series) => seriesChildren(series).map((child) => child.key))
  );

  return Object.fromEntries(
    (Object.keys(visibility) as SubSeriesKey[]).map((key) => [key, allowed.has(key) ? visibility[key] : false])
  ) as Record<SubSeriesKey, boolean>;
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
  const [availableSeries, setAvailableSeries] = useState<SeriesKey[]>(
    SERIES_GROUPS.map((group) => group.key)
  );
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [roundEvents, setRoundEvents] = useState<CalendarRoundEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateRounds, setSelectedDateRounds] = useState<CalendarRound[]>([]);
  const [focusedRoundId, setFocusedRoundId] = useState<number | null>(null);
  const [focusedRound, setFocusedRound] = useState<CalendarRound | null>(null);
  const [focusMode, setFocusMode] = useState<FocusMode>("date");
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => monthStart(new Date()));
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

  const syncVisibleSubSeries = useCallback((filters: EffectiveCalendarFilters) => {
    setVisibleSubSeries((prev) => {
      const next = visibilityWithinSeries(visibilityFromFilters(filters), availableSeries);
      return sameVisibility(prev, next) ? prev : next;
    });
  }, [availableSeries]);

  useEffect(() => {
    const load = async () => {
      if (isAuthenticated) {
        try {
          const prefs = await fetchPreferences();
          if (prefs.sessionView) setSessionView(prefs.sessionView);
        } catch {
          // ignore — default stays
        }

        try {
          const [subscriptions, disabled] = await Promise.all([
            fetchSubscriptions(),
            fetchDisabledSubSeries(),
          ]);
          const subscribedSeries = SERIES_GROUPS
            .map((group) => group.key)
            .filter((key) => subscriptions.includes(key));

          const baseVisibility = visibilityWithinSeries({ ...DEFAULT_SUB_SERIES_VISIBILITY }, subscribedSeries);
          disabled.forEach((key) => { if (key in baseVisibility) baseVisibility[key] = false; });

          setAvailableSeries(subscribedSeries);
          setVisibleSubSeries(baseVisibility);
          if (disabled.length > 0) setUseBackendDefaults(false);
        } catch {
          // ignore — fall back to showing all series
        }
      }

      setPreferencesLoaded(true);
    };
    void load();
  }, [isAuthenticated]);

  useEffect(() => {
    setVisibleSubSeries((prev) => visibilityWithinSeries(prev, availableSeries));
  }, [availableSeries]);

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
  }, [selectedMonth, explicitFilters, syncVisibleSubSeries]);

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
  }, [selectedDate, explicitFilters, focusMode, syncVisibleSubSeries]);

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
      <div className={style.sidebarWrap}>
        <CalendarSidebar
          seriesKeys={availableSeries}
          visibleSubSeries={visibleSubSeries}
          onToggleSeries={handleToggleSeries}
        />
      </div>

      <div className={`${style.calendarWrap} ${isPanelOpen ? style.calendarWrapPanelOpen : ""}`}>
        <CalendarFilterStrip
          seriesKeys={availableSeries}
          visibleSubSeries={visibleSubSeries}
          onToggleSeries={handleToggleSeries}
        />
        <Calendar
          roundEvents={roundEvents}
          selectedDate={selectedDate}
          isPanelOpen={isPanelOpen}
          onDaySelect={(date) => {
            setFocusMode("date");
            setFocusedRoundId(null);
            setFocusedRound(null);
            setSelectedDate(date);
          }}
          onRoundSelect={(roundId, date) => {
            setFocusMode("round");
            setFocusedRoundId(roundId);
            setFocusedRound(null);
            if (date) setSelectedDate(date);
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
