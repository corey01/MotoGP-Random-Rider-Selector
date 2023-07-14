export interface Rider {
  name: string;
  surname: string;
  number: number;
  sponsoredTeam: string;
  teamColor: string;
  teamPicture: string;
  shortNickname: string;
  pictures: {
    profile: {
      main: string;
      secondary?: string;
    };
    bike: {
      main: string;
      secondary?: null;
    };
    helmet: {
      main: string;
      secondary?: null;
    };
    number: string;
    portrait: string;
  };
  from: {
    countryName: string;
    countryFlag: string;
    birthCity: string;
  };
  birthDate: string;
  yearsOld: number;
  id: string;
}

export interface SelectedRider {
  entrant: string;
  rider: Rider;
}
