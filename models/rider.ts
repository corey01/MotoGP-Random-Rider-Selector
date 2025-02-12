export interface Rider {
  name: string;
  surname: string;
  number: number;
  sponsoredTeam: string;
  teamColor: string | null;
  textColor: string | null;
  teamPicture: string | null;
  shortNickname: string;
  pictures: {
    profile: {
      main: string | null;
      secondary?: string | null;
    };
    bike: {
      main: string | null;
    };
    helmet: {
      main: string | null;
    };
    number: string | null;
    portrait: string | null;
  };
  from: {
    countryName: string;
    countryFlag: string;
    birthCity: string;
  };
  birthDate: string;
  yearsOld: number;
  id: string;
  riderType: string;
}

export interface SelectedRider {
  entrant: string;
  rider: Rider;
}
