import { Rider } from "@/models/rider";
import { getRiderDataLocal } from "./getRiderDataLocal";

interface RiderData {
  riders: Rider[];
}

export async function getRiderData() {
  // const res = await fetch(
  //   // (process.env.NEXT_PUBLIC_URL as string) + "/riders",
  //   "/riders/",
  //   { method: "GET" }
  //   // "https://api.motogp.com/riders-api/season/2023/riders?category=737ab122-76e1-4081-bedb-334caaa18c70",
  // );
  // if (!res.ok) {
  //   // This will activate the closest `error.js` Error Boundary
  //   throw new Error("Failed to fetch data");
  // }

  // console.log("done get");
  // const jsonRes = await res.json();

  const jsonRes = await getRiderDataLocal();

  return jsonRes as RiderData;
}
