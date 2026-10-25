## Agent and project documentation

Start with [AGENTS.md](AGENTS.md) and [project structure](docs/PROJECT.md).
The shared [roadmap](https://github.com/corey01/racecal-api/blob/main/docs/ROADMAP.md)
and [handoff](https://github.com/corey01/racecal-api/blob/main/docs/HANDOFF.md)
track goals, coverage, blockers and current work across all three repositories.

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
