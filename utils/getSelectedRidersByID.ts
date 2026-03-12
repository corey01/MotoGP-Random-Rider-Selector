import { Rider } from "@/models/rider";

const getActiveSeasonYear = () => {
  if (typeof window === "undefined") return new Date().getFullYear();
  const fromWindow = (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_MOTOGP_SEASON_YEAR;
  const fromProcess = process.env.NEXT_PUBLIC_MOTOGP_SEASON_YEAR;
  return Number(fromWindow || fromProcess || new Date().getFullYear());
};

const getCachedRiders = (): Rider[] => {
  if (typeof window === "undefined") return [];
  const activeSeasonYear = getActiveSeasonYear();

  try {
    const rawAll = localStorage.getItem("allRidersCache");
    if (rawAll) {
      const parsed = JSON.parse(rawAll) as { riders?: Rider[]; seasonYear?: number };
      const cachedSeasonYear = Number(parsed?.seasonYear);
      if (!cachedSeasonYear || cachedSeasonYear !== activeSeasonYear) {
        localStorage.removeItem("allRidersCache");
      } else if (Array.isArray(parsed?.riders) && parsed.riders.length) {
        return parsed.riders;
      }
    }
  } catch {}

  try {
    const rawList = localStorage.getItem("riderList");
    if (rawList) {
      const parsed = JSON.parse(rawList) as { riders?: Rider[]; seasonYear?: number };
      const cachedSeasonYear = Number(parsed?.seasonYear);
      if (!cachedSeasonYear || cachedSeasonYear !== activeSeasonYear) {
        localStorage.removeItem("riderList");
      } else if (Array.isArray(parsed?.riders) && parsed.riders.length) {
        return parsed.riders;
      }
    }
  } catch {}

  return [];
};

const createUnknownRider = (id: string): Rider => ({
  id,
  dbId: 0,
  name: "Unknown",
  surname: "Rider",
  number: 0,
  sponsoredTeam: "",
  teamColor: null,
  textColor: null,
  teamPicture: null,
  shortNickname: "",
  pictures: {
    profile: { main: null, secondary: null },
    bike: { main: null },
    helmet: { main: null },
    number: null,
    portrait: null,
  },
  from: {
    countryName: "",
    countryFlag: "",
    birthCity: "",
  },
  birthDate: "",
  yearsOld: 0,
  riderType: "standard",
});

export const getSelectedRidersByID = async (ids: string[]) => {
  const cached = getCachedRiders();
  return ids.map((id) => cached.find((rider) => rider.id === id) || createUnknownRider(id));
};

export const getRiderById = (id: string) => {
  const cached = getCachedRiders();
  return cached.find((rider) => rider.id === id) || createUnknownRider(id);
};
