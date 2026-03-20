"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { fetchCalendarEvents, type ApiCalendarEvent } from "@/utils/getCalendarData";
import { RaceGrid } from "@/app/_components/Grid/RaceGrid";

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

function formatSessionTime(iso: string) {
  try {
    return format(new Date(iso), "EEE d MMM, HH:mm 'UTC'");
  } catch {
    return iso;
  }
}

function statusLabel(status: string | null) {
  if (!status) return null;
  if (status === "COMPLETED") return "✓";
  if (status === "LIVE") return "● Live";
  if (status === "CANCELLED") return "Cancelled";
  return null;
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
        <Link href="/race-lineup">← Back to race lineup</Link>
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
  const sortedSubSeries = [...bySubSeries.keys()].sort(
    (a, b) => subSeriesOrder.indexOf(a) - subSeriesOrder.indexOf(b)
  );

  for (const sessions of bySubSeries.values()) {
    sessions.sort((a, b) => {
      const typeOrder = (SESSION_ORDER[a.type] ?? 9) - (SESSION_ORDER[b.type] ?? 9);
      if (typeOrder !== 0) return typeOrder;
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    });
  }

  return (
    <div style={pageStyle}>
      <Link href="/race-lineup" style={backLinkStyle}>← Back to race lineup</Link>

      {/* Round header */}
      <div style={headerStyle}>
        <h1 style={{ margin: "0 0 4px" }}>{round?.name || "Grand Prix"}</h1>
        <p style={{ margin: 0, opacity: 0.7 }}>
          {[round?.circuit, round?.country].filter(Boolean).join(" · ")}
          {first.start && ` · ${format(new Date(first.start), "do MMMM yyyy")}`}
        </p>
      </div>

      {/* Starting grid */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Starting Grid</h2>
        <RaceGrid roundId={roundId} />
      </section>

      {/* Session schedule */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Session Schedule</h2>
        {sortedSubSeries.map((sub) => {
          const sessions = bySubSeries.get(sub)!;
          const label = SUBSERIES_LABEL[sub] ?? sub.toUpperCase();
          return (
            <div key={sub} style={subSeriesBlockStyle}>
              <h3 style={subSeriesTitleStyle}>{label}</h3>
              <table style={tableStyle}>
                <tbody>
                  {sessions.map((ev) => {
                    const badge = statusLabel(ev.status);
                    return (
                      <tr key={ev.id}>
                        <td style={tdSessionStyle}>{ev.sessionName || ev.type}</td>
                        <td style={tdTimeStyle}>{formatSessionTime(ev.start)}</td>
                        {badge && <td style={tdBadgeStyle}>{badge}</td>}
                        {!badge && <td />}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const tdSessionStyle: React.CSSProperties = {
  padding: "6px 0",
  width: "40%",
  fontWeight: 600,
};

const tdTimeStyle: React.CSSProperties = {
  padding: "6px 0",
  opacity: 0.7,
  fontSize: 14,
};

const tdBadgeStyle: React.CSSProperties = {
  padding: "6px 0",
  textAlign: "right",
  fontSize: 13,
  opacity: 0.6,
};

// ─── Export ───────────────────────────────────────────────────────────────────

export default function RaceInfoPage() {
  return (
    <Suspense>
      <RacePage />
    </Suspense>
  );
}
