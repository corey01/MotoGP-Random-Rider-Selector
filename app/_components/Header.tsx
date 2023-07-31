import { Season } from "@/models/race";
import { motoGP } from "../fonts";
import NextRace from "./NextRace/NextRace";

const Header = ({ season }: { season: Season }) => {
  return (
    <>
      <h1 className={motoGP.className}> MotoGP Random Rider Selector</h1>
      <NextRace season={season} />
    </>
  );
};

export default Header;
