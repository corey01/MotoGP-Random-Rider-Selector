'use client';

import FullCalendar from "@fullcalendar/react";
import { EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useState, useRef } from "react";
import { CalendarEventModal } from "../Modals/CalendarEventModal";
import { CalendarLegend } from './CalendarLegend';
import { CalendarTitle } from './CalendarTitle';

import { inter, motoGP } from "@/app/fonts";
import './Calendar.css'; 
import { MotoGpSeasonData, WsbkSeasonData } from "@/utils/getSeasonDataLocal";

export const Calendar = ({ motoGPData, wsbkData }: { motoGPData: MotoGpSeasonData, wsbkData: WsbkSeasonData }) => {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const calendarRef = useRef<any>(null);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [navigationDirection, setNavigationDirection] = useState<'next' | 'prev' | 'today' | undefined>();
  const isAnimatingRef = useRef(false);

  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedEvent(clickInfo.event);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const animateViewChange = (direction: 'next' | 'prev' | 'today') => {
    if (!calendarRef.current || isAnimatingRef.current) return;
    
    isAnimatingRef.current = true;
    const calendarApi = calendarRef.current.getApi();
    const viewEl = calendarApi.el.querySelector('.fc-view-harness');
    if (!viewEl) {
      isAnimatingRef.current = false;
      return;
    }

    setNavigationDirection(direction);
    void viewEl.offsetHeight;
    const animationClass = direction === 'next' ? 'slide-left-enter' : 'slide-right-enter';
    viewEl.classList.add(animationClass);

    // Execute the calendar change immediately
    if (direction === 'today') {
      calendarApi.today();
    } else {
      calendarApi[direction]();
    }
    
    // Update current date immediately after calendar change
    setCurrentDate(calendarApi.getDate());

    requestAnimationFrame(() => {
      viewEl.classList.add('slide-center');

      setTimeout(() => {
        viewEl.classList.remove(animationClass, 'slide-center');
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

    const direction = deltaX > 100 ? 'next' : deltaX < -100 ? 'prev' : null;

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

  return (
    <>
      <CalendarLegend />
      <CalendarTitle currentDate={currentDate} direction={navigationDirection} />
      <div className="calendar-container">
        <div className={`calendar-wrapper ${inter.className}`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={[...motoGPData, ...wsbkData]}
            editable={false}
            eventStartEditable={false}
            eventDurationEditable={false}
            selectable={false}
            selectMirror={false}
            // Calendar settings
            height="auto"
            handleWindowResize={true}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: 'short'
            }}
            eventContent={(eventInfo) => ({
              html: `
              <div class="event-content">
              <div class="event-time">${eventInfo.timeText}</div>
              <div class="event-title">${eventInfo.event.title}</div>
              </div>
              `
            })}
            customButtons={{
              prev: {
                click: () => animateViewChange('prev')
              },
              next: {
                click: () => animateViewChange('next')
              },
              today: {
                text: 'Current Month',
                click: () => animateViewChange('today')
              }
            }}
            headerToolbar={{
              left: '',
              center: 'prev today next',
              right: '' // Removed title from header
            }}
            firstDay={1}
            contentHeight="auto"
            stickyHeaderDates={true}
            titleFormat={{
              month: 'long',
              year: 'numeric'
            }}
            eventClick={handleEventClick}
            datesSet={handleDatesSet}
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