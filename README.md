Simple sweepstake web app to randomly assign a random MotoGP rider to one of us.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

### MotoGP Api Data

Where to get season data:

https://api.motogp.pulselive.com/motogp/v1/events?seasonYear=2023

process this using the get() route in /season/route.ts, this will format the data to be processed by getSeasonDataLocal.ts on the client side.

For Rider Data

https://api.motogp.pulselive.com/motogp/v1/riders



API Guide:

https://github.com/robschmitt/MotoGP-API