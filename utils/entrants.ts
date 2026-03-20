export const defaultEntrants = ["Davina", "Djion", "Corey", "Norma"];

const entrantImageAliases: Record<string, string> = {
  davina: "mum",
  djion: "dad",
};

export const getEntrantImage = (value: string) => {
  const key = value.toLowerCase();
  const filename = entrantImageAliases[key] ?? key;
  return `/entrants/${filename}.jpg`;
};

export const placeholderImage = "/entrants/placeholder.png";
