"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/_components/AuthProvider";
import { SERIES_GROUPS, type SeriesKey, type SubSeriesKey } from "@/consts/series";
import { apiOnboarding } from "@/utils/auth";
import { savePreferences } from "@/utils/preferences";
import { normalizeReturnTo, RETURN_TO_PARAM } from "@/utils/returnTo";
import { useSubscriptions } from "@/utils/SubscriptionsContext";
import style from "./Onboarding.module.scss";
import { followedChampionships } from "@/utils/championships";
import { FavouriteChampionshipPreference } from "@/app/_components/FavouriteChampionshipPreference";
import { SeriesCategorySelection } from "@/app/_components/SeriesCategorySelection";



const DEFAULT_SELECTED = new Set<SubSeriesKey>(
  SERIES_GROUPS.find((group) => group.key === "motogp")?.children.map((child) => child.key) ?? ["motogp"]
);

export default function OnboardingPage() {
  const { updateUser } = useAuth();
  const { reload } = useSubscriptions();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = normalizeReturnTo(searchParams.get(RETURN_TO_PARAM));
  const [selectedSubSeries, setSelectedSubSeries] = useState<Set<SubSeriesKey>>(DEFAULT_SELECTED);
  const [calendarView, setCalendarView] = useState<"rounds" | "events">("rounds");
  const [showMotoGPChampionship, setShowMotoGPChampionship] = useState(true);
  const [favouriteChampionship, setFavouriteChampionship] = useState<string | null>("motogp:motogp");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedSeries = useMemo(() => {
    return SERIES_GROUPS.filter((group) =>
      group.children.some((child) => selectedSubSeries.has(child.key))
    ).map((group) => group.key) as SeriesKey[];
  }, [selectedSubSeries]);

  const disabledSubSeries = useMemo(() => {
    return SERIES_GROUPS.flatMap((group) => {
      const groupEnabled = group.children.some((child) => selectedSubSeries.has(child.key));
      if (!groupEnabled) return [];
      return group.children
        .filter((child) => !selectedSubSeries.has(child.key))
        .map((child) => child.key);
    }) as SubSeriesKey[];
  }, [selectedSubSeries]);

  const favouriteOptions = followedChampionships(selectedSeries, disabledSubSeries);

  const handleSubmit = async () => {
    if (selectedSeries.length === 0) {
      setError("Select at least one class or series to follow.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await apiOnboarding(selectedSeries);
      await savePreferences({
        calendarView,
        disabledSubSeries,
        showMotoGPChampionship,
        favouriteChampionship,
      });
      await reload();
      updateUser({ onboardingComplete: true });
      router.replace(returnTo ?? "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={style.page}>
      <div className={style.container}>
        <div className={style.header}>
          <h1 className={style.title}>Welcome to RaceCal</h1>
          <p className={style.subtitle}>Set up your dashboard and choose the racing you want to follow</p>
        </div>

        <section className={style.section}>
          <h2 className={style.sectionTitle}>Dashboard Preferences</h2>
          <p className={style.sectionDesc}>Choose how RaceCal should look when you first land.</p>

          <div className={style.prefRow}>
            <div className={style.prefLabel}>
              <span className={style.prefLabelText}>Default View</span>
              <span className={style.prefLabelSub}>
                {calendarView === "rounds" ? "Shows one entry per race weekend" : "Shows individual sessions"}
              </span>
            </div>
            <button
              type="button"
              className={`${style.prefSwitch} ${calendarView === "events" ? style.prefSwitchOn : ""}`}
              onClick={() => setCalendarView(calendarView === "rounds" ? "events" : "rounds")}
              role="switch"
              aria-checked={calendarView === "events"}
            >
              <span className={style.prefSwitchThumb} />
              <span className={style.prefSwitchLabels}>
                <span>Rounds</span>
                <span>Events</span>
              </span>
            </button>
          </div>

          {(
            <div className={style.prefRow}>
              <div className={style.prefLabel}>
                <span className={style.prefLabelText}>Home championship</span>
                <span className={style.prefLabelSub}>
                  Show or hide your favourite championship on the home screen
                </span>
              </div>
              <button
                type="button"
                className={`${style.prefSwitch} ${showMotoGPChampionship ? style.prefSwitchOn : ""}`}
                onClick={() => setShowMotoGPChampionship((value) => !value)}
                role="switch"
                aria-checked={showMotoGPChampionship}
              >
                <span className={style.prefSwitchThumb} />
                <span className={style.prefSwitchLabels}>
                  <span>Off</span>
                  <span>On</span>
                </span>
              </button>
            </div>
          )}
          <FavouriteChampionshipPreference value={favouriteChampionship} options={favouriteOptions} onChange={setFavouriteChampionship} disabled={submitting} />
        </section>

        <section className={style.section}>
          <h2 className={style.sectionTitle}>Series Subscriptions</h2>
          <p className={style.sectionDesc}>Open Bikes or Cars to choose which championships and classes to follow.</p>

          <SeriesCategorySelection selected={selectedSubSeries} onChange={setSelectedSubSeries} disabled={submitting} />
        </section>

        {error && <p className={style.error}>{error}</p>}

        <button
          type="button"
          className={style.submit}
          onClick={handleSubmit}
          disabled={submitting || selectedSeries.length === 0}
        >
          {submitting ? "Saving…" : "Start tracking"}
        </button>
      </div>
    </div>
  );
}
