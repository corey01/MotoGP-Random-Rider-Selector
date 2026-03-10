"use client";

import { useEffect, useState } from "react";
import SweepstakeApp from "../_components/SweepstakeApp";
import { getRiderData, type RiderDataResponse } from "@/utils/getRiderData";

export default function SweepstakePage() {
  const [allRiders, setAllRiders] = useState<RiderDataResponse | null>(null);
  const seasonYear = Number(
    process.env.NEXT_PUBLIC_MOTOGP_SEASON_YEAR || new Date().getFullYear()
  );

  useEffect(() => {
    let cancelled = false;

    const loadRiders = async () => {
      try {
        const data = await getRiderData();
        if (!cancelled) setAllRiders(data);
      } catch {
        if (!cancelled) setAllRiders({ allRiders: [], standardRiders: [], guestRiders: [] });
      }
    };

    void loadRiders();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!allRiders) return null;
  return <SweepstakeApp allRiders={allRiders} seasonYear={seasonYear} />;
}
