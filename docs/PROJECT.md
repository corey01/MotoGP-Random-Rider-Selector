# Web project structure

This is `corey01/MotoGP-Random-Rider-Selector`, the Next.js 15 web client at
https://racecal.uk. It consumes `corey01/racecal-api`, configured by
`NEXT_PUBLIC_RACECAL_URL`. The similarly named native repo is a separate app.

## Source map

- `app/layout.tsx` and `app/_components/Providers.tsx`: shared shell/providers.
- `app/page.tsx`, `app/_components/Dashboard/`: dashboard cards and weekend feed.
- `app/calendar/`, `app/_components/Calendar/`: FullCalendar grid, filters and panels.
- `app/round/`: round URL entry; `app/race/`: detailed weekend, classifications and
  historical championship standings. Keep the numeric API round ID throughout.
- `app/standings/`: championship/season controls and rider standings table.
- `app/onboarding/` and `app/settings/`: persistent subscription/preferences UI.
- `consts/series.ts`: series/classes, display labels, colours, defaults and shared
  onboarding/settings card metadata. A new class must be registered here.
- `utils/subscriptions.ts`, `utils/preferences.ts`, `utils/SubscriptionsContext.tsx`:
  persistent preferences versus temporary calendar filters.
- `utils/getCalendarData.ts`, `getDashboardData.ts`, `getGridData.ts`,
  `getRaceResults.ts`, `getStandings.ts`: API access and client-side data shapes.
- `app/_components/AuthProvider.tsx`, `utils/auth.ts`: shared account/session flow.
- `app/admin/`: force-sync controls and latest job/error status.
- `app/groups/`, `app/sweepstake/`: groups and rider assignment features.
- `app/design-system/tokens.css`, `app/globals.css`, component SCSS modules:
  typography, palette, shared resets and scoped styles.
- `next.config.js`: static export with unoptimised images. There is no persistent
  Next.js server doing provider scrapes in production.

## Presentation and contracts

Match the dashboard's dark surfaces, coral accents, typography and responsive
controls. Reserve portrait space and supply initials for unavailable images so
rider names, flags, teams and points remain aligned. Global CSS resets can affect
nested tables; inspect computed layout when a table is misaligned.

Cancelled races remain visible. Unconfirmed times show Time TBC without invented
end times or countdowns. Race pages use standings from that weekend/class, never
a current-table fallback. Abort obsolete requests when users switch classes.

Adding a series affects both account selection screens, calendar filters, labels,
Admin jobs and the API contract. Some providers currently offer standings only:
do not imply that selecting one creates schedule/results coverage.

## Related repos and current state

- [API structure](https://github.com/corey01/racecal-api/blob/main/docs/PROJECT.md)
- [Shared roadmap](https://github.com/corey01/racecal-api/blob/main/docs/ROADMAP.md)
- [Handoff](https://github.com/corey01/racecal-api/blob/main/docs/HANDOFF.md)
- Native client: https://github.com/corey01/racecal-app

Build with `npm run build`; inspect deployment in the repo's GitHub Actions.
