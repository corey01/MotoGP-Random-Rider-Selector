"use client";

import { useEffect, useState } from "react";
import GridPanel from "../_components/Grid/Grid";
import { getRiderData, type RiderDataResponse } from "@/utils/getRiderData";

export default function GridPage() {
  const [riders, setRiders] = useState<RiderDataResponse | null>(null);

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
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 16 }}>
      <GridPanel riders={[...riders.standardRiders, ...riders.guestRiders]} />
    </div>
  );
}
