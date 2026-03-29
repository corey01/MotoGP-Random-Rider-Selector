"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/_components/AuthProvider";
import { SERIES_COLORS, SERIES_GROUPS, type SeriesKey, type SubSeriesKey } from "@/consts/series";
import { apiOnboarding } from "@/utils/auth";
import { savePreferences } from "@/utils/preferences";
import { normalizeReturnTo, RETURN_TO_PARAM } from "@/utils/returnTo";
import { useSubscriptions } from "@/utils/SubscriptionsContext";
import style from "./Onboarding.module.scss";

const CARD_META: Record<SubSeriesKey, { abbr: string; subtitle: string }> = {
  motogp:   { abbr: "GP",  subtitle: "Premier Class" },
  moto2:    { abbr: "M2",  subtitle: "Intermediate" },
  moto3:    { abbr: "M3",  subtitle: "Lightweight" },
  baggers:  { abbr: "BAG", subtitle: "Bagger Racing" },
  worldsbk: { abbr: "SBK", subtitle: "Superbike" },
  worldssp: { abbr: "SSP", subtitle: "Supersport" },
  worldwcr: { abbr: "WCR", subtitle: "Women's Cup" },
  worldspb: { abbr: "SPB", subtitle: "300cc" },
  bsb:      { abbr: "BSB", subtitle: "British SBK" },
  speedway: { abbr: "SGP", subtitle: "Grand Prix" },
  f1:       { abbr: "F1",  subtitle: "Single Seater" },
  gtwce:    { abbr: "GT",  subtitle: "GT3 / GT4" },
  iomtt:    { abbr: "IoMTT",  subtitle: "Road Racing" },
  nls:      { abbr: "NLS", subtitle: "Endurance" },
};

const ALL_CARDS = SERIES_GROUPS.flatMap((group) =>
  group.children.map((child) => ({
    parentKey: group.key,
    subKey: child.key,
    label: child.label,
    color: SERIES_COLORS[group.key],
    ...CARD_META[child.key],
  }))
);

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

  const toggleCard = (subKey: SubSeriesKey) => {
    setSelectedSubSeries((prev) => {
      const next = new Set(prev);
      if (next.has(subKey)) {
        next.delete(subKey);
      } else {
        next.add(subKey);
      }
      return next;
    });
  };

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

          {selectedSeries.includes("motogp") && (
            <div className={style.prefRow}>
              <div className={style.prefLabel}>
                <span className={style.prefLabelText}>MotoGP Championship</span>
                <span className={style.prefLabelSub}>
                  Show or hide the MotoGP standings card on your dashboard
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
        </section>

        <section className={style.section}>
          <h2 className={style.sectionTitle}>Series Subscriptions</h2>
          <p className={style.sectionDesc}>Choose which series and classes appear in your calendar.</p>

        <div className={style.grid}>
          {ALL_CARDS.map(({ parentKey, subKey, label, abbr, subtitle, color }) => {
            const isSelected = selectedSubSeries.has(subKey);
            return (
              <button
                key={subKey}
                type="button"
                className={`${style.card} ${isSelected ? style.cardSelected : ""}`}
                style={{ "--series-color": color } as React.CSSProperties}
                onClick={() => toggleCard(subKey)}
                aria-pressed={isSelected}
              >
                <div className={style.cardTop}>
                  <span className={style.abbr}>{abbr}</span>
                  <span className={`${style.checkbox} ${isSelected ? style.checkboxChecked : ""}`} aria-hidden="true">
                    {isSelected && "✓"}
                  </span>
                </div>
                <div className={style.cardBottom}>
                  <span className={style.cardLabel}>{label}</span>
                  <span className={style.cardSub}>{subtitle}</span>
                  <span className={style.cardSeries}>{SERIES_GROUPS.find((group) => group.key === parentKey)?.label}</span>
                </div>
              </button>
            );
          })}
        </div>
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
