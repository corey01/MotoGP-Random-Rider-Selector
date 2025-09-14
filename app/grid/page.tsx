import GridPanel from "../_components/Grid/Grid";
import { getRiderData } from "@/utils/getRiderData";

export default async function GridPage() {
  const riders = await getRiderData();
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 16 }}>
      <GridPanel riders={[...riders.standardRiders, ...riders.guestRiders]} />
    </div>
  );
}
