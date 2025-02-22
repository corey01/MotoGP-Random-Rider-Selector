'use client';

import FullCalendar from "@fullcalendar/react";
import { EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useState } from "react";
import { CalendarEventModal } from "../Modals/CalendarEventModal";

import { inter, motoGP } from "@/app/fonts";
import './Calendar.css'; 
import { MotoGpSeasonData, WsbkSeasonData } from "@/utils/getSeasonDataLocal";

export const Calendar = ({ motoGPData, wsbkData }: { motoGPData: MotoGpSeasonData, wsbkData: WsbkSeasonData }) => {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedEvent(clickInfo.event);
  };
  return (
    <div className="calendar-container">
      <div className={`calendar-wrapper ${inter.className}`}>
        <FullCalendar
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