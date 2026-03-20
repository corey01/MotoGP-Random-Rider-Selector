"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { fetchCalendarEvents, type ApiCalendarEvent } from "@/utils/getCalendarData";
import { RaceGrid } from "@/app/_components/Grid/RaceGrid";
import { RaceResults } from "@/app/_components/Results/RaceResults";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SESSION_ORDER: Record<string, number> = {
  PRACTICE: 0,
  QUALIFYING: 1,
  RACE: 2,
};

const SUBSERIES_LABEL: Record<string, string> = {
  motogp: "MotoGP",
  moto2: "Moto2",
  moto3: "Moto3",
};

const RACING_TYPES = new Set(["PRACTICE", "QUALIFYING", "RACE"]);

const TYPE_COLOR: Record<string, string> = {
  PRACTICE:   "#4a9eff",
  QUALIFYING: "#f5c842",
  RACE:       "#ff6b35",
};

function cleanSessionName(ev: ApiCalendarEvent): string {
  let name = ev.sessionName || ev.type || "";
  name = name.replace(/\s*\(Restart\)/gi, "").trim();
  name = name.replace(/Free Practice Nr\.\s*(\d)/i, "FP$1");
  name = name.replace(/Qualifying Nr\.\s*(\d)/i, "Q$1");
  return name;
}

function sessionAbbrev(ev: ApiCalendarEvent): string {
  const name = cleanSessionName(ev).toLowerCase();
  if (/grand prix/i.test(name)) return "GP";
  if (/sprint/i.test(name)) return "SPR";
  if (/fp(\d)/.test(name)) return name.match(/fp\d/i)![0].toUpperCase();
  if (/^q(\d)/.test(name)) return name.match(/^q\d/i)![0].toUpperCase();
  if (/warm.?up/i.test(name)) return "WU";
  if (/practice/i.test(name)) return "P";
  return ev.type?.slice(0, 2) ?? "?";
}

function formatDayHeader(iso: string): string {
  try { return format(new Date(iso), "EEEE d MMMM"); } catch { return iso; }
}

function formatTime(iso: string): string {
  try { return format(new Date(iso), "HH:mm 'UTC'"); } catch { return iso; }
}

// ─── Inner page (needs Suspense because of useSearchParams) ───────────────────

function RacePage() {
  const searchParams = useSearchParams();
  const roundIdParam = searchParams.get("roundId");
  const roundId = roundIdParam ? parseInt(roundIdParam, 10) : null;

  const [events, setEvents] = useState<ApiCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!roundId) { setNotFound(true); setLoading(false); return; }

    let alive = true;
    const year = Number(process.env.NEXT_PUBLIC_MOTOGP_SEASON_YEAR || new Date().getFullYear());

    fetchCalendarEvents({ year, series: ["motogp"] })
      .then((all) => {
        if (!alive) return;
        const forRound = all.filter((e) => e.round?.id === roundId);
        if (forRound.length === 0) setNotFound(true);
        else setEvents(forRound);
        setLoading(false);
      })
      .catch(() => { if (alive) { setNotFound(true); setLoading(false); } });

    return () => { alive = false; };
  }, [roundId]);

  if (loading) {
    return <div style={pageStyle}><p>Loading…</p></div>;
  }

  if (notFound || !roundId) {
    return (
      <div style={pageStyle}>
        <p>Round not found.</p>
        <Link href="/">← Back to calendar</Link>
      </div>
    );
  }

  const first = events[0];
  const round = first.round;

  // Group sessions by subSeries, sorted by session type then start time
  const bySubSeries = new Map<string, ApiCalendarEvent[]>();
  for (const ev of events) {
    const key = ev.subSeries || ev.series || "motogp";
    if (!bySubSeries.has(key)) bySubSeries.set(key, []);
    bySubSeries.get(key)!.push(ev);
  }

  const subSeriesOrder = ["motogp", "moto2", "moto3"];
  const sortedSubSeries = Array.from(bySubSeries.keys()).sort(
    (a, b) => subSeriesOrder.indexOf(a) - subSeriesOrder.indexOf(b)
  );

  for (const sessions of Array.from(bySubSeries.values())) {
    sessions.sort((a, b) => {
      const typeOrder = (SESSION_ORDER[a.type] ?? 9) - (SESSION_ORDER[b.type] ?? 9);
      if (typeOrder !== 0) return typeOrder;
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    });
  }

  return (
    <div style={pageStyle}>
      <Link href="/" style={backLinkStyle}>← Back to calendar</Link>

      {/* Round header */}
      <div style={headerStyle}>
        <h1 style={{ margin: "0 0 4px", fontFamily: "var(--font-motogp-font)" }}>{round?.name || "Grand Prix"}</h1>
        <p style={{ margin: 0, opacity: 0.7 }}>
          {[round?.circuit, round?.country].filter(Boolean).join(" · ")}
          {first.start && ` · ${format(new Date(first.start), "do MMMM yyyy")}`}
        </p>
      </div>

      {/* Race results */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Results</h2>
        <RaceResults roundId={roundId} />
      </section>

      {/* Starting grid */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Starting Grid</h2>
        <RaceGrid roundId={roundId} />
      </section>

      {/* Session schedule */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Session Schedule</h2>
        {sortedSubSeries.map((sub) => {
          const allSessions = bySubSeries.get(sub)!;
          const sessions = allSessions.filter((ev) => RACING_TYPES.has(ev.type?.toUpperCase() ?? ""));
          if (sessions.length === 0) return null;

          // Group by day
          const byDay = new Map<string, ApiCalendarEvent[]>();
          for (const ev of sessions) {
            const day = formatDayHeader(ev.start);
            if (!byDay.has(day)) byDay.set(day, []);
            byDay.get(day)!.push(ev);
          }

          const label = SUBSERIES_LABEL[sub] ?? sub.toUpperCase();
          return (
            <div key={sub} style={subSeriesBlockStyle}>
              <h3 style={subSeriesTitleStyle}>{label}</h3>
              {Array.from(byDay.entries()).map(([day, daySessions]) => (
                <div key={day} style={{ marginBottom: 12 }}>
                  <div style={dayHeaderStyle}>{day}</div>
                  {daySessions.map((ev) => {
                    const color = TYPE_COLOR[ev.type?.toUpperCase() ?? ""] ?? "#666";
                    const isLive = ev.status === "LIVE";
                    const isDone = ev.status === "COMPLETED";
                    return (
                      <div key={ev.id} style={sessionRowStyle}>
                        <div style={{ width: 36, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{
                            fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.03em",
                            color, background: `${color}22`, borderRadius: 4,
                            padding: "2px 5px", textTransform: "uppercase",
                          }}>
                            {sessionAbbrev(ev)}
                          </span>
                        </div>
                        <div style={{ flex: 1, fontWeight: 600, fontSize: "0.88rem", minWidth: 0 }}>
                          {cleanSessionName(ev)}
                        </div>
                        <div style={{ fontSize: "0.8rem", opacity: 0.55, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                          {formatTime(ev.start)}
                        </div>
                        {isLive && (
                          <span style={{ fontSize: "0.7rem", color: "#ff4444", fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>● LIVE</span>
                        )}
                        {isDone && (
                          <span style={{ fontSize: "0.8rem", opacity: 0.35, flexShrink: 0, marginLeft: 8 }}>✓</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          );
        })}
      </section>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  maxWidth: 900,
  margin: "0 auto",
  padding: "16px 16px 64px",
  fontFamily: "system-ui, sans-serif",
};

const backLinkStyle: React.CSSProperties = {
  display: "inline-block",
  marginBottom: 20,
  opacity: 0.7,
  fontSize: 14,
};

const headerStyle: React.CSSProperties = {
  marginBottom: 32,
};

const sectionStyle: React.CSSProperties = {
  marginBottom: 40,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 16px",
  fontSize: "1.1rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  opacity: 0.6,
};

const subSeriesBlockStyle: React.CSSProperties = {
  marginBottom: 24,
};

const subSeriesTitleStyle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: "1rem",
  fontWeight: 700,
};

const dayHeaderStyle: React.CSSProperties = {
  fontSize: "0.7rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  opacity: 0.35,
  marginBottom: 4,
  paddingLeft: 4,
};

const sessionRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "7px 4px",
  borderBottom: "1px solid rgba(128,128,128,0.1)",
};

// ─── Export ───────────────────────────────────────────────────────────────────

export default function RaceInfoPage() {
  return (
    <Suspense>
      <RacePage />
    </Suspense>
  );
}
