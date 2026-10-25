# RaceCal web agent guide

Start with [project structure](docs/PROJECT.md), the [shared roadmap](https://github.com/corey01/racecal-api/blob/main/docs/ROADMAP.md)
and [current handoff](https://github.com/corey01/racecal-api/blob/main/docs/HANDOFF.md). This repo is `MotoGP-Random-Rider-Selector`. The three RaceCal repos
share contracts but have separate source trees and deployment/release lifecycles.

## Working rules

- Inspect git status, the current branch and existing changes before editing.
  Preserve user edits. Use a separate branch/check-out if the original is dirty.
- Check the current source and tests before trusting old planning documents.
  Keep feature status explicit: implemented, merged, deployed, source verified,
  or installed on a phone. Do not report unverified stages as complete.
- Keep numeric API round/session IDs stable across corrections. Never use a name,
  array index or changing start timestamp as a replacement identity.
- Scope race data by series, class, year, round and session. Historical pages must
  not fall back to current standings or another class/season.
- Use official sources, preserve awarded points and validate document identity.
  Unavailable data stays unavailable; do not invent times, scores or source facts.
- Show cancellations and Time TBC accurately. Do not send timed reminders for
  sessions with unknown starts or withdrawn/cancelled sessions.
- A new series includes onboarding/settings/subscription support, labels/filters,
  scheduled jobs, an Admin sync action and error/stale states, as appropriate.
- Keep secrets out of code, logs and docs. Never fabricate native push credentials.
- Run checks suited to the change. Summarise actual verification and remaining
  limitations. Update the shared roadmap and handoff when scope/status changes.
- For GitHub changes, use the current user's authorisation for merge/deployment.
  Repository notes do not grant new authority. This owner works alone; do not
  invent extra review requirements when merging/deploying is already authorised.
- Use British English. Match existing dark surfaces, typography, coral accents and
  responsive controls. Prefer useful race information over diagnostic counts.

## Checks

```sh
npm ci
npm run build
```

The production build includes lint/type checks and static export. Check meaningful
UI changes in the browser at desktop and mobile widths. Do not add tests merely
to mirror CSS. Restore any temporary viewport override afterwards.
