"use client";

import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useEffect, useState } from "react";
import style from "./NextRace.module.scss";

type NextGpResponse = {
  status?: string;
  event?: {
    name?: string;
    circuit?: string | null;
    country?: string | null;
    window?: {
      start?: string | null;
      end?: string | null;
    };
  };
};

const NextRace = () => {
  const [data, setData] = useState<NextGpResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const defaultBaseUrl =
          process.env.NODE_ENV === "development"
            ? "http://localhost:8787"
            : "https://cascading-monkeys.corey-obeirne.workers.dev";
        const baseUrl = process.env.NEXT_PUBLIC_MOTOGP_WORKER_URL || defaultBaseUrl;
        const res = await fetch(
          `${baseUrl.replace(/\/$/, "")}/get_next_grandprix`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error(`next-gp failed (${res.status})`);
        const payload = (await res.json()) as NextGpResponse;
        if (!cancelled) setData(payload);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return null;

  const status = String(data?.status || "").toLowerCase();
  if (!data?.event || status === "offseason") return null;

  const isActiveNow = status === "live";
  const raceName = data.event.name || "Next Grand Prix";
  const startRaw = data.event.window?.start || "";
  const endRaw = data.event.window?.end || "";
  const startDate = startRaw ? new Date(startRaw) : null;
  const endDate = endRaw ? new Date(endRaw) : null;
  const hasStartDate = !!(startDate && !Number.isNaN(startDate.valueOf()));
  const hasEndDate = !!(endDate && !Number.isNaN(endDate.valueOf()));

  return (
    <div className={`${style.nextRace} ${isActiveNow ? style.ongoing : ""}`}>
      <h2>{isActiveNow ? "Ongoing Grand Prix" : "Next Grand Prix"}</h2>
      <p className={style.raceName}>
        <Link href="/calendar">{raceName}</Link>
      </p>
      {(data.event.circuit || data.event.country) && (
        <p>
          {data.event.circuit || ""}
          {data.event.circuit && data.event.country ? " - " : ""}
          {data.event.country || ""}
        </p>
      )}
      {hasStartDate && (
        <p>
          {format(startDate as Date, "eee do")}
          {hasEndDate ? ` - ${format(endDate as Date, "eee do MMM yy")}` : ""}
        </p>
      )}
      {!isActiveNow && hasStartDate && (
        <p>
          Starts in {formatDistanceToNow(startDate as Date) + "!"}
        </p>
      )}
    </div>
  );
};

export default NextRace;
