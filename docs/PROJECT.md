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

## Shared classifications

`app/race/WeekendClassification.tsx` is the detail-page entry for MotoGP-family,
F1, BSB and WorldSBK. `app/_components/Classification/` supplies competitor cards,
portraits and styles; `utils/classification.ts` normalises API payloads, statuses,
historical guards and document/session scope. The native repo has an identical
pure adapter: keep both copies aligned. Historical reads never fall back to current
standings. Current championship tables reuse the portrait component and team colours.

## MotoGP competition standings

Championship selection and WeekendClassification expose rider, team and constructor
championships for MotoGP/Moto2/Moto3. Choice values add a third competition segment,
e.g. motogp:motogp:teams; these are views of a class, not new subscriptions. Both
ClassStandings and the shared adapter send competition to /standings and validate
its scope. Official stored year/class/round XML totals are authoritative; never
sum rider points to construct another championship. Team/manufacturer tables hide
the redundant secondary Team column and retain source/as-of metadata.

## Saved home championship

Onboarding/settings save `favouriteChampionship` in shared account preferences.
`utils/championships.ts` maps supported `series:class[:competition]` values to
explicit labels, API scope and the subscribed class (both F1 competitions use
the `f1` subscription). Missing legacy preferences retain MotoGP only while that
class is followed; explicit null means no favourite. A saved class that is later
unfollowed remains labelled with a settings prompt and does not fetch another
championship. `showMotoGPChampionship` is retained as the compatible visibility
flag for the favourite card. It is no longer a MotoGP-only control.

Home standings requests validate year, class and competition and cancel obsolete
requests. Provider failures remain unavailable or display the last verified
import's freshness notice. Choosing a favourite does not add subscriptions.

## Categories in onboarding and settings

Both screens use `SeriesCategorySelection` and `utils/seriesCategories.ts`:
Bikes contains MotoGP, WorldSBK, BSB, Speedway, IoMTT, Rookies and MotoAmerica;
Cars contains F1, GT World Challenge Europe, NLS and optional FIA WEC. Expand/collapse only changes
presentation. Follow all/Unfollow all explicitly changes the known classes in that
category; none/some/all states and class counts reflect partial selections.
Series headings and individual class cards remain inside each category. Both
Bikes and Cars start collapsed, including when they contain saved follows, so the
two groups and their follow counts are visible before browsing the full lists.

Selections remain drafts until the screen's existing save action succeeds.
Category changes preserve the other category, unrecognised stored preferences,
class exclusions and the saved favourite. New series still require their own
opt-in defaults/migration; categories do not automatically follow future entries.

## FIA WEC calendar

FIA WEC is an optional Cars championship with one `wec` calendar selection.
The official timetable includes endurance races and Prologue tests; published
unknown or contradictory starts remain Time TBC. Existing selections and guest
defaults do not automatically follow WEC. Both onboarding and settings expose its
calendar-only scope; it is not offered as a standings or home favourite choice.
Admin has one shared-year `/admin/scrape/wec` action and `scrape:wec` polling status.
Round pages retain numeric IDs and official source links, with an explicit notice
that results and championship standings are not available yet.

## BMW F 900 R Cup

Optional BSB class `bsb-bmw` offers official phase grids/results and exact-round
main championship totals. It appears in Bikes/BSB selection, calendar
filters, current standings and home favourites as `bsb:bsb-bmw`. Guest defaults
leave it off; existing account opt-in is maintained by the API preference
migration. Choosing a favourite does not enable its subscription.

Weekend phase names are supplied by the API: Heat 1, Heat 2, optional LCQ,
Sprint and Main. Explicit document session scope takes precedence over legacy
numbered-report labels. Published blank ranks remain unknown and fractional
championship totals are displayed unchanged. Race-awarded points remain unknown.
The shared-year BSB timing import includes BMW; no additional import action is
needed. Existing BSB calendar sessions remain generic, with no claim of a
class-specific BMW timetable.
