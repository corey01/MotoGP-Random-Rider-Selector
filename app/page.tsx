import App from "@/Components/App";
import { Rider } from "@/models/rider";
import { getRiderData } from "@/utils/getRiderData";

const Home = async () => {
  const allRiders = await getRiderData();

  return <App allRiders={allRiders.riders} />;
};

export default Home;
