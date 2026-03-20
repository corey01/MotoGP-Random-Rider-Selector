"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SweepstakeApp from "../_components/SweepstakeApp";
import { RiderDataResponse } from "@/utils/getRiderData";
import { getRiderDataLocal } from "@/utils/getRiderDataLocal";
import { useAuth } from "../_components/AuthProvider";

interface WorkerRider {
  id?: string;
  name?: string;
  shortName?: string;
  number?: number;
  nationality?: string;
  countryFlag?: string;
  birthCity?: string;
  birthDate?: string;
  yearsOld?: number;
  team?: string;
  teamColor?: string;
  textColor?: string;
  teamPicture?: string;
  pictures?: {
    profile?: { main?: string | null; secondary?: string | null };
    bike?: { main?: string | null };
    helmet?: { main?: string | null };
    number?: string | null;
    portrait?: string | null;
  };
}

interface WorkerRidersResponse {
  riders?: Record<string, WorkerRider>;
}

const guestRiderNames = [
  ["dani", "pedrosa"],
  ["stefan", "bradl"],
  ["danilo", "petrucci"],
  ["lorenzo", "savadori"],
  ["michele", "pirro"],
  ["jonas", "folger"],
];

const isGuestRider = (surname: string, name: string) => {
  const surnameMatch = guestRiderNames.find((val) => val[1] === surname.toLowerCase());
  return surnameMatch?.[0] === name.toLowerCase();
};

const splitName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { name: parts[0] || fullName || "Unknown", surname: "" };
  return { name: parts.slice(0, -1).join(" "), surname: parts[parts.length - 1] };
};

import { Rider } from "@/models/rider";

const partition = (array: Rider[], isValid: (arg: Rider) => boolean) =>
  array.reduce<[Rider[], Rider[]]>(
    ([pass, fail], elem) => (isValid(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]]),
    [[], []]
  );

const mapWorkerRider = (rider: WorkerRider, idFromKey: string): Rider => {
  const fullName = rider.name || "Unknown Rider";
  const { name, surname } = splitName(fullName);

  return {
    id: rider.id || idFromKey,
    dbId: 0,
    name,
    surname,
    number: rider.number ?? 0,
    sponsoredTeam: rider.team || "",
    teamColor: rider.teamColor || null,
    textColor: rider.textColor || null,
    teamPicture: rider.teamPicture || null,
    shortNickname: rider.shortName || "",
    pictures: {
      profile: {
        main: rider.pictures?.profile?.main || null,
        secondary: rider.pictures?.profile?.secondary || null,
      },
      bike: { main: rider.pictures?.bike?.main || rider.teamPicture || null },
      helmet: { main: rider.pictures?.helmet?.main || null },
      number: rider.pictures?.number || null,
      portrait: rider.pictures?.portrait || null,
    },
    from: {
      countryName: rider.nationality || "",
      countryFlag: rider.countryFlag || "",
      birthCity: rider.birthCity || "",
    },
    birthDate: rider.birthDate || "",
    yearsOld: rider.yearsOld ?? 0,
    riderType: isGuestRider(surname, name) ? "guest" : "standard",
  };
};

const toRiderDataResponse = (riders: Rider[]): RiderDataResponse => {
  const sorted = riders.sort((a, b) => (a.number || 999) - (b.number || 999));
  const [guestRiders, standardRiders] = partition(sorted, (rider) => rider.riderType === "guest");
  return { allRiders: sorted, guestRiders, standardRiders };
};

export default function SweepstakePage() {
  const [allRiders, setAllRiders] = useState<RiderDataResponse | null>(null);
  const { isLegacy, isLoading } = useAuth();
  const router = useRouter();
  const seasonYear = Number(
    process.env.NEXT_PUBLIC_MOTOGP_SEASON_YEAR || new Date().getFullYear()
  );

  useEffect(() => {
    if (!isLoading && !isLegacy) {
      router.replace("/");
    }
  }, [isLoading, isLegacy, router]);

  useEffect(() => {
    let cancelled = false;

    const loadRiders = async () => {
      try {
        const year = seasonYear;
        const defaultBaseUrl =
          process.env.NODE_ENV === "development"
            ? "http://localhost:8787"
            : "https://cascading-monkeys.corey-obeirne.workers.dev";
        const baseUrl =
          process.env.NEXT_PUBLIC_MOTOGP_WORKER_URL || defaultBaseUrl;

        const res = await fetch(`${baseUrl.replace(/\/$/, "")}/riders?year=${year}`, {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`Failed rider fetch (${res.status})`);

        const payload = (await res.json()) as WorkerRidersResponse;
        const riderMap = payload?.riders || {};
        const mapped = Object.entries(riderMap).map(([id, rider]) => mapWorkerRider(rider || {}, id));
        if (!mapped.length) throw new Error("Empty rider payload");

        if (!cancelled) setAllRiders(toRiderDataResponse(mapped));
      } catch {
        if (!cancelled) setAllRiders(getRiderDataLocal());
      }
    };

    void loadRiders();

    return () => {
      cancelled = true;
    };
  }, [seasonYear]);

  if (isLoading || !isLegacy || !allRiders) return null;
  return <SweepstakeApp allRiders={allRiders} seasonYear={seasonYear} />;
}
