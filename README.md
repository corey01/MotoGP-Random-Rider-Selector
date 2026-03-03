Simple sweepstake web app to randomly assign MotoGP riders to entrants.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

### Environment
Set the RaceCal backend URL in `.env`:

```bash
NEXT_PUBLIC_RACECAL_URL=http://localhost:3001
NEXT_PUBLIC_MOTOGP_SEASON_YEAR=2026
```

### Data Source
The frontend now fetches riders and calendar data directly from the RaceCal API (`/riders`, `/calendar-events`) and does not use embedded season JSON fallbacks.
