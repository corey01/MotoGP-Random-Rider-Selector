"use client";

import { Calendar } from "../_components/Calendar/Calendar";
import { useState } from "react";
import {
  getBsbSeasonDataLocal,
  getUnsortedSeasonDataLocal,
  getWsbkSeasonDataLocal,
} from "@/utils/getSeasonDataLocal";

export default function CalendarPage() {
  const [showAllSessions, setShowAllSessions] = useState(false);

  const motoGpData = getUnsortedSeasonDataLocal(!showAllSessions); // Pass filter flag
  const wsbkData = getWsbkSeasonDataLocal(!showAllSessions); // Pass filter flag
  const bsbData = getBsbSeasonDataLocal(!showAllSessions);

  return (
    <Calendar
      motoGPData={motoGpData}
      wsbkData={wsbkData}
      bsbData={bsbData}
      showAllSessions={showAllSessions}
      onToggleSessions={() => setShowAllSessions((prev) => !prev)}
    />
  );
}
