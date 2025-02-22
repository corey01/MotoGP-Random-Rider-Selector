import { getRiderData } from "@/utils/getRiderData";
import { getSeasonDataLocal } from "@/utils/getSeasonDataLocal";
import { Suspense } from "react";
import SweepstakeApp from "../_components/SweepstakeApp";

const SweepstakePage = async () => {
  const allRiders = await getRiderData();
  const season = await getSeasonDataLocal();

  return (
    <Suspense>
      <SweepstakeApp allRiders={allRiders} season={season} />
    </Suspense>
  );
};

export default SweepstakePage;
