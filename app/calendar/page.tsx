import { getSeasonDataLocal, getUnsortedSeasonDataLocal, getWsbkSeasonDataLocal } from "@/utils/getSeasonDataLocal";
import { Calendar } from "../_components/Calendar/Calendar";

const CalendarPage = async () => {
  const motoGPSeason = await getUnsortedSeasonDataLocal();
  const wsbkSeason = await getWsbkSeasonDataLocal();

  return (
    <Calendar motoGPData={motoGPSeason} wsbkData={wsbkSeason} />
  );
}

export default CalendarPage;