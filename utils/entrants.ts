export const defaultEntrants = ["Mum", "Dad", "Corey", "Norma"];

export const isInDefaultEntrants = (thisEntrant: string) => {
  const lookup = defaultEntrants.find((ent) => ent === thisEntrant);

  return !!lookup || false;
};
