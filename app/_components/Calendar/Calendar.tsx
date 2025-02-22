'use client';

import FullCalendar from "@fullcalendar/react";
import { EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useState } from "react";
import { CalendarEventModal } from "../Modals/CalendarEventModal";

import './Calendar.css'; 
import { inter, motoGP } from "@/app/fonts";

export const Calendar = ({ motoGPData, wsbkData }: { motoGPData: any, wsbkData: any }) => {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedEvent(clickInfo.event);
  };

  return (
    <div className="calendar-container">
      <div className={`calendar-wrapper ${inter.className}`}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin,
              interactionPlugin]}
          initialView="dayGridMonth"
          events={[...motoGPData, ...wsbkData]}
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
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          firstDay={1}
          height="100%"
          contentHeight="auto"
          handleWindowResize={true}
          stickyHeaderDates={true}
          titleFormat={{ 
            year: 'numeric',
            month: 'long'
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