"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/_components/AuthProvider";
import { fetchSubscriptions, saveSubscriptions, fetchDisabledSubSeries, saveDisabledSubSeries } from "@/utils/subscriptions";
import { SERIES_GROUPS } from "@/app/_components/Calendar/filterConfig";
import type { SeriesKey, SubSeriesKey } from "@/app/_components/Calendar/filterConfig";
import style from "./Settings.module.scss";
import { useRouter } from "next/dist/client/components/navigation";

const SERIES_COLORS: Record<string, string> = {
  motogp: "var(--motogp-red)",
  wsbk: "var(--wsbk-blue)",
  bsb: "#1db954",
  speedway: "#f57c00",
  f1: "var(--f1-red)",
};

const CARD_META: Record<SubSeriesKey, { abbr: string; subtitle: string }> = {
  motogp:   { abbr: "GP",  subtitle: "Premier Class" },
  moto2:    { abbr: "M2",  subtitle: "Intermediate" },
  moto3:    { abbr: "M3",  subtitle: "Lightweight" },
  worldsbk: { abbr: "SBK", subtitle: "Superbike" },
  worldssp: { abbr: "SSP", subtitle: "Supersport" },
  worldwcr: { abbr: "WCR", subtitle: "Women's Cup" },
  worldspb: { abbr: "SPB", subtitle: "300cc" },
  bsb:      { abbr: "BSB", subtitle: "British SBK" },
  speedway: { abbr: "SGP", subtitle: "Grand Prix" },
  f1:       { abbr: "F1",  subtitle: "Single Seater" },
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
  const router = useRouter();
  const [subscribed, setSubscribed] = useState<Set<SeriesKey>>(new Set());
  const [disabledSubSeries, setDisabledSubSeries] = useState<Set<SubSeriesKey>>(new Set());
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
    Promise.all([fetchSubscriptions(), fetchDisabledSubSeries()]).then(([series, disabled]) => {
      setSubscribed(new Set(series));
      setDisabledSubSeries(new Set(disabled));
      setLoading(false);
    });
  }, []);

  const isCardSelected = (parentKey: SeriesKey, subKey: SubSeriesKey) =>
    subscribed.has(parentKey) && !disabledSubSeries.has(subKey);

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
        saveDisabledSubSeries(Array.from(disabledSubSeries) as SubSeriesKey[]),
      ]);
      showToast("Settings saved.", true);
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
