"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/_components/AuthProvider";
import { SERIES_COLORS, SERIES_GROUPS, type SeriesKey, type SubSeriesKey } from "@/consts/series";
import { fetchSubscriptions, saveSubscriptions, fetchDisabledSubSeries } from "@/utils/subscriptions";
import { fetchPreferences, savePreferences } from "@/utils/preferences";
import { useSubscriptions } from "@/utils/SubscriptionsContext";
import type { CalendarView } from "@/utils/getCalendarData";
import style from "./Settings.module.scss";
import { useRouter } from "next/dist/client/components/navigation";

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
    parentKey: group.key as SeriesKey,
    subKey: child.key,
    label: child.label,
    color: SERIES_COLORS[group.key],
    ...CARD_META[child.key],
  }))
);

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { reload: reloadSubscriptions } = useSubscriptions();
  const router = useRouter();
  const [subscribed, setSubscribed] = useState<Set<SeriesKey>>(new Set());
  const [disabledSubSeries, setDisabledSubSeries] = useState<Set<SubSeriesKey>>(new Set());
  const [calendarView, setCalendarView] = useState<CalendarView>("rounds");
  const [showMotoGPChampionship, setShowMotoGPChampionship] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    Promise.all([fetchSubscriptions(), fetchDisabledSubSeries(), fetchPreferences()]).then(
      ([series, disabled, prefs]) => {
        setSubscribed(new Set(series));
        setDisabledSubSeries(new Set(disabled));
        if (prefs.calendarView) setCalendarView(prefs.calendarView);
        if (typeof prefs.showMotoGPChampionship === "boolean") {
          setShowMotoGPChampionship(prefs.showMotoGPChampionship);
        }
        setLoading(false);
      }
    );
  }, []);

  const isCardSelected = (parentKey: SeriesKey, subKey: SubSeriesKey) =>
    subscribed.has(parentKey) && !disabledSubSeries.has(subKey);
  const showMotoGPChampionshipPreference = subscribed.has("motogp");

  const toggleCard = (parentKey: SeriesKey, subKey: SubSeriesKey) => {
    const selected = isCardSelected(parentKey, subKey);
    const siblings = SERIES_GROUPS.find((g) => g.key === parentKey)?.children ?? [];

    setDisabledSubSeries((prev) => {
      const next = new Set(prev);
      if (selected) next.add(subKey);
      else next.delete(subKey);
      return next;
    });

    setSubscribed((prev) => {
      const next = new Set(prev);
      if (selected) {
        const nextDisabled = new Set(disabledSubSeries);
        nextDisabled.add(subKey);
        const allDisabled = siblings.every((c) => nextDisabled.has(c.key));
        if (allDisabled) next.delete(parentKey);
      } else {
        next.add(parentKey);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (subscribed.size === 0) {
      showToast("Select at least one series.", false);
      return;
    }
    setSaving(true);
    try {
      await Promise.all([
        saveSubscriptions(Array.from(subscribed) as SeriesKey[]),
        savePreferences({
          calendarView,
          disabledSubSeries: Array.from(disabledSubSeries) as SubSeriesKey[],
          showMotoGPChampionship,
        }),
      ]);
      showToast("Settings saved.", true);
      void reloadSubscriptions();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Save failed", false);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (loading) return <div className={style.loading}>Loading…</div>;

  return (
    <div className={style.page}>
      <div className={style.container}>
        <div className={style.header}>
          <div>
            <h1 className={style.title}>Settings</h1>
            {user && <p className={style.subtitle}>{user.email}</p>}
          </div>
          <button className={style.signOutBtn} onClick={handleLogout}>
            Sign out
          </button>
        </div>

        <section className={style.section}>
          <h2 className={style.sectionTitle}>Calendar Preferences</h2>
          <p className={style.sectionDesc}>Choose how events are displayed on the calendar by default.</p>

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

          {showMotoGPChampionshipPreference && (
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
              const selected = isCardSelected(parentKey, subKey);
              return (
                <button
                  key={subKey}
                  type="button"
                  className={`${style.card} ${selected ? style.cardSelected : ""}`}
                  style={{ "--series-color": color } as React.CSSProperties}
                  onClick={() => toggleCard(parentKey, subKey)}
                  aria-pressed={selected}
                >
                  <div className={style.cardTop}>
                    <span className={style.abbr}>{abbr}</span>
                    <span className={`${style.checkbox} ${selected ? style.checkboxChecked : ""}`} aria-hidden="true">
                      {selected && "✓"}
                    </span>
                  </div>
                  <div className={style.cardBottom}>
                    <span className={style.cardLabel}>{label}</span>
                    <span className={style.cardSub}>{subtitle}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className={style.saveBtn}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </section>
      </div>

      {toast && (
        <div className={`${style.toast} ${toast.ok ? style.toastOk : style.toastError}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
