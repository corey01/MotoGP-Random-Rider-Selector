'use client';

import FullCalendar from "@fullcalendar/react";
import { EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useState, useRef } from "react";
import { CalendarEventModal } from "../Modals/CalendarEventModal";
import { CalendarLegend } from './CalendarLegend';

import { inter, motoGP } from "@/app/fonts";
import './Calendar.css'; 
import { MotoGpSeasonData, WsbkSeasonData } from "@/utils/getSeasonDataLocal";

export const Calendar = ({ motoGPData, wsbkData }: { motoGPData: MotoGpSeasonData, wsbkData: WsbkSeasonData }) => {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const calendarRef = useRef<any>(null);
  const touchStartRef = useRef({ x: 0, y: 0 });

  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedEvent(clickInfo.event);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
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
      const calendarApi = calendarRef.current.getApi();
      const viewEl = calendarApi.el.querySelector('.fc-view-harness');
      if (!viewEl) return;

      // Force a repaint to ensure animation runs
      void viewEl.offsetHeight;

      // Add initial animation class
      viewEl.classList.add(direction === 'next' ? 'slide-left-enter' : 'slide-right-enter');

      // Queue the month change
      setTimeout(() => {
        calendarApi[direction]();
        
        // Force another repaint
        void viewEl.offsetHeight;
        
        // Add final position class
        viewEl.classList.add('slide-center');

        // Clean up classes
        setTimeout(() => {
          viewEl.classList.remove('slide-left-enter', 'slide-right-enter', 'slide-center');
        }, 300);
      }, 50);
    }
  };

  return (
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
          headerToolbar={{
              left: 'title',
              center: 'prev today next',
              right: '' // Removed the view switching buttons
          }}
          firstDay={1}
          contentHeight="auto"
          stickyHeaderDates={true}
          titleFormat={{
            month: 'long',
            year: 'numeric'
          }}
          eventClick={handleEventClick}
        />
      </div>
      <CalendarLegend />
      <CalendarEventModal 
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
      />
    </div>
  );
};