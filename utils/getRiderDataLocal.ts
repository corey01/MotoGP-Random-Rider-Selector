import riderData from "../utils/riderData.json";

export async function getRiderDataLocal() {
  const riders = riderData.map((rider) => {
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
    };
  });

  // return riders;

  return { riders };
}
