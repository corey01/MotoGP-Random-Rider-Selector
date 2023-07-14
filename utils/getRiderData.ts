export async function getRiderData() {
  const res = await fetch(
    "https://api.motogp.com/riders-api/season/2023/riders?category=737ab122-76e1-4081-bedb-334caaa18c70",
    { mode: "no-cors" }
  );

  console.log("done get");
  const jsonRes = await res.json();

  console.log(jsonRes);

  const riders = jsonRes.map((rider) => {
    const {
      name,
      surname,
      current_career_step: {
        number,
        sponsored_team,
        team: { color, picture },
        short_nickname,
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
      short_nickname,
      pictures,
      from: {
        countryName,
        countryFlag,
        birthCity,
      },
      birthDate,
      yearsOld,
    };
  });

  return riders;
}
