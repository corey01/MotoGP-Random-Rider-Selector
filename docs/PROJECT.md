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

## FIA WEC calendar and race reports

FIA WEC is an optional Cars championship with one existing `wec` selection.
The timetable keeps numeric round/session IDs, endurance durations, Prologue tests
and unknown/contradictory starts as Time TBC. No preference migration or new
favourite is introduced; the 30 existing championship choices remain unchanged.

Race pages load exact round/year/series `wec` classifications with Results and
Grid views only. Overall car order, original printed entry numbers (including
`007` versus `7`), team/machine/category and all supplied race crew members remain
separate. The official grid lists only its printed driver, labelled Listed driver;
it never borrows a full crew from the race. Crew placeholders reflect the number
of supplied names, and individual portraits/roles, class ranks and race awards
are not invented. Document kind/session controls each official report link.

The Prologue's TEST-only timetable skips race-classification requests and shows
explicit test-event scope. Future/unpublished race reports remain unavailable;
partial imports retain source warnings and any verified sibling report.
Final race-report caveats stay visible as source notes without falsely marking the
race classification provisional. A provisional starting-grid label belongs only
to the Grid view, as in the 2026 Circuit of the Americas source. Championship standings and home favourites remain
unsupported for WEC. Admin has
separate shared-year `/admin/scrape/wec` and `/admin/sync/wec-timing` actions,
with calendar and timing polling status. Calendar session IDs and Le Mans' 12
unconfirmed times are unchanged.

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

## British Sidecar crews

`bsb-sidecar` is an explicit opt-in class under Bikes/BSB. Its favourite is
`bsb:bsb-sidecar`, selecting the overall crew championship. New defaults leave
it disabled and the shared category controls preserve existing choices.

Both published crew names render separately, without individual portraits or
inferred driver/passenger roles. GP/CUP/F2 and class position remain distinct
from the overall rank. Standalone grids retain the sparse printed slot numbers
and are labelled Grid slots. Race-awarded points stay unknown.

Race and grid reports cover four BSB meetings. Overall championship totals are
the published cumulative totals, including other meetings. Separate class tables
and the FIM championship are excluded. Source-date warnings are shown in weekend
standings, the current table and the favourite card; refresh errors remain separate.
Historical reads stay scoped to the requested year/class/round with no current
standings fallback. The existing whole-year BSB Admin import includes Sidecars;
shared calendar sessions do not claim a Sidecar-specific timetable.


## Admin job details

`app/admin/JobTable.tsx` renders both latest status and recent runs. Every stored
error is available in an expandable Error details section, including recent rows
without a dedicated Error column. Long source messages wrap and remain copyable.
MotoGP standings jobs expose supplied per-round/class outcomes, team/constructor
row counts, rider-refresh counts/errors and awaiting-publication states. Numeric
API IDs are labelled Round ID unless the source supplies a separate round number.
WEC joins the existing timing jobs with expandable snapshot/report counts.

This is presentation of the recorded import result. It does not retry a job,
change provider availability or treat unpublished reports as successful imports.
