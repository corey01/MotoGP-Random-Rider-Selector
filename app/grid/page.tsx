"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import GridPanel from "../_components/Grid/Grid";
import { getRiderData, type RiderDataResponse } from "@/utils/getRiderData";
import style from "./page.module.scss";

export default function GridPage() {
  const searchParams = useSearchParams();
  const [riders, setRiders] = useState<RiderDataResponse | null>(null);
  const roundIdParam = searchParams.get("roundId");
  const roundId = roundIdParam ? Number(roundIdParam) : null;
  const eventName = searchParams.get("eventName");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await getRiderData();
        if (!cancelled) setRiders(data);
      } catch {
        if (!cancelled) setRiders({ allRiders: [], standardRiders: [], guestRiders: [] });
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!riders) return null;

  return (
    <div className={style.page}>
      <div className={style.panel}>
        <GridPanel
          riders={[...riders.standardRiders, ...riders.guestRiders]}
          roundIdOverride={Number.isFinite(roundId) ? roundId : null}
          eventNameOverride={eventName}
        />
      </div>
    </div>
  );
}
