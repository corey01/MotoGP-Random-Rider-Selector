'use client';

import { Calendar } from "../_components/Calendar/Calendar";
import { useState } from "react";
import { getUnsortedSeasonDataLocal, getWsbkSeasonDataLocal } from "@/utils/getSeasonDataLocal";

export default function CalendarPage() {
  const [showAllSessions, setShowAllSessions] = useState(false);
  
  const motoGpData = getUnsortedSeasonDataLocal(!showAllSessions); // Pass filter flag
  const wsbkData = getWsbkSeasonDataLocal(!showAllSessions); // Pass filter flag

  return (
    <Calendar 
      motoGPData={motoGpData}
      wsbkData={wsbkData}
      showAllSessions={showAllSessions}
      onToggleSessions={() => setShowAllSessions(prev => !prev)}
    />
  );
}