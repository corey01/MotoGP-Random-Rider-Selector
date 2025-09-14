// app/grid/page.tsx
import "server-only";

/* ---------------------------- tiny fetch helpers --------------------------- */
type Json = any;
const BASE = "https://api.motogp.pulselive.com/motogp/v1";
const j = (r: Response) => r.json() as Promise<Json>;
const noStore = { cache: "no-store" as const };

// simple in-memory cache with TTL to slash requests
const cache = new Map<string, { expires: number; data: any }>();
const TTL_MS = 2 * 60 * 1000; // 2 minutes

function getCache(k: string) {
  const it = cache.get(k);
  return it && it.expires > Date.now() ? it.data : null;
}
function setCache(k: string, data: any) {
  cache.set(k, { data, expires: Date.now() + TTL_MS });
}

const HEADERS: HeadersInit = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-GB,en;q=0.9",
  Origin: "https://www.motogp.com",
  Referer: "https://www.motogp.com/",
  Connection: "keep-alive",
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url: string, tries = 4): Promise<any> {
  const cached = getCache(url);
  if (cached) return cached;

  for (let attempt = 1; attempt <= tries; attempt++) {
    const res = await fetch(url, { cache: "no-store", headers: HEADERS });
    const ct = res.headers.get("content-type") || "";

    if (ct.includes("application/json")) {
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          `HTTP ${res.status} ${res.statusText} — ${JSON.stringify(data)}`
        );
      setCache(url, data);
      return data;
    }

    const text = await res.text();
    if (/waf block detected/i.test(text)) {
      if (attempt === tries)
        throw new Error("WAF block detected (after retries).");
      // jittered exponential backoff in SECONDS
      const delay = Math.floor((800 + Math.random() * 700) * attempt); // ~0.8–1.5s * attempt
      await wait(delay);
      continue;
    }

    throw new Error(
      `Unexpected response (${ct || "no content-type"}): ${text.slice(0, 180)}`
    );
  }
  throw new Error("Exhausted retries");
}

/* ------------------------- resolve today's event ids ------------------------ */
function labelForEvent(ev: any): string {
  if (!ev) return "Unknown Event";
  return (
    ev.full_name ||
    ev.name ||
    ev.event_name ||
    ev.grand_prix_name ||
    ev.grand_prix ||
    ev.title ||
    (ev.country ? `${ev.country} Grand Prix` : null) ||
    `Event ${ev.id || ""}`
  );
}

async function resolveEventAndCategory() {
  const now = new Date();

  // Season (prefer current flag; fallback to year)
  const seasons = await fetchJson(`${BASE}/results/seasons`);
  const season =
    seasons.find((s: any) => s.current) ??
    seasons.find((s: any) => s.year === now.getFullYear());
  if (!season) throw new Error("No season found");
  const seasonUuid: string = season.id;

  // Broadcast events (used if date filtering works)
  const broadcasts: any[] = await fetchJson(
    `${BASE}/events?seasonYear=${now.getFullYear()}`
  );
  const todaysBroadcast = broadcasts.find((e: any) => {
    const ds = e.date_start ? new Date(e.date_start) : null;
    const de = e.date_end ? new Date(e.date_end) : null;
    return e.kind === "GRAND_PRIX" && ds && de && ds <= now && now <= de;
  });

  // Results events (unfinished == today/upcoming)
  const resultsEvents: any[] = await fetchJson(
    `${BASE}/results/events?seasonUuid=${seasonUuid}&isFinished=false`
  );

  // Try to map broadcast -> results via toad_api_uuid
  let resultsEvent = todaysBroadcast
    ? resultsEvents.find((ev: any) => ev.toad_api_uuid === todaysBroadcast.id)
    : undefined;

  // Fallback: choose the upcoming event with the earliest session
  if (!resultsEvent) {
    // Find event-level MotoGP category to look up sessions
    const seasonCats: any[] = await fetch(
      `${BASE}/results/categories?seasonUuid=${seasonUuid}`,
      noStore
    ).then(j);
    const motoGpSeasonCat = seasonCats.find((c: any) =>
      String(c.name).includes("MotoGP")
    )?.id;
    if (!motoGpSeasonCat) throw new Error("MotoGP category (season) not found");

    let best: any = null;
    let bestTs = Number.POSITIVE_INFINITY;

    for (const ev of resultsEvents) {
      try {
        const sessions: any[] = await fetch(
          `${BASE}/results/sessions?eventUuid=${ev.id}&categoryUuid=${motoGpSeasonCat}`,
          noStore
        ).then(j);
        const first = sessions
          .map((s) => (s.date ? Date.parse(s.date) : Number.POSITIVE_INFINITY))
          .reduce((m, v) => Math.min(m, v), Number.POSITIVE_INFINITY);
        if (first < bestTs) {
          bestTs = first;
          best = ev;
        }
      } catch {
        /* ignore */
      }
    }
    resultsEvent = best ?? resultsEvents[0];
  }

  if (!resultsEvent) throw new Error("Unable to locate a results event");

  // Event-level categories (need the MotoGP category UUID for THIS event)
  const eventCats: any[] = await fetch(
    `${BASE}/results/categories?eventUuid=${resultsEvent.id}`,
    noStore
  ).then(j);
  const eventMotoGpCat: string | undefined = eventCats.find((c: any) =>
    String(c.name).includes("MotoGP")
  )?.id;

  if (!eventMotoGpCat) throw new Error("MotoGP category (event) not found");

  const eventLabel = labelForEvent(todaysBroadcast) || labelForEvent(resultsEvent);

  return {
    resultsEventId: resultsEvent.id as string,
    eventMotoGpCat,
    eventLabel,
  };
}

/* ------------------------- grid (official + fallback) ---------------------- */
async function fetchOfficialGrid(eventId: string, categoryId: string) {
  try {
    const grid = await fetchJson(
      `${BASE}/results/event/${eventId}/category/${categoryId}/grid`
    );
    return Array.isArray(grid) ? grid : [];
  } catch {
    return [];
  }
}

async function fetchSessions(eventId: string, categoryId: string) {
  const sessions: any[] = await fetchJson(
    `${BASE}/results/sessions?eventUuid=${eventId}&categoryUuid=${categoryId}`
  );
  return sessions ?? [];
}

async function fetchClassification(sessionId: string) {
  const res = await fetchJson(
    `${BASE}/results/session/${sessionId}/classification`
  );
  return res?.classification ?? [];
}

async function deriveGridFromQualifying(eventId: string, categoryId: string) {
  const sessions: any[] =
    (await fetchJson(
      `${BASE}/results/sessions?eventUuid=${eventId}&categoryUuid=${categoryId}`
    )) ?? [];

  // Pull every classification we can; tolerate failures
  const sessionWithClass = await Promise.all(
    sessions.map(async (s) => {
      try {
        const cls = await fetchJson(
          `${BASE}/results/session/${s.id}/classification`
        );
        return { session: s, classification: cls?.classification ?? [] };
      } catch {
        return { session: s, classification: [] };
      }
    })
  );

  // Helpers to recognize Q1/Q2/Qualifying across naming styles
  const U = (v: any) => String(v ?? "").toUpperCase();
  const looksLikeQ1 = (s: any) => {
    const n = U(s.name);
    const t = U(
      s.type || s.session_type || s.phase || s.code || s.session_shortname
    );
    return (
      /(^|[^A-Z0-9])Q1([^A-Z0-9]|$)/.test(n + t) ||
      n.includes("QUALIFYING 1") ||
      t.includes("QUALIFYING 1") ||
      (s.number === 1 && (n.includes("QUALIFY") || t.includes("QUALIFY")))
    );
  };
  const looksLikeQ2 = (s: any) => {
    const n = U(s.name);
    const t = U(
      s.type || s.session_type || s.phase || s.code || s.session_shortname
    );
    return (
      /(^|[^A-Z0-9])Q2([^A-Z0-9]|$)/.test(n + t) ||
      n.includes("QUALIFYING 2") ||
      t.includes("QUALIFYING 2") ||
      (s.number === 2 && (n.includes("QUALIFY") || t.includes("QUALIFY")))
    );
  };
  const looksLikeQualifying = (s: any) => {
    const n = U(s.name);
    const t = U(
      s.type || s.session_type || s.phase || s.code || s.session_shortname
    );
    return n.includes("QUALIFY") || t.includes("QUALIFY");
  };

  const q2 = sessionWithClass.find(({ session }) => looksLikeQ2(session));
  const q1 = sessionWithClass.find(({ session }) => looksLikeQ1(session));

  const idOf = (c: any) =>
    c?.rider?.id || c?.rider?.riders_api_uuid || c?.rider?.legacy_id;

  // Case A: Q2 + (optional) Q1: build standard grid
  if (q2?.classification?.length) {
    const q2Ids = new Set(q2.classification.map(idOf).filter(Boolean));

    const fromQ2 = q2.classification.map((c: any, i: number) => ({
      position: i + 1,
      time: c.best_lap?.time ?? c.time ?? null,
      rider: c.rider,
      team: c.team,
      source: "Q2",
    }));

    const fromQ1 = (q1?.classification ?? [])
      .filter((c: any) => !q2Ids.has(idOf(c)))
      .map((c: any, i: number) => ({
        position: fromQ2.length + i + 1,
        time: c.best_lap?.time ?? c.time ?? null,
        rider: c.rider,
        team: c.team,
        source: "Q1",
      }));

    return [...fromQ2, ...fromQ1];
  }

  // Case B: No explicit Q2 — use the most recent "Qualifying" classification available
  const qualis = sessionWithClass
    .filter(({ session }) => looksLikeQualifying(session))
    .filter(
      ({ classification }) =>
        Array.isArray(classification) && classification.length > 0
    )
    // sort by session date ascending, pick the last one
    .sort(
      (a, b) =>
        Date.parse(a.session.date ?? 0) - Date.parse(b.session.date ?? 0)
    );

  if (qualis.length) {
    const best = qualis[qualis.length - 1];
    return best.classification.map((c: any, i: number) => ({
      position: i + 1,
      time: c.best_lap?.time ?? c.time ?? null,
      rider: c.rider,
      team: c.team,
      source: `QUAL(${
        best.session.session_shortname ?? best.session.name ?? "unknown"
      })`,
    }));
  }

  // Case C (last resort): Build from entry list ordered by the rider’s best qualifying time seen all weekend
  const entry = await fetchJson(
    `${BASE}/results/event/${eventId}/entry?categoryUuid=${categoryId}`
  );

  if (Array.isArray(entry) && entry.length) {
    // Gather any classification where the session name/type indicates Qualifying,
    // then find each rider’s best (lowest) time.
    const qualiClass = sessionWithClass
      .filter(({ session }) => looksLikeQualifying(session))
      .flatMap(({ classification }) => classification);

    const bestTimeMap = new Map<string, number>();
    for (const c of qualiClass) {
      const rid = idOf(c);
      const t =
        c.best_lap?.millis ?? c.best_lap?.ms ?? c.millis ?? c.ms ?? null;
      if (!rid || t == null) continue;
      const prev = bestTimeMap.get(rid);
      if (prev == null || t < prev) bestTimeMap.set(rid, t);
    }

    const withTimes = entry.map((e: any) => ({
      rider: e.rider,
      team: e.team,
      timeMs: bestTimeMap.get(idOf(e)) ?? Number.POSITIVE_INFINITY,
    }));

    withTimes.sort((a, b) => a.timeMs - b.timeMs);

    return withTimes.map((x, i) => ({
      position: i + 1,
      time_ms: isFinite(x.timeMs) ? x.timeMs : null,
      rider: x.rider,
      team: x.team,
      source: "ENTRY+BEST_QUALI_TIME",
    }));
  }

  // If literally nothing matched, return [] so the UI message shows.
  return [];
}

async function getGrid(eventId: string, categoryId: string) {
  const official = await fetchOfficialGrid(eventId, categoryId);
  if (official.length) return { grid: official, source: "official" as const };
  const derived = await deriveGridFromQualifying(eventId, categoryId);
  return { grid: derived, source: "derived" as const };
}

/* --------------------------------- page ----------------------------------- */
export default async function GridPage() {
  try {
    const { resultsEventId, eventMotoGpCat, eventLabel } = await resolveEventAndCategory();
    const { grid, source } = await getGrid(resultsEventId, eventMotoGpCat);

    if (!grid.length) {
      const [sessions, entry] = await Promise.all([
        fetchJson(
          `${BASE}/results/sessions?eventUuid=${resultsEventId}&categoryUuid=${eventMotoGpCat}`
        ),
        fetchJson(
          `${BASE}/results/event/${resultsEventId}/entry?categoryUuid=${eventMotoGpCat}`
        ),
      ]);

      return (
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {`No grid data available (official & derived both empty).

Event: ${resultsEventId}
Event Name: ${eventLabel}
Category: ${eventMotoGpCat}

Sessions (names/types):
${JSON.stringify(
  (sessions ?? []).map((s: any) => ({
    id: s.id,
    name: s.name,
    short: s.session_shortname,
    type: s.type,
    code: s.code,
    phase: s.phase,
    number: s.number,
    date: s.date,
  })),
  null,
  2
)}

Entry list length: ${(entry ?? []).length}
`}
        </pre>
      );
    }

    return (
      <div style={{ fontFamily: "system-ui, sans-serif", padding: 16 }}>
        <h2 style={{ margin: 0, marginBottom: 4 }}>{eventLabel}</h2>
        <p style={{ marginTop: 0, marginBottom: 12, opacity: 0.8 }}>
          Grid source: <strong>{source}</strong>
        </p>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>
          {JSON.stringify(grid, null, 2)}
        </pre>
      </div>
    );
  } catch (e: any) {
    return (
      <pre style={{ whiteSpace: "pre-wrap", color: "crimson" }}>
        {`Error: ${e?.message ?? String(e)}`}
      </pre>
    );
  }
}
