"use client";

import FullCalendar from "@fullcalendar/react";
import { EventClickArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useState, useRef } from "react";
import { CalendarEventModal } from "../Modals/CalendarEventModal";
import { CalendarTitle } from "./CalendarTitle";
import { SessionToggle, SessionView } from "./SessionToggle";
import { SeriesKey, SubSeriesKey } from "./filterConfig";

import { inter } from "@/app/fonts";
import "./Calendar.css";
import {
  type MotoGpSeasonData,
  type WsbkSeasonData,
  type BsbSeasonData,
  type FimSpeedwaySeasonData,
  type Formula1SeasonData,
} from "@/utils/getCalendarData";

interface CalendarProps {
  motoGPData: MotoGpSeasonData;
  wsbkData: WsbkSeasonData;
  bsbData: BsbSeasonData;
  fimSpeedwayData: FimSpeedwaySeasonData;
  formula1Data: Formula1SeasonData;
  sessionView: SessionView;
  onSessionViewChange: (view: SessionView) => void;
  visibleSubSeries: Record<SubSeriesKey, boolean>;
  onToggleSeries: (series: SeriesKey) => void;
  onToggleSubSeries: (subSeries: SubSeriesKey) => void;
}

export const Calendar = ({
  motoGPData,
  wsbkData,
  bsbData,
  fimSpeedwayData,
  formula1Data,
  sessionView,
  onSessionViewChange,
  visibleSubSeries,
  onToggleSeries,
  onToggleSubSeries,
}: CalendarProps) => {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const calendarRef = useRef<any>(null);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [navigationDirection, setNavigationDirection] = useState<
    "next" | "prev" | "today" | undefined
  >();
  const isAnimatingRef = useRef(false);

  const allEvents = [
    ...motoGPData,
    ...wsbkData,
    ...bsbData,
    ...fimSpeedwayData,
    ...formula1Data,
  ];

  const visibleEvents = allEvents.filter((event: any) => {
    const subSeries = event?.extendedProps?.subSeries as SubSeriesKey | undefined;
    if (!subSeries) return true;
    return !!visibleSubSeries[subSeries];
  });

  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedEvent(clickInfo.event);
  };

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

    // Execute the calendar change immediately
    if (direction === "today") {
      calendarApi.today();
    } else {
      calendarApi[direction]();
    }

    // Update current date immediately after calendar change
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

    // Only handle horizontal swipes (ignore if vertical movement is larger)
    if (deltaY > Math.abs(deltaX)) return;

    const direction = deltaX > 100 ? "next" : deltaX < -100 ? "prev" : null;

    if (direction) {
      animateViewChange(direction);
    }
  };

  const handleDatesSet = (arg: any) => {
    // Only update the date if we're not in an animation
    if (!isAnimatingRef.current) {
      setCurrentDate(arg.view.currentStart);
    }
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  return (
    <>
      <SessionToggle
        sessionView={sessionView}
        onSessionViewChange={onSessionViewChange}
        visibleSubSeries={visibleSubSeries}
        onToggleSeries={onToggleSeries}
        onToggleSubSeries={onToggleSubSeries}
      />
      <CalendarTitle
        currentDate={currentDate}
        direction={navigationDirection}
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
            events={visibleEvents}
            editable={false}
            eventStartEditable={false}
            eventDurationEditable={false}
            selectable={false}
            selectMirror={false}
            // Calendar settings
            height="auto"
            handleWindowResize={true}
            eventTimeFormat={{
              hour: "2-digit",
              minute: "2-digit",
              meridiem: "short",
            }}
            eventContent={(eventInfo) => ({
              html: `
              <div class="event-content">
              <div class="event-time">${eventInfo.timeText}</div>
              <div class="event-title">${eventInfo.event.title}</div>
              </div>
              `,
            })}
            customButtons={{
              prev: {
                click: () => animateViewChange("prev"),
              },
              next: {
                click: () => animateViewChange("next"),
              },
              today: {
                text: "Current Month",
                click: () => animateViewChange("today"),
              },
            }}
            headerToolbar={{
              left: "",
              center: "prev today next",
              right: "", // Removed title from header
            }}
            firstDay={1}
            contentHeight="auto"
            stickyHeaderDates={true}
            titleFormat={{
              month: "long",
              year: "numeric",
            }}
            eventClick={handleEventClick}
            datesSet={handleDatesSet}
            dayHeaderFormat={{
              weekday: isMobile ? "narrow" : "short", // 'narrow' will show single letter, 'short' shows abbreviated name
            }}
          />
        </div>
        <CalendarEventModal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          event={selectedEvent}
        />
      </div>
    </>
  );
};
