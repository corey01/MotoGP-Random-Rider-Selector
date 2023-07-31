import App from "@/app/_components/App";
import { getRiderData } from "@/utils/getRiderData";
import { getSeasonDataLocal } from "@/utils/getSeasonDataLocal";

const Home = async () => {
  const allRiders = await getRiderData();
  const season = await getSeasonDataLocal();

  return <App allRiders={allRiders.riders} season={season} />;
};

export default Home;
