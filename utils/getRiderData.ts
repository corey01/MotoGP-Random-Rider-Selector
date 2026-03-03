import { Rider } from "@/models/rider";

export interface RiderDataResponse {
  allRiders: Rider[];
  standardRiders: Rider[];
  guestRiders: Rider[];
}

interface ApiRider {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  number?: number | null;
  nationality?: string | null;
  team?: string | null;
  teamColor?: string | null;
  textColor?: string | null;
  pictures?: {
    profile?: string | null;
    bike?: string | null;
    helmet?: string | null;
    portrait?: string | null;
    number?: string | null;
  } | null;
}

interface ApiRidersResponse {
  ok?: boolean;
  riders?: ApiRider[];
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

function mapApiRider(rider: ApiRider): Rider {
  let name = String(rider.firstName || "").trim();
  let surname = String(rider.lastName || "").trim();

  if (!name && !surname) {
    const parsed = splitName(String(rider.name || "Unknown Rider"));
    name = parsed.name;
    surname = parsed.surname;
  }

  const pics = rider.pictures || {};

  return {
    id: String(rider.id || ""),
    name,
    surname,
    number: rider.number ?? 0,
    sponsoredTeam: rider.team || "",
    teamColor: rider.teamColor || null,
    textColor: rider.textColor || null,
    teamPicture: pics.bike || null,
    shortNickname: "",
    pictures: {
      profile: { main: pics.profile || null, secondary: null },
      bike: { main: pics.bike || null },
      helmet: { main: pics.helmet || null },
      number: pics.number || null,
      portrait: pics.portrait || null,
    },
    from: {
      countryName: rider.nationality || "",
      countryFlag: "",
      birthCity: "",
    },
    birthDate: "",
    yearsOld: 0,
    riderType: isGuestRider(surname, name) ? "guest" : "standard",
  };
}

function toRiderDataResponse(riders: Rider[]): RiderDataResponse {
  const sorted = riders.sort((a, b) => (a.number || 999) - (b.number || 999));
  const [guestRiders, standardRiders] = partition(sorted, (rider) => rider.riderType === "guest");
  return { allRiders: sorted, guestRiders, standardRiders };
}

const getBaseUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_RACECAL_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_RACECAL_URL is not set");
  return baseUrl.replace(/\/$/, "");
};

export async function getRiderData(): Promise<RiderDataResponse> {
  const year = Number(process.env.NEXT_PUBLIC_MOTOGP_SEASON_YEAR || new Date().getFullYear());
  const res = await fetch(`${getBaseUrl()}/riders?year=${year}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`RaceCal riders failed (${res.status})`);

  const payload = (await res.json()) as ApiRidersResponse;
  const allRiders = (payload?.riders ?? []).map(mapApiRider);
  if (!allRiders.length) throw new Error("Empty RaceCal rider payload");

  return toRiderDataResponse(allRiders);
}
