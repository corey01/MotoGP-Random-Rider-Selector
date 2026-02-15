import { Rider } from "@/models/rider";
import { getRiderDataLocal, RiderDataResponse } from "./getRiderDataLocal";
import riderData from "./riderData.json";
import { existsSync } from "fs";
import path from "path";

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
  manufacturer?: string;
  pictures?: {
    profile?: { main?: string | null; secondary?: string | null };
    bike?: { main?: string | null };
    helmet?: { main?: string | null };
    number?: string | null;
    portrait?: string | null;
  };
}

interface WorkerRidersResponse {
  ok?: boolean;
  year?: number;
  count?: number;
  riders?: Record<string, WorkerRider>;
}

interface LocalRiderLike {
  id?: string;
  legacy_id?: string | number;
  name?: string;
  surname?: string;
  birth_city?: string;
  birth_date?: string;
  years_old?: number;
  country?: { name?: string; flag?: string };
  current_career_step?: {
    season?: number;
    sponsored_team?: string;
    short_nickname?: string;
    team?: {
      name?: string;
      color?: string;
      text_color?: string;
      picture?: string;
      constructor?: { name?: string };
    };
    pictures?: {
      profile?: { main?: string | null; secondary?: string | null };
      bike?: { main?: string | null; secondary?: string | null };
      helmet?: { main?: string | null; secondary?: string | null };
      number?: string | null;
      portrait?: string | null;
    };
  };
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

const partition = (array: Rider[], isValid: (arg: Rider) => boolean) =>
  array.reduce<[Rider[], Rider[]]>(
    ([pass, fail], elem) => (isValid(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]]),
    [[], []]
  );

const splitName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { name: parts[0] || fullName || "Unknown", surname: "" };
  return { name: parts.slice(0, -1).join(" "), surname: parts[parts.length - 1] };
};

const localRiders = ((riderData as { riders?: LocalRiderLike[] })?.riders || []) as LocalRiderLike[];
const localById = new Map<string, LocalRiderLike>(
  localRiders
    .map((r) => [String(r.id || ""), r] as const)
    .filter(([id]) => !!id)
);
const localByLegacyId = new Map<string, LocalRiderLike>(
  localRiders
    .map((r) => [String(r.legacy_id || ""), r] as const)
    .filter(([id]) => !!id)
);
const loggedMissing = new Set<string>();

const fileNameFromUrl = (url?: string | null) => {
  if (!url) return null;
  const clean = String(url).split("?")[0];
  const parts = clean.split("/");
  return parts[parts.length - 1] || null;
};

const hasPublicFile = (relPath: string) => {
  const cleaned = relPath.replace(/^\/+/, "");
  return existsSync(path.join(process.cwd(), "public", cleaned));
};

const localOrOfficial = (
  officialUrl: string | null | undefined,
  localCandidates: string[],
  logKey: string
) => {
  if (!officialUrl) return null;
  for (const p of localCandidates) {
    if (hasPublicFile(p)) return p.startsWith("/") ? p : `/${p}`;
  }
  if (!loggedMissing.has(logKey)) {
    console.warn(`[riders] missing local image, fallback to official: ${officialUrl}`);
    loggedMissing.add(logKey);
  }
  return officialUrl;
};

function mapWorkerRider(rider: WorkerRider, idFromKey: string): Rider {
  const id = rider.id || idFromKey;
  const fullName = rider.name || "Unknown Rider";
  const { name, surname } = splitName(fullName);
  const local =
    localById.get(String(id)) ||
    localByLegacyId.get(String(id)) ||
    localRiders.find((r) => {
      const n = String(r?.name || "").toLowerCase();
      const s = String(r?.surname || "").toLowerCase();
      return n === name.toLowerCase() && s === surname.toLowerCase();
    });

  const localStep = local?.current_career_step || {};
  const localPics = localStep?.pictures || {};
  const workerPics = rider?.pictures || {};

  const profileOfficial = workerPics?.profile?.main || localPics?.profile?.main || null;
  const profileFile = fileNameFromUrl(profileOfficial);
  const profileMain = localOrOfficial(
    profileOfficial,
    [
      `riders/25/${profileFile || ""}`,
      `riders/24/${profileFile || ""}`,
      `riders/${profileFile || ""}`,
    ].filter((v) => !v.endsWith("/")),
    `profile:${id}:${profileFile || "none"}`
  );

  const portraitOfficial = workerPics?.portrait || localPics?.portrait || null;
  const portraitFile = fileNameFromUrl(portraitOfficial);
  const portraitMain = localOrOfficial(
    portraitOfficial,
    [
      `riders/25/portrait/${portraitFile || ""}`,
      `riders/24/portrait/${portraitFile || ""}`,
      `riders/portrait/${portraitFile || ""}`,
    ].filter((v) => !v.endsWith("/")),
    `portrait:${id}:${portraitFile || "none"}`
  );

  const bikeOfficial =
    workerPics?.bike?.main || rider?.teamPicture || localPics?.bike?.main || localStep?.team?.picture || null;

  return {
    id,
    name,
    surname,
    number: rider.number ?? 0,
    sponsoredTeam: rider.team || localStep?.sponsored_team || localStep?.team?.name || "",
    teamColor: rider.teamColor || localStep?.team?.color || null,
    textColor: rider.textColor || localStep?.team?.text_color || null,
    teamPicture: rider.teamPicture || localStep?.team?.picture || null,
    shortNickname: rider.shortName || localStep?.short_nickname || "",
    pictures: {
      profile: {
        main: profileMain,
        secondary: workerPics?.profile?.secondary || localPics?.profile?.secondary || null
      },
      bike: { main: bikeOfficial || null },
      helmet: { main: workerPics?.helmet?.main || localPics?.helmet?.main || null },
      number: workerPics?.number || localPics?.number || null,
      portrait: portraitMain,
    },
    from: {
      countryName: rider.nationality || local?.country?.name || "",
      countryFlag: rider.countryFlag || local?.country?.flag || "",
      birthCity: rider.birthCity || local?.birth_city || "",
    },
    birthDate: rider.birthDate || local?.birth_date || "",
    yearsOld: rider.yearsOld ?? local?.years_old ?? 0,
    riderType: isGuestRider(surname, name) ? "guest" : "standard",
  };
}

function toRiderDataResponse(riders: Rider[]): RiderDataResponse {
  const sorted = riders.sort((a, b) => (a.number || 999) - (b.number || 999));
  const [guestRiders, standardRiders] = partition(sorted, (rider) => rider.riderType === "guest");
  return { allRiders: sorted, guestRiders, standardRiders };
}

export async function getRiderData(): Promise<RiderDataResponse> {
  try {
    const defaultBaseUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:8787"
        : "https://cascading-monkeys.corey-obeirne.workers.dev";
    const baseUrl =
      process.env.MOTOGP_WORKER_URL ||
      process.env.NEXT_PUBLIC_MOTOGP_WORKER_URL ||
      defaultBaseUrl;
    const year = Number(process.env.MOTOGP_SEASON_YEAR || new Date().getFullYear());
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/riders?year=${year}`, {
      method: "GET",
      ...(process.env.NODE_ENV === "development"
        ? { cache: "no-store" as const }
        : { next: { revalidate: 300 } }),
    });

    if (!res.ok) throw new Error(`Failed rider fetch (${res.status})`);
    const payload = (await res.json()) as WorkerRidersResponse;
    const riderMap = payload?.riders || {};
    const allRiders = Object.entries(riderMap).map(([id, rider]) => mapWorkerRider(rider || {}, id));
    if (!allRiders.length) throw new Error("Empty rider payload");
    return toRiderDataResponse(allRiders);
  } catch (e) {
    console.warn("[riders] Falling back to local riderData.json", e);
    return getRiderDataLocal();
  }
}
