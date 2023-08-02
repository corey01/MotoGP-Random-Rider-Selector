import { formatInTimeZone } from "date-fns-tz";

export const localRaceTime = (dateTimeAsString: string) => {
  return formatInTimeZone(
    new Date(dateTimeAsString!),
    "Europe/London",
    "eee do MMM - kk:mmaaaaa'm'"
  );
};
