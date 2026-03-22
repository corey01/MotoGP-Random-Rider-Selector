"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./_components/AuthProvider";
import { CountdownCard } from "./_components/Dashboard/CountdownCard";
import { UpcomingEvents } from "./_components/Dashboard/UpcomingEvents";
import { getDashboardData, type DashboardData } from "@/utils/getDashboardData";
import style from "./Dashboard.module.scss";

const EMPTY: DashboardData = { nextRace: null, upcoming: [], subscribedSeries: [] };

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
      <div className={style.grid}>
        <section className={style.countdownSection}>
          <CountdownCard nextRace={data.nextRace} />
        </section>
        <section className={style.feedSection}>
          <h2 className={style.feedTitle}>Upcoming Events</h2>
          <UpcomingEvents events={data.upcoming} />
        </section>
      </div>
    </div>
  );
}
