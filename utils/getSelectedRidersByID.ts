import { getRiderDataLocal } from "./getRiderDataLocal";

export const getSelectedRidersByID = async (ids: string[]) => {
  const riders = getRiderDataLocal();

  const selectedRiders = ids.map((id) => {
    const riderResults = riders.filter((riders) => riders.id === id);

    return riderResults[0];
  });

  return selectedRiders;
};

export const getRiderById = (id: string) => {
  const riders = getRiderDataLocal();

  return riders.find((rider) => rider.id === id);
};
