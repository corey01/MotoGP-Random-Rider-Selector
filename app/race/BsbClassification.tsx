"use client";
import { useEffect, useState } from "react";
import { StandingsTable } from "../standings/StandingsTable";
import type { StandingsEntry } from "@/utils/getStandings";
import style from "./RacePage.module.scss";
type Row = {
  position: number | null;
  riderName: string;
  riderNumber: number;
  riderExternalId: string;
  teamName: string | null;
  status: string | null;
  bestLapTime: string | null;
  gapFirst: string | null;
  points: number | null;
};
type Payload = {
  roundId: number;
  subSeries: string;
  asOfDate: string;
  sourceUrl: string;
  provisional: boolean;
  documents?: Array<{label:string;provisional?:boolean}>;
  stale: boolean;
  grids: Record<string, Row[]>;
  results: Record<string, Row[]>;
  standings: StandingsEntry[];
};
export function BsbClassification({ roundId }: { roundId: number }) {
  const [cls, setClass] = useState("bsb"),
    [tab, setTab] = useState("results"),
    [race, setRace] = useState("Race 1");
  const [data, setData] = useState<Payload | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError("");
    setRace("Race 1");
    fetch(
      `${process.env.NEXT_PUBLIC_RACECAL_URL}/classifications?roundId=${roundId}&subSeries=${cls}`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        const value = await response.json();
        if (!response.ok) throw new Error(
          typeof value.error === "string" ? value.error : "Timing data is unavailable for this weekend and class.",
        );
        return value;
      })
      .then((value) => {
        if (value.roundId !== roundId || value.subSeries !== cls)
          throw new Error("The timing data does not match this weekend.");
        if (!controller.signal.aborted) setData(value);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message);
      });
    return () => controller.abort();
  }, [roundId, cls]);
  const sessions = data ? (tab === "grid" ? data.grids : data.results) : {};
  const selected = sessions[race] ? race : Object.keys(sessions)[0];
  const currentDocument = tab === "standings" ? "Championship Points" : tab === "grid" ? `Grid for ${selected}` : `${selected} Result`;
  const isProvisional = data?.documents?.find(doc => doc.label === currentDocument)?.provisional === true;
  return (
    <section className={style.scheduleSection}>
      <p className={style.sectionEyebrow}>British championship</p>
      <h2 className={style.sectionTitle}>Results, grids & standings</h2>
      <div
        className={style.classSelector}
        role="group"
        aria-label="British championship class"
      >
        {[
          ["bsb", "Superbike"],
          ["bsb-supersport", "Supersport"],
        ].map(([key, label]) => (
          <button
            key={key}
            aria-pressed={cls === key}
            onClick={() => setClass(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        className={style.classSelector}
        role="group"
        aria-label="Timing view"
      >
        {[
          ["results", "Results"],
          ["grid", "Grid"],
          ["standings", "Standings"],
        ].map(([key, label]) => (
          <button
            key={key}
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {error ? (
        <p role="status">{error}</p>
      ) : !data ? (
        <p role="status">Loading timing data…</p>
      ) : (
        <>
          <p className={style.standingsFreshness}>
            {isProvisional ? "Provisional · " : ""}As of{" "}
            {new Date(data.asOfDate + "T12:00:00").toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            {data.stale
              ? " · Refresh delayed; showing the last successful update."
              : ""}
          </p>
          {tab === "standings" ? (
            <StandingsTable entries={data.standings} />
          ) : (
            <>
              <div
                className={style.classSelector}
                role="group"
                aria-label="Race session"
              >
                {Object.keys(sessions).map((key) => (
                  <button
                    key={key}
                    aria-pressed={selected === key}
                    onClick={() => setRace(key)}
                  >
                    {key}
                  </button>
                ))}
              </div>
              {!selected ? (
                <p>No {tab === "grid" ? "grid" : "results"} published yet.</p>
              ) : (
                <table className={style.standingsTable}>
                  <caption>
                    {selected}{" "}
                    {tab === "grid" ? "starting grid" : "classification"}
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Pos</th>
                      <th scope="col">Rider</th>
                      <th scope="col">
                        {tab === "grid" ? "Qualifying" : "Gap"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions[selected].map((row) => (
                      <tr key={row.riderExternalId}>
                        <td>{row.position ?? row.status ?? "—"}</td>
                        <td>
                          {row.riderName}{" "}
                          <span className={style.standingsFreshness}>
                            #{row.riderNumber}
                          </span>
                          {row.teamName && (
                            <div className={style.standingsFreshness}>
                              {row.teamName}
                            </div>
                          )}
                        </td>
                        <td>
                          {(tab === "grid" ? row.bestLapTime : row.gapFirst) ??
                            "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
          <p>
            <a
              href={data.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={style.backLink}
            >
              Official timing documents ↗
            </a>
          </p>
        </>
      )}
    </section>
  );
}
