"use client";

import { useEffect, useMemo, useState } from "react";
import { Rider } from "@/models/rider";
import { FALLBACK_TEAM_COLOR } from "@/app/consts";
import style from "./Grid.module.scss";

type GridEntry = {
  qualifying_position?: number | string;
  qualifying_time?: string | null;
  team_name?: string | null;
  rider?: {
    id?: string;
    riders_api_uuid?: string;
    legacy_id?: string | number;
    full_name?: string;
  } | null;
};

export default function GridPanel({ riders }: { riders: Rider[] }) {
  const [grid, setGrid] = useState<GridEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventName, setEventName] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function fetchGrid() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          "https://cascading-monkeys.corey-obeirne.workers.dev/get_next_grandprix"
        );
        const data = await res.json();
        const nameCandidate =
          data?.event?.full_name ||
          data?.event?.name ||
          data?.name ||
          data?.title ||
          data?.grand_prix_name ||
          data?.grand_prix ||
          null;
        if (alive) setEventName(nameCandidate);
        if (data?.links?.grid) {
          const gridRes = await fetch(data.links.grid);
          const gridData = await gridRes.json();
          if (alive) setGrid(Array.isArray(gridData.grid) ? gridData.grid : []);
        } else {
          if (alive) setGrid([]);
        }
      } catch (e) {
        if (alive) setError("Failed to load the current grid.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    fetchGrid();
    return () => {
      alive = false;
    };
  }, []);

  const ordered = useMemo(() => {
    return [...grid]
      .filter((e) => e && e.qualifying_position != null)
      .sort(
        (a, b) => Number(a.qualifying_position) - Number(b.qualifying_position)
      );
  }, [grid]);

  // Rider lookup by id
  const riderById = useMemo(() => {
    const map = new Map<string, Rider>();
    for (const r of riders) {
      map.set(r.id, r);
    }
    return map;
  }, [riders]);

  // chunk ordered grid into rows of 3
  const rows = useMemo(() => {
    const out: GridEntry[][] = [];
    for (let i = 0; i < ordered.length; i += 3) {
      out.push(ordered.slice(i, i + 3));
    }
    return out;
  }, [ordered]);

  const contrastText = (hex?: string) => {
    if (!hex) return "#ffffff";
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    // Perceived luminance
    const L = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return L > 0.6 ? "#121212" : "#ffffff";
  };

  return (
    <div className={`panel ${style.GridPanel}`}>
      <div className={style.header}>
        <h3 style={{ margin: 0 }}>{eventName || "Current Grid"}</h3>
        <span className={style.meta}>
          {loading
            ? "Loading…"
            : ordered.length > 0
            ? `${ordered.length} riders`
            : "No grid available"}
        </span>
      </div>
      {error && <div className={style.error}>{error}</div>}
      {!loading && rows.length > 0 && (
        <div className={style.rows}>
          {rows.map((group, rIdx) => (
            <div key={`row-${rIdx}`} className={style.row}>
              {group.map((entry, cIdx) => {
                const pos = Number(entry.qualifying_position);
                const name = entry.rider?.full_name || "Unknown";
                const team = entry.team_name || null;
                const time = entry.qualifying_time || null;
                const key = entry.rider?.id || `${name}-${pos}`;
                // new order: left(front), center(slightly back), right(more back)
                const cellClass =
                  cIdx === 0
                    ? style.left
                    : cIdx === 1
                    ? style.center
                    : style.right;

                // Try to match rider data for images/colors using multiple id types
                const riderMatch =
                  riderById.get(entry.rider?.id || "") ||
                  riderById.get(entry.rider?.riders_api_uuid || "") ||
                  riderById.get(String(entry.rider?.legacy_id || ""));

                const teamColor = riderMatch?.teamColor || FALLBACK_TEAM_COLOR;
                const riderImg = riderMatch?.pictures?.profile?.main || null;
                const bikeImg = (riderMatch?.pictures?.bike?.main ||
                  riderMatch?.teamPicture) as string | undefined;
                let thumb: string | undefined;
                if (riderImg) {
                  const parts = riderImg.split("/");
                  const file = parts[parts.length - 1];
                  try {
                    // require path for local optimized image like RiderCard
                    thumb = require(`/public/riders/25/${file}?resize&size=300&webp`);
                  } catch {}
                }
                return (
                  <div key={key} className={`${style.cell} ${cellClass}`}>
                    <div className={style.posLabel}>{pos}.</div>
                    <div className={style.card}>
                      <div className={style.textWrap}>
                        <div className={style.name}>{name}</div>
                        {(team || time) && (
                          <div className={style.meta}>
                            {team ? team : null}
                            {team && time ? " • " : ""}
                            {time ? time : null}
                          </div>
                        )}
                      </div>
                      <div className={style.bikeBackdrop} />
                      {(thumb || bikeImg) && (
                        <div className={style.bikeWrap}>
                          {bikeImg ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={bikeImg}
                              alt=""
                              className={style.bikeImg}
                            />
                          ) : thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={thumb} alt="" className={style.bikeImg} />
                          ) : null}
                        </div>
                      )}
                      {riderMatch?.number != null && (
                        <div
                          className={style.numberPill}
                          style={{
                            backgroundColor: teamColor,
                            color: contrastText(teamColor),
                          }}
                        >
                          #{riderMatch.number}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
      {loading && <div className={style.loading}>Loading grid…</div>}
    </div>
  );
}
