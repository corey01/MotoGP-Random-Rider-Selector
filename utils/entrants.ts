export const defaultEntrants = ["Mum", "Dad", "Corey", "Norma"];

export const isInDefaultEntrants = (thisEntrant: string) => {
  const lookup = defaultEntrants.find((ent) => ent === thisEntrant);

  return !!lookup || false;
};

export const getEntrantImage = (value: string) => {
  if (isInDefaultEntrants(value)) {
    return require(`/public/entrants/${value.toLowerCase()}.jpg?resize&size=200&webp`);
  }

  return require(`/public/entrants/placeholder.png?resize&size=200&webp`);
};
