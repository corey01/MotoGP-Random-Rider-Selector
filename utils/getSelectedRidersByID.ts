import { Rider } from "@/models/rider";
import { getRiderDataLocal } from "./getRiderDataLocal";

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
      if (parsed?.seasonYear && Number(parsed.seasonYear) !== activeSeasonYear) {
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
      if (parsed?.seasonYear && Number(parsed.seasonYear) !== activeSeasonYear) {
        localStorage.removeItem("riderList");
      } else if (Array.isArray(parsed?.riders) && parsed.riders.length) {
        return parsed.riders;
      }
    }
  } catch {}

  return [];
};

export const getSelectedRidersByID = async (ids: string[]) => {
  const cached = getCachedRiders();
  const allRiders = cached.length ? cached : getRiderDataLocal().allRiders;

  const selectedRiders = ids.map((id) => {
    const riderResults = allRiders.filter((rider) => rider.id === id);

    return riderResults[0];
  });

  return selectedRiders;
};

export const getRiderById = (id: string) => {
  const cached = getCachedRiders();
  if (cached.length) {
    const hit = cached.find((rider) => rider.id === id);
    if (hit) return hit;
  }

  const { allRiders } = getRiderDataLocal();

  return allRiders.find((rider) => rider.id === id);
};
