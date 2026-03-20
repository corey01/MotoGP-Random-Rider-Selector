"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { fetchPublicSweepstake, type PublicSweepstakeData } from "@/utils/groups";
import { getRiderData, type RiderDataResponse } from "@/utils/getRiderData";
import ResultsRiderCard from "@/app/_components/Results/ResultsRiderCard";
import type { SelectedRider } from "@/models/rider";
import style from "./SweepstakeResults.module.scss";

function SweepstakeResultsContent() {
  const searchParams = useSearchParams();
  const sweepstakeId = Number(searchParams.get("id"));

  const [data, setData] = useState<PublicSweepstakeData | null>(null);
  const [riderData, setRiderData] = useState<RiderDataResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!sweepstakeId) return;
    Promise.all([fetchPublicSweepstake(sweepstakeId), getRiderData()])
      .then(([sweepstake, riders]) => {
        setData(sweepstake);
        setRiderData(riders);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Results not found")
      )
      .finally(() => setLoading(false));
  }, [sweepstakeId]);

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

  const { sweepstake, assignments } = data;

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
      <h2 className={style.groupName}>{sweepstake.groupName}</h2>

      <p className={style.round}>
        {sweepstake.roundName}
        {sweepstake.roundPlace ? ` · ${sweepstake.roundPlace}` : ""}
        {sweepstake.roundCountry && sweepstake.roundCountry !== sweepstake.roundPlace
          ? ` · ${sweepstake.roundCountry}`
          : ""}
      </p>

      {assignments.length === 0 ? (
        <p className={style.empty}>No assignments yet.</p>
      ) : (
        <div className={style.cards}>
          {selectedRiders.map(({ participant, selected }, i) => (
            <div key={i} className={style.cardWrapper}>
              <p className={style.participant}>{participant}</p>
              {selected ? (
                <ResultsRiderCard
                  selected={selected}
                  participantPhotoUrl={assignments[i].participantPhotoUrl}
                  participantName={assignments[i].participantName}
                />
              ) : (
                <p className={style.rider}>{assignments[i].riderName}</p>
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
