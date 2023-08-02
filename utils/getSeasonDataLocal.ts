import { Season } from "@/models/race";
import seasonData from "../utils/seasonData.json";

const defaultSeasonObject = {
  past: [],
  future: [],
  current: [],
};

export async function getSeasonDataLocal() {
  const season: Season = seasonData.reduce((allSeasonsObject, season) => {
    let key: keyof typeof defaultSeasonObject;

    if (season.status === "FINISHED") {
      key = "past";
    } else {
      const now = new Date();
      const startDate = new Date(season.date_start);
      const endDate = new Date(season.date_end);

      if (startDate < now && endDate > now) {
        key = "current";
      } else {
        key = "future";
      }
    }
    return {
      ...allSeasonsObject,
      [key]: [...allSeasonsObject[key], season],
    };
  }, defaultSeasonObject);

  return season;
}
