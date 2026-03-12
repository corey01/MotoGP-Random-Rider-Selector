"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { fetchPublicGroup, type PublicGroupData } from "@/utils/groups";
import { getRiderData, type RiderDataResponse } from "@/utils/getRiderData";
import ResultsRiderCard from "@/app/_components/Results/ResultsRiderCard";
import type { SelectedRider } from "@/models/rider";
import style from "./SweepstakeResults.module.scss";

function SweepstakeResultsContent() {
  const searchParams = useSearchParams();
  const groupId = Number(searchParams.get("id"));

  const [data, setData] = useState<PublicGroupData | null>(null);
  const [riderData, setRiderData] = useState<RiderDataResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!groupId) return;
    Promise.all([fetchPublicGroup(groupId), getRiderData()])
      .then(([group, riders]) => {
        setData(group);
        setRiderData(riders);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Results not found")
      )
      .finally(() => setLoading(false));
  }, [groupId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (loading) return <div className={style.loading}>Loading…</div>;
  if (error) return <div className={style.error}>{error}</div>;
  if (!data) return null;

  const { group, assignments } = data;

  const selectedRiders: Array<{ participant: string; selected: SelectedRider | null }> =
    assignments.map((a) => {
      const rider = riderData?.allRiders.find((r) => r.dbId === a.riderId) ?? null;
      return {
        participant: a.participantName,
        selected: rider ? { entrant: rider.sponsoredTeam, rider } : null,
      };
    });

  return (
    <div className={style.page}>
      <h2 className={style.groupName}>{group.name}</h2>

      {group.round && (
        <p className={style.round}>
          {group.round.name}
          {group.round.place ? ` · ${group.round.place}` : ""}
          {group.round.country && group.round.country !== group.round.place
            ? ` · ${group.round.country}`
            : ""}
        </p>
      )}

      {assignments.length === 0 ? (
        <p className={style.empty}>No assignments yet.</p>
      ) : (
        <div className={style.cards}>
          {selectedRiders.map(({ participant, selected }, i) => (
            <div key={i} className={style.cardWrapper}>
              <p className={style.participant}>{participant}</p>
              {selected ? (
                <ResultsRiderCard selected={selected} />
              ) : (
                <p className={style.rider}>
                  {assignments[i].riderName ?? `Rider #${assignments[i].riderId}`}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <button className={style.copyBtn} onClick={handleCopy}>
        {copied ? "Copied!" : "Copy shareable link"}
      </button>
    </div>
  );
}

export default function SweepstakeResultsPage() {
  return (
    <Suspense>
      <SweepstakeResultsContent />
    </Suspense>
  );
}
