"use client";

import FullCalendar from "@fullcalendar/react";
import { EventClickArg } from "@fullcalendar/core";
import { DateClickArg } from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useState, useRef, useCallback, useEffect } from "react";
import { isSameDay } from "date-fns";
import { CalendarTitle } from "./CalendarTitle";

import { inter } from "@/app/fonts";
import "./Calendar.css";
import { type CalendarRoundEvent } from "@/utils/getCalendarData";

interface CalendarProps {
  roundEvents: CalendarRoundEvent[];
  selectedDate: Date | null;
  isPanelOpen: boolean;
  onDaySelect: (date: Date | null) => void;
  onRoundSelect: (roundId: number, date: Date | null) => void;
  onMonthChange: (date: Date) => void;
}

function getClickedDate(clickInfo: EventClickArg) {
  const dayEl = (clickInfo.jsEvent.target as HTMLElement).closest("[data-date]");
  const dateStr = dayEl?.getAttribute("data-date");

  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(`${dateStr}T12:00:00`);
  }

  return clickInfo.event.start ? new Date(clickInfo.event.start) : null;
}

export const Calendar = ({
  roundEvents,
  selectedDate,
  isPanelOpen,
  onDaySelect,
  onRoundSelect,
  onMonthChange,
}: CalendarProps) => {
  const calendarRef = useRef<any>(null);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const [currentDate, setCurrentDate] = useState(selectedDate ?? new Date());
  const [navigationDirection, setNavigationDirection] = useState<
    "next" | "prev" | "today" | undefined
  >();
  const isAnimatingRef = useRef(false);

  const handleEventClick = useCallback(
    (clickInfo: EventClickArg) => {
      const date = getClickedDate(clickInfo);
      const roundId = Number(clickInfo.event.extendedProps?.meta?.roundId ?? 0);

      if (roundId > 0) {
        onRoundSelect(roundId, date);
        return;
      }

      if (date) onDaySelect(date);
    },
    [onDaySelect, onRoundSelect]
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

  const animateViewChange = (direction: "next" | "prev" | "today") => {
    if (!calendarRef.current || isAnimatingRef.current) return;

    isAnimatingRef.current = true;
    const calendarApi = calendarRef.current.getApi();
    const viewEl = calendarApi.el.querySelector(".fc-view-harness");
    if (!viewEl) {
      isAnimatingRef.current = false;
      return;
    }

    setNavigationDirection(direction);
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
        setNavigationDirection(undefined);
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
      setCurrentDate(arg.view.currentStart);
    }
    onMonthChange(arg.view.currentStart);
  };

  useEffect(() => {
    if (!calendarRef.current) return;

    const timeoutId = window.setTimeout(() => {
      const calendarApi = calendarRef.current?.getApi();
      calendarApi?.updateSize();
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [isPanelOpen]);

  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

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
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
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
            titleFormat={{ month: "long", year: "numeric" }}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            datesSet={handleDatesSet}
            dayHeaderFormat={{ weekday: isMobile ? "narrow" : "short" }}
          />
        </div>
      </div>
    </>
  );
};
