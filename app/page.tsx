"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./_components/AuthProvider";
import { NextRaceStrip } from "./_components/Dashboard/NextRaceStrip";
import { LiveSection } from "./_components/Dashboard/LiveSection";
import { WeekendFeed } from "./_components/Dashboard/WeekendFeed";
import { getDashboardData, type DashboardData } from "@/utils/getDashboardData";
import { ChampionshipStandings } from "./_components/Dashboard/ChampionshipStandings";
import style from "./Dashboard.module.scss";

const EMPTY: DashboardData = {
  nextRace: null,
  nextPerSeries: [],
  today: [],
  thisWeekend: [],
  subscribedSeries: [],
  showMotoGPChampionship: true,
};

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
      <LiveSection events={data.today} />
      <NextRaceStrip races={data.nextPerSeries} />
      {data.showMotoGPChampionship && <ChampionshipStandings series="motogp" />}
      <WeekendFeed events={data.thisWeekend} />
    </div>
  );
}
