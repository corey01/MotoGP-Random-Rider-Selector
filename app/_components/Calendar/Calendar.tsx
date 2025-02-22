'use client';

import FullCalendar from "@fullcalendar/react";
import { EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useState, useRef } from "react";
import { CalendarEventModal } from "../Modals/CalendarEventModal";

import { inter, motoGP } from "@/app/fonts";
import './Calendar.css'; 
import { MotoGpSeasonData, WsbkSeasonData } from "@/utils/getSeasonDataLocal";

export const Calendar = ({ motoGPData, wsbkData }: { motoGPData: MotoGpSeasonData, wsbkData: WsbkSeasonData }) => {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const calendarRef = useRef<any>(null);

  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedEvent(clickInfo.event);
  };

  const handleSwipe = (e: React.TouchEvent) => {
    if (!calendarRef.current) return;
    
    const calendarApi = calendarRef.current.getApi();
    const touchEndX = e.changedTouches[0].clientX;
    const touchStartX = (e.currentTarget as any).touchStartX;
    const direction = touchStartX - touchEndX > 100 ? 'next' : touchEndX - touchStartX > 100 ? 'prev' : null;

    if (direction) {
      const viewEl = calendarApi.el.querySelector('.fc-view-harness');
      if (viewEl) {
        // Add entrance animation class
        viewEl.classList.add(direction === 'next' ? 'slide-left-enter' : 'slide-right-enter');
        
        // Wait a frame to ensure the animation starts
        requestAnimationFrame(() => {
          // Trigger the month change
          calendarApi[direction]();
          
          // Add the center position class
          requestAnimationFrame(() => {
            viewEl.classList.add('slide-center');
            
            // Clean up classes after animation
            setTimeout(() => {
              viewEl.classList.remove('slide-left-enter', 'slide-right-enter', 'slide-center');
            }, 300);
          });
        });
      }
    }
  };

  return (
    <div className="calendar-container">
      <div className={`calendar-wrapper ${inter.className}`}
           onTouchStart={(e) => (e.currentTarget as any).touchStartX = e.touches[0].clientX}
           onTouchEnd={handleSwipe}>
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

      <CalendarEventModal 
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
      />
    </div>
  );
};