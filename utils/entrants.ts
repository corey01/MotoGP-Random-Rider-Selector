export const defaultEntrants = ["Mum", "Dad", "Corey", "Norma"];

const acceptedEntrants = [...defaultEntrants, "Danii", "Duffy", "Matt"];

export const isInAcceptedEntrants = (thisEntrant: string) => {
  const lookup = acceptedEntrants.find(
    (ent) => ent.toLowerCase() === thisEntrant.toLowerCase()
  );

  return !!lookup || false;
};

export const getEntrantImage = (value: string) => {
  if (isInAcceptedEntrants(value)) {
    return require(`/public/entrants/${value.toLowerCase()}.jpg?resize&size=200&webp`);
  }

  return require(`/public/entrants/placeholder.png?resize&size=200&webp`);
};
