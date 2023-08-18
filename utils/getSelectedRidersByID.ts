import { getRiderDataLocal } from "./getRiderDataLocal";

export const getSelectedRidersByID = async (ids: string[]) => {
  const { allRiders } = getRiderDataLocal();

  const selectedRiders = ids.map((id) => {
    const riderResults = allRiders.filter((rider) => rider.id === id);

    return riderResults[0];
  });

  return selectedRiders;
};

export const getRiderById = (id: string) => {
  const { allRiders } = getRiderDataLocal();

  return allRiders.find((rider) => rider.id === id);
};
