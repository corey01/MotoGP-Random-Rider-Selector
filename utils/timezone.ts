export function getDeviceTimezoneLabel(date: Date): string {
  try {
    const parts = new Intl.DateTimeFormat(undefined, { timeZoneName: "short" }).formatToParts(date);
    return parts.find((part) => part.type === "timeZoneName")?.value?.toUpperCase() ?? "";
  } catch {
    return "";
  }
}

export function getCurrentGmtOffsetLabel(date = new Date()): string {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const abs = Math.abs(offset);
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;

  return mins === 0
    ? `GMT${sign}${hours}`
    : `GMT${sign}${hours}:${String(mins).padStart(2, "0")}`;
}
