import { Rider } from "@/models/rider";
import riderData from "../utils/riderData.json";

export interface RiderDataResponse {
  allRiders: Rider[];
  standardRiders: Rider[];
  guestRiders: Rider[];
}

const guestRiderNames = [
  ["dani", "pedrosa"],
  ["stefan", "bradl"],
  ["danilo", "petrucci"],
  ["lorenzo", "savadori"],
  ["michele", "pirro"],
  ["jonas", "folger"],
];

const isGuestRider = (surname: string, name: string) => {
  let value = false;

  const surnameMatch = guestRiderNames.find((val, idx) => {
    if (val[1] === surname.toLowerCase()) return val;
  });

  if (surnameMatch?.[0] === name.toLowerCase()) {
    value = true;
  }

  return value;
};

function partition(array: Rider[], isValid: (arg: Rider) => Boolean) {
  return array.reduce<[Rider[], Rider[]]>(
    ([pass, fail], elem) => {
      return isValid(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]];
    },
    [[], []]
  );
}

export function getRiderDataLocal(): RiderDataResponse {
  const allRiders = riderData.map((rider) => {
    const {
      id,
      name,
      surname,
      current_career_step: {
        number,
        sponsored_team,
        team: { color, picture },
        short_nickname: shortNickname,
        pictures,
      },
      country: { name: countryName, flag: countryFlag },
      birth_city: birthCity,
      birth_date: birthDate,
      years_old: yearsOld,
    } = rider;

    return {
      name,
      surname,
      number,
      sponsoredTeam: sponsored_team,
      teamColor: color,
      teamPicture: picture,
      shortNickname,
      pictures,
      from: {
        countryName,
        countryFlag,
        birthCity,
      },
      birthDate,
      yearsOld,
      id,
      riderType: isGuestRider(surname, name) ? "guest" : "standard",
    };
  });

  const [guestRiders, standardRiders] = partition(
    allRiders,
    (rider) => rider.riderType === "guest"
  );

  return { allRiders, guestRiders, standardRiders };
}
