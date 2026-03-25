"use client";

import FullCalendar from "@fullcalendar/react";
import { EventClickArg } from "@fullcalendar/core";
import { DateClickArg } from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from "date-fns";
import { CalendarTitle } from "./CalendarTitle";

import { inter } from "@/app/fonts";
import "./Calendar.css";
import { type CalendarRoundEvent, type CalendarView } from "@/utils/getCalendarData";

interface CalendarProps {
  roundEvents: CalendarRoundEvent[];
  calendarView: CalendarView;
  selectedDate: Date | null;
  isPanelOpen: boolean;
  onDaySelect: (date: Date | null) => void;
  onRoundSelect: (roundId: number, date: Date | null) => void;
  onSessionSelect: (sessionId: string, roundId: number, date: Date | null) => void;
  onMonthChange: (date: Date) => void;
}

interface RoundSpan {
  roundId: number;
  title: string;
  className: string;
  start: Date;
  end: Date;
}

interface RoundPlacement extends RoundSpan {
  lane: number;
  columnStart: number;
  columnSpan: number;
  segmentStart: Date;
  segmentEnd: Date;
  isSegmentStart: boolean;
  isSegmentEnd: boolean;
}

function getClickedDate(clickInfo: EventClickArg) {
  const dayEl = (clickInfo.jsEvent.target as HTMLElement).closest("[data-date]");
  const dateStr = dayEl?.getAttribute("data-date");

  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(`${dateStr}T12:00:00`);
  }

  return clickInfo.event.start ? new Date(clickInfo.event.start) : null;
}

const weekStartsOn = 1 as const;

function parseCalendarDay(value: string) {
  return new Date(`${value.slice(0, 10)}T12:00:00`);
}

function toRoundSpan(event: CalendarRoundEvent): RoundSpan | null {
  const roundId = Number(event.extendedProps?.meta?.roundId ?? 0);
  if (roundId <= 0) return null;

  const start = parseCalendarDay(event.start);
  const end = event.end ? subDays(parseCalendarDay(event.end), 1) : start;

  return {
    roundId,
    title: event.title,
    className: event.className,
    start,
    end,
  };
}

function compareRoundSpans(left: RoundSpan, right: RoundSpan) {
  const startDiff = left.start.getTime() - right.start.getTime();
  if (startDiff !== 0) return startDiff;

  const leftDuration = left.end.getTime() - left.start.getTime();
  const rightDuration = right.end.getTime() - right.start.getTime();
  if (leftDuration !== rightDuration) return rightDuration - leftDuration;

  return left.title.localeCompare(right.title);
}

export const Calendar = ({
  roundEvents,
  calendarView,
  selectedDate,
  isPanelOpen,
  onDaySelect,
  onRoundSelect,
  onSessionSelect,
  onMonthChange,
}: CalendarProps) => {
  const calendarRef = useRef<any>(null);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const navigationResetRef = useRef<number | null>(null);
  const [currentDate, setCurrentDate] = useState(startOfMonth(selectedDate ?? new Date()));
  const [navigationDirection, setNavigationDirection] = useState<
    "next" | "prev" | "today" | undefined
  >();
  const isAnimatingRef = useRef(false);

  const handleEventClick = useCallback(
    (clickInfo: EventClickArg) => {
      const date = getClickedDate(clickInfo);
      const roundId = Number(clickInfo.event.extendedProps?.meta?.roundId ?? 0);
      const sessionId = clickInfo.event.extendedProps?.sessionId as string | undefined;

      if (sessionId && roundId > 0) {
        onSessionSelect(sessionId, roundId, date);
        return;
      }

      if (roundId > 0) {
        onRoundSelect(roundId, date);
        return;
      }

      if (date) onDaySelect(date);
    },
    [onDaySelect, onRoundSelect, onSessionSelect]
  );

  const handleDateClick = useCallback(
    (arg: DateClickArg) => {
      onDaySelect(arg.date);
    },
    [onDaySelect]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const triggerTitleAnimation = useCallback((direction: "next" | "prev" | "today") => {
    setNavigationDirection(direction);
    if (navigationResetRef.current) {
      window.clearTimeout(navigationResetRef.current);
    }
    navigationResetRef.current = window.setTimeout(() => {
      setNavigationDirection(undefined);
      navigationResetRef.current = null;
    }, 300);
  }, []);

  const changeRoundMonth = useCallback(
    (direction: "next" | "prev" | "today") => {
      triggerTitleAnimation(direction);
      const nextDate =
        direction === "today"
          ? startOfMonth(new Date())
          : direction === "next"
            ? startOfMonth(addMonths(currentDate, 1))
            : startOfMonth(subMonths(currentDate, 1));

      setCurrentDate(nextDate);
      onMonthChange(nextDate);
    },
    [currentDate, onMonthChange, triggerTitleAnimation]
  );

  const animateViewChange = (direction: "next" | "prev" | "today") => {
    if (calendarView === "rounds") {
      changeRoundMonth(direction);
      return;
    }

    if (!calendarRef.current || isAnimatingRef.current) return;

    isAnimatingRef.current = true;
    const calendarApi = calendarRef.current.getApi();
    const viewEl = calendarApi.el.querySelector(".fc-view-harness");
    if (!viewEl) {
      isAnimatingRef.current = false;
      return;
    }

    triggerTitleAnimation(direction);
    void viewEl.offsetHeight;
    const animationClass =
      direction === "next" ? "slide-left-enter" : "slide-right-enter";
    viewEl.classList.add(animationClass);

    if (direction === "today") {
      calendarApi.today();
    } else {
      calendarApi[direction]();
    }

    setCurrentDate(calendarApi.getDate());

    requestAnimationFrame(() => {
      viewEl.classList.add("slide-center");
      setTimeout(() => {
        viewEl.classList.remove(animationClass, "slide-center");
        isAnimatingRef.current = false;
      }, 300);
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!calendarRef.current) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchStartRef.current.x - touchEndX;
    const deltaY = Math.abs(touchStartRef.current.y - touchEndY);

    if (deltaY > Math.abs(deltaX)) return;

    const direction = deltaX > 100 ? "next" : deltaX < -100 ? "prev" : null;
    if (direction) animateViewChange(direction);
  };

  const handleDatesSet = (arg: any) => {
    if (!isAnimatingRef.current) {
      setCurrentDate(startOfMonth(arg.view.currentStart));
    }
    onMonthChange(arg.view.currentStart);
  };

  useEffect(() => {
    if (calendarView !== "events" || !calendarRef.current) return;

    const timeoutId = window.setTimeout(() => {
      const calendarApi = calendarRef.current?.getApi();
      calendarApi?.updateSize();
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [calendarView, isPanelOpen]);

  useEffect(() => {
    if (calendarView !== "events" || !calendarRef.current) return;

    let frameOne = 0;
    let frameTwo = 0;

    frameOne = window.requestAnimationFrame(() => {
      const calendarApi = calendarRef.current?.getApi();
      calendarApi?.updateSize();

      frameTwo = window.requestAnimationFrame(() => {
        calendarApi?.updateSize();
      });
    });

    return () => {
      window.cancelAnimationFrame(frameOne);
      window.cancelAnimationFrame(frameTwo);
    };
  }, [calendarView, roundEvents]);

  useEffect(() => {
    return () => {
      if (navigationResetRef.current) {
        window.clearTimeout(navigationResetRef.current);
      }
    };
  }, []);

  const roundMonth = useMemo(() => {
    if (calendarView !== "rounds") return null;

    const monthStart = startOfMonth(currentDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn });
    const gridEnd = endOfWeek(endOfMonth(monthStart), { weekStartsOn });
    const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
    const spans = roundEvents
      .map(toRoundSpan)
      .filter((span): span is RoundSpan => span !== null)
      .sort(compareRoundSpans);

    const weeks = [];

    for (let index = 0; index < days.length; index += 7) {
      const weekDays = days.slice(index, index + 7);
      const weekStart = weekDays[0];
      const weekEnd = weekDays[6];
      const placements: RoundPlacement[] = [];
      const laneEnds: Date[] = [];

      for (const span of spans) {
        if (span.end < weekStart || span.start > weekEnd) continue;

        const segmentStart = span.start > weekStart ? span.start : weekStart;
        const segmentEnd = span.end < weekEnd ? span.end : weekEnd;
        let lane = laneEnds.findIndex((laneEnd) => isBefore(laneEnd, segmentStart));

        if (lane === -1) {
          lane = laneEnds.length;
          laneEnds.push(segmentEnd);
        } else {
          laneEnds[lane] = segmentEnd;
        }

        placements.push({
          ...span,
          lane,
          columnStart: weekDays.findIndex((day) => isSameDay(day, segmentStart)),
          columnSpan: weekDays.findIndex((day) => isSameDay(day, segmentEnd)) -
            weekDays.findIndex((day) => isSameDay(day, segmentStart)) + 1,
          segmentStart,
          segmentEnd,
          isSegmentStart: isSameDay(segmentStart, span.start),
          isSegmentEnd: isSameDay(segmentEnd, span.end),
        });
      }

      weeks.push({
        key: weekStart.toISOString(),
        days: weekDays,
        placements,
        laneCount: Math.max(placements.length > 0 ? laneEnds.length : 0, 1),
      });
    }

    return weeks;
  }, [calendarView, currentDate, roundEvents]);

  const handleRoundBarClick = useCallback(
    (placement: RoundPlacement, event: React.MouseEvent<HTMLButtonElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const relativeX = event.clientX - rect.left;
      const ratio = rect.width > 0 ? Math.min(Math.max(relativeX / rect.width, 0), 0.999999) : 0;
      const dayOffset = Math.min(
        placement.columnSpan - 1,
        Math.max(0, Math.floor(ratio * placement.columnSpan))
      );
      const clickedDate = addDays(placement.segmentStart, dayOffset);
      onRoundSelect(placement.roundId, clickedDate);
    },
    [onRoundSelect]
  );

  return (
    <>
      <CalendarTitle
        currentDate={currentDate}
        direction={navigationDirection}
        onPrev={() => animateViewChange("prev")}
        onNext={() => animateViewChange("next")}
        onToday={() => animateViewChange("today")}
      />
      <div className="calendar-container">
        <div
          className={`calendar-wrapper ${inter.className}`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {calendarView === "rounds" && roundMonth ? (
            <div className="round-calendar">
              <div className="round-calendar-header" role="row">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
                  <div key={label} className="round-calendar-header-cell" role="columnheader">
                    {label}
                  </div>
                ))}
              </div>

              {roundMonth.map((week) => (
                <div
                  key={week.key}
                  className="round-calendar-week"
                  style={{ ["--round-lane-count" as string]: String(week.laneCount) }}
                >
                  {week.days.map((day) => {
                    const isOutsideMonth = !isSameMonth(day, currentDate);
                    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                    const classNames = [
                      "round-calendar-day",
                      isOutsideMonth ? "round-calendar-day-outside" : "",
                      isToday(day) ? "round-calendar-day-today" : "",
                      isSelected ? "round-calendar-day-selected" : "",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        className={classNames}
                        data-date={day.toISOString().slice(0, 10)}
                        onClick={() => onDaySelect(day)}
                      >
                        <span className="round-calendar-day-number">{day.getDate()}</span>
                      </button>
                    );
                  })}

                  <div className="round-calendar-bars" aria-hidden="true">
                    {week.placements.map((placement) => (
                      <button
                        key={`${placement.roundId}-${placement.segmentStart.toISOString()}`}
                        type="button"
                        className={`round-calendar-bar ${placement.className} ${
                          placement.isSegmentStart ? "round-calendar-bar-start" : ""
                        } ${placement.isSegmentEnd ? "round-calendar-bar-end" : ""}`}
                        style={{
                          gridColumn: `${placement.columnStart + 1} / span ${placement.columnSpan}`,
                          gridRow: `${placement.lane + 1}`,
                        }}
                        onClick={(event) => handleRoundBarClick(placement, event)}
                        aria-label={placement.title}
                      >
                        <span className="round-calendar-bar-label">{placement.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              initialDate={currentDate}
              events={roundEvents}
              editable={false}
              eventStartEditable={false}
              eventDurationEditable={false}
              selectable={false}
              selectMirror={false}
              height="auto"
              handleWindowResize={true}
              eventTimeFormat={{
                hour: "2-digit",
                minute: "2-digit",
                meridiem: false,
              }}
              eventContent={(eventInfo) => ({
                html: `<div class="event-content"><div class="event-title">${eventInfo.event.title}</div></div>`,
              })}
              dayCellClassNames={(arg) => {
                const classNames: string[] = [];

                if (arg.isOther) classNames.push("fc-day-outside-month");
                if (selectedDate && isSameDay(arg.date, selectedDate)) classNames.push("fc-day-selected");

                return classNames;
              }}
              headerToolbar={false}
              firstDay={1}
              contentHeight="auto"
              stickyHeaderDates={true}
              eventClick={handleEventClick}
              dateClick={handleDateClick}
              datesSet={handleDatesSet}
              dayHeaderFormat={{ weekday: "short" }}
            />
          )}
        </div>
      </div>
    </>
  );
};
