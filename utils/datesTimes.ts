import { formatInTimeZone } from "date-fns-tz";

export const localRaceTime = (dateTimeAsString: string, country?: string) => {
  try {
    

  return formatInTimeZone(
    new Date(dateTimeAsString!),
    "Europe/London",
    "eee do MMM - kk:mmaaaaa'm'"
  );
} catch (error) {
    console.log('error with time', { error }, 'time to parse: ', dateTimeAsString, country);

}
};
