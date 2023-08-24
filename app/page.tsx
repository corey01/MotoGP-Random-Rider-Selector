"use client";

import App from "@/app/_components/App";
import { getRiderData } from "@/utils/getRiderData";
import { getSeasonDataLocal } from "@/utils/getSeasonDataLocal";
import { Suspense } from "react";

const Home = async () => {
  const allRiders = await getRiderData();
  const season = await getSeasonDataLocal();

  return (
    <Suspense>
      <App allRiders={allRiders} season={season} />
    </Suspense>
  );
};

export default Home;
