"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./_components/AuthProvider";
import { NextRaceStrip } from "./_components/Dashboard/CountdownCard";
import { TodaySection } from "./_components/Dashboard/TodaySection";
import { UpcomingEvents } from "./_components/Dashboard/UpcomingEvents";
import { getDashboardData, type DashboardData } from "@/utils/getDashboardData";
import { StandingsWidget } from "./_components/Dashboard/StandingsWidget";
import style from "./Dashboard.module.scss";

const EMPTY: DashboardData = { nextRace: null, nextPerSeries: [], today: [], thisWeekend: [], subscribedSeries: [] };

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [data, setData] = useState<DashboardData>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    getDashboardData()
      .then(setData)
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (isLoading || loading) {
    return (
      <div className={style.loadingState}>
        <p>Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div className={style.page}>
      <TodaySection events={data.today} />
      <NextRaceStrip races={data.nextPerSeries} />
      <StandingsWidget series="motogp" />
      <UpcomingEvents events={data.thisWeekend} />
    </div>
  );
}
