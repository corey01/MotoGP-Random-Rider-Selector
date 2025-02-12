// import { NextResponse } from "next/server";
// // import seasonData from "../../utils/seasonData.json";
// import seasonData from "../../utils/allSeasonData.json";

// export async function GET() {
//   console.log("get season");
//   try {
    

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
//           },
//         },
//         broadcasts,
//       } = season;

//       const simpleCircuitPath = season.circuit?.track.assets?.simple?.path 
//       const fullCircuitPath = season.circuit?.track.assets?.simple?.path 

//       const formattedBroadcasts = broadcasts
//         .filter((broadcast) => broadcast.type !== "MEDIA")
//         .map((broadcast) => ({
//           eventName: broadcast.category.name,
//           name: broadcast.name,
//           date_start: broadcast.date_start,
//           date_end: broadcast.date_end,
//           type: broadcast.type,
//           kind: broadcast.kind,
//           status: broadcast.status,
//         }));

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
//         broadcasts: formattedBroadcasts,
//       };

//       return formattedCurrentSeason;
//     });
//     return NextResponse.json(tempSeasonData);
// } catch (error) {
//         console.log(error);
// }

 
// }

// // // "id": "882eec21-dfa9-41c7-843e-62340cb2c176",
// // //         "shortname": "P1",
// // //         "name": "Practice Nr. 1",
// // //         "date_start": "2023-09-08T10:45:00+0200",
// // //         "date_end": "2023-09-08T11:30:00+0200",
// // //         "remain": 3327082,
// // //         "type": "SESSION",
// // //         "kind": "PRACTICE",
// // //         "status": "NOT-STARTED",
// // //         "progressive": 1,
// // //         "has_timing": true,
// // //         "has_live": true,
// // //         "has_report": true,
// // //         "has_results": true,
// // //         "has_on_demand": true,
// // //         "is_live": false,
// // //         "is_live_timing": false,
// // //         "live": false,
// // //         "category": {
// // //           "id": "93888447-8746-4161-882c-e08a1d48447e",
// // //           "acronym": "MGP",
// // //           "name": "MotoGP",
// // //           "active": true,
// // //           "timing_id": 3,
// // //           "priority": 1
// // //         },
// // //         "gp_day": 1,
// // //         "timing_id": 1
