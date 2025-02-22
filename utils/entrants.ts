export const defaultEntrants = ["Davina", "Djion", "Corey", "Norma"];

const acceptedEntrants = [...defaultEntrants, "Danii", "Duffy", "Matt"];

const findEntrantImgName = (entrant: string) => {
  switch (entrant) {
    case "davina":
      return "mum";

    case "djion":
      return "dad";
    
    default:
      return entrant;
  }
}

export const isInAcceptedEntrants = (thisEntrant: string) => {
  const lookup = acceptedEntrants.find(
    (ent) => ent.toLowerCase() === thisEntrant.toLowerCase()
  );

  return !!lookup || false;
};



export const getEntrantImage = (value: string) => {
  if (isInAcceptedEntrants(value)) {
    return require(`/public/entrants/${findEntrantImgName(value.toLowerCase())}.jpg?resize&size=200&webp`);
  }

  return require(`/public/entrants/placeholder.png?resize&size=200&webp`);
};
