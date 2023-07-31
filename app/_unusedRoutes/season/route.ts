// import { NextResponse } from "next/server";
// // import seasonData from "../../utils/seasonData.json";
// import seasonData from "../../../utils/allSeasonData.json";

// export async function GET() {
//   console.log("get season");
//   const tempSeasonData = seasonData
//     .filter((a) => a.kind === "GP")
//     .map((season) => {
//       const {
//         name,
//         status,
//         date_start,
//         date_end,
//         country,
//         url,
//         circuit: {
//           name: circuitName,
//           country: circuitCountry,
//           city,
//           track: {
//             lenght_units: { miles, kiloMeters: kilometers },
//             assets: {
//               simple: { path: simpleCircuitPath },
//               info: { path: fullCircuitPath },
//             },
//           },
//         },
//       } = season;

//       const formattedCurrentSeason = {
//         name,
//         country,
//         url,
//         status,
//         date_start,
//         date_end,
//         circuit: {
//           circuitName,
//           circuitCountry,
//           city,
//           length: {
//             miles,
//             kilometers,
//           },
//           simpleCircuitPath,
//           fullCircuitPath,
//         },
//       };

//       return formattedCurrentSeason;
//     });

//   return NextResponse.json(tempSeasonData);
// }
