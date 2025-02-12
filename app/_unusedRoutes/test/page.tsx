// 'use client';

// import { useEffect } from "react";



// const BASE_URL = 'https://api.motogp.pulselive.com/motogp/v1/';
// const BASE_CORS_URL = 'https://cloudflare-cors-anywhere.corey-obeirne.workers.dev/?uri=' + BASE_URL
// const SEASONS = 'results/seasons';

// const url = (urlToUse: string) => {
//     return BASE_CORS_URL + encodeURIComponent(urlToUse)
// }

// const api = () => ({
//     getSeasons: async () => {
//         // const res = await fetch(url(SEASONS));
//         const res = await fetch(`https://dry-term-c997.corey-obeirne.workers.dev/corsproxy/?apiurl=https://api.motogp.pulselive.com/motogp/v1/results/seasons`, {

//         });
//         // const res = await fetch("https://dry-term-c997.corey-obeirne.workers.dev/corsproxy/?apiurl=https://api.worldbank.org/v2/indicator/EG.USE.PCAP.KG.OE?format=json");
//         const json = await res.json();
//         return json;
//     },
//     getCurrentSeason: async () => {
//         const allSeasons = await api().getSeasons();
//         const current = (allSeasons as unknown as []).find((season) => season.current);
//         return current;
//     }
// })

// const TestPage = () => {

//     const getData = async () => {
//         const seasons = await api().getSeasons();
//         console.log(seasons);
//     }
    
//     useEffect(() => {
//         getData();
//         // const currentSeason = api().getCurrentSeason();
//         // console.log(currentSeason)
//     }, []);

//     return (
//     <h1>Hello</h1>
//     )
// }

// export default TestPage;