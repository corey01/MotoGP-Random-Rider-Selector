"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/_components/AuthProvider";
import { SERIES_GROUPS, type SeriesKey, type SubSeriesKey } from "@/consts/series";
import { fetchSubscriptions, saveSubscriptions, fetchDisabledSubSeries } from "@/utils/subscriptions";
import { fetchPreferences, savePreferences } from "@/utils/preferences";
import { useSubscriptions } from "@/utils/SubscriptionsContext";
import type { CalendarView } from "@/utils/getCalendarData";
import style from "./Settings.module.scss";
import { useRouter } from "next/dist/client/components/navigation";
import { followedChampionships, resolveFavouriteChampionship } from "@/utils/championships";
import { FavouriteChampionshipPreference } from "@/app/_components/FavouriteChampionshipPreference";
import { SeriesCategorySelection } from "@/app/_components/SeriesCategorySelection";
import { preferencesForClassSelection } from "@/utils/seriesCategories";



export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { reload: reloadSubscriptions } = useSubscriptions();
  const router = useRouter();
  const [subscribed, setSubscribed] = useState<Set<SeriesKey>>(new Set());
  const [disabledSubSeries, setDisabledSubSeries] = useState<Set<SubSeriesKey>>(new Set());
  const [calendarView, setCalendarView] = useState<CalendarView>("rounds");
  const [showMotoGPChampionship, setShowMotoGPChampionship] = useState(true);
  const [favouriteChampionship, setFavouriteChampionship] = useState<string | null>(null);
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
        setFavouriteChampionship(resolveFavouriteChampionship(prefs.favouriteChampionship, series, disabled));
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
  const favouriteOptions = followedChampionships([...subscribed], [...disabledSubSeries]);

  const selectedClasses = new Set(SERIES_GROUPS.flatMap((group) => group.children.filter((child) => isCardSelected(group.key, child.key)).map((child) => child.key)));
  const changeClassSelection = (selected: Set<SubSeriesKey>) => {
    const next = preferencesForClassSelection(selected, [...subscribed], [...disabledSubSeries]);
    setSubscribed(new Set(next.series));
    setDisabledSubSeries(new Set(next.disabledSubSeries));
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
          favouriteChampionship,
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
          <FavouriteChampionshipPreference value={favouriteChampionship} options={favouriteOptions} onChange={setFavouriteChampionship} disabled={saving} />
        </section>

        <section className={style.section}>
          <h2 className={style.sectionTitle}>Series Subscriptions</h2>
          <p className={style.sectionDesc}>Open Bikes or Cars to choose championships and classes to follow. Some currently offer standings and timing data only.</p>

          <SeriesCategorySelection selected={selectedClasses} onChange={changeClassSelection} disabled={saving} />

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
