import { Season } from "@/models/race";
import seasonData from "../utils/seasonData.json";
import { add, format } from "date-fns";

const defaultSeasonObject = {
  past: [],
  future: [],
  current: [],
};

export async function getSeasonDataLocal() {
  const season: Season = seasonData.reduce((allSeasonsObject, season) => {
    let key: keyof typeof defaultSeasonObject;
    const endDate = add(new Date(season.date_end), {
      hours: 23,
      minutes: 59,
    });
    const now = new Date();

    if (season.status === "FINISHED" || endDate < now) {
      key = "past";
    } else {
      const startDate = new Date(season.date_start);

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
