"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { fetchRaceResults, type RaceResultsData, type RaceResultItem } from "@/utils/getRaceResults";

const SESSION_LABEL: Record<string, string> = {
  RAC: "Race Result",
  SPR: "Sprint Result",
};

const isDNF = (item: RaceResultItem) => item.position === null;

function formatGap(item: RaceResultItem): string {
  if (isDNF(item)) return "DNF";
  if (!item.gapFirst || item.gapFirst === "0.000") return "WINNER";
  return `+${item.gapFirst}`;
}

function ResultRow({ item, index }: { item: RaceResultItem; index: number }) {
  const portrait = item.pictures?.portrait ?? item.pictures?.profile;
  const gap = formatGap(item);
  const isWinner = gap === "WINNER";
  const isDnf = isDNF(item);
  const accentColor = item.teamColor ?? "#444";

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 0,
      background: index % 2 === 0 ? "#1a1a1a" : "#141414",
      borderLeft: `4px solid ${accentColor}`,
      borderRadius: 6,
      marginBottom: 4,
      overflow: "hidden",
      minHeight: 44,
    }}>
      {/* Position */}
      <div style={{
        width: 36,
        textAlign: "center",
        fontWeight: 900,
        fontSize: isDnf ? 11 : 14,
        color: isDnf ? "#e05" : isWinner ? "#f5c842" : "#666",
        flexShrink: 0,
        fontVariantNumeric: "tabular-nums",
      }}>
        {isDnf ? "DNF" : item.position}
      </div>

      {/* Portrait */}
      <div style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        overflow: "hidden",
        flexShrink: 0,
        background: "#2a2a2a",
        position: "relative",
      }}>
        {portrait ? (
          <Image src={portrait} alt="" fill style={{ objectFit: "cover", objectPosition: "top center" }} unoptimized />
        ) : (
          <div style={{ width: "100%", height: "100%", background: accentColor, opacity: 0.4 }} />
        )}
      </div>

      {/* Name + team */}
      <div style={{ flex: 1, minWidth: 0, padding: "0 10px" }}>
        <div style={{
          fontWeight: 700,
          fontSize: "0.85rem",
          color: "#fff",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          lineHeight: 1.2,
        }}>
          {item.riderName}
        </div>
        {item.teamName && (
          <div style={{
            fontSize: "0.7rem",
            color: "#888",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginTop: 1,
          }}>
            {item.teamName}
          </div>
        )}
      </div>

      {/* Number */}
      {item.riderNumber != null && (
        <div style={{
          flexShrink: 0,
          background: "#2a2a2a",
          color: "#ccc",
          borderRadius: 4,
          padding: "2px 6px",
          fontSize: "0.75rem",
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
        }}>
          {item.riderNumber}
        </div>
      )}

      {/* Points */}
      <div style={{
        flexShrink: 0,
        width: 38,
        textAlign: "right",
        fontSize: "0.75rem",
        fontWeight: 700,
        color: item.points > 0 ? "#f5c842" : "#444",
        fontVariantNumeric: "tabular-nums",
      }}>
        {item.points > 0 ? `${item.points}pt` : ""}
      </div>

      {/* Gap */}
      <div style={{
        flexShrink: 0,
        width: 72,
        textAlign: "right",
        paddingRight: 14,
        fontSize: "0.78rem",
        fontWeight: isWinner ? 800 : 500,
        color: isWinner ? "#f5c842" : isDnf ? "#e05" : "#aaa",
        fontVariantNumeric: "tabular-nums",
        letterSpacing: isWinner ? "0.02em" : 0,
      }}>
        {gap}
      </div>
    </div>
  );
}

function SessionResults({ label, items }: { label: string; items: RaceResultItem[] }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{ margin: "0 0 10px", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.5 }}>{label}</h3>
      {items.map((item, i) => <ResultRow key={item.position} item={item} index={i} />)}
    </div>
  );
}

export function RaceResults({ roundId }: { roundId: number }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RaceResultsData | null>(null);

  useEffect(() => {
    let alive = true;
    fetchRaceResults(roundId)
      .then((d) => { if (alive) { setData(d); setLoading(false); } })
      .catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [roundId]);

  if (loading) return <p style={{ opacity: 0.6 }}>Loading results…</p>;
  if (!data) return <p style={{ opacity: 0.6 }}>Results not yet available.</p>;

  const sessionOrder = ["RAC", "SPR"];
  const sessionKeys = Object.keys(data.sessions).sort(
    (a, b) => sessionOrder.indexOf(a) - sessionOrder.indexOf(b)
  );

  return (
    <div>
      {sessionKeys.map((key) => (
        <SessionResults key={key} label={SESSION_LABEL[key] ?? key} items={data.sessions[key]} />
      ))}
    </div>
  );
}
