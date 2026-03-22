"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/_components/AuthProvider";
import { fetchSubscriptions, saveSubscriptions } from "@/utils/subscriptions";
import { SERIES_GROUPS } from "@/app/_components/Calendar/filterConfig";
import type { SeriesKey } from "@/app/_components/Calendar/filterConfig";
import style from "./Settings.module.scss";
import { useRouter } from "next/dist/client/components/navigation";

const SERIES_COLORS: Record<string, string> = {
  motogp: "var(--motogp-red)",
  wsbk: "var(--wsbk-blue)",
  bsb: "#1db954",
  speedway: "#f57c00",
  f1: "var(--f1-red)",
};

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [subscribed, setSubscribed] = useState<Set<SeriesKey>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSubscriptions().then((series) => {
      setSubscribed(new Set(series));
      setLoading(false);
    });
  }, []);

  const toggle = (key: SeriesKey) => {
    setSaved(false);
    setSubscribed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSave = async () => {
    if (subscribed.size === 0) {
      setError("Select at least one series.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await saveSubscriptions(Array.from(subscribed) as SeriesKey[]);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
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
          <p className={style.sectionDesc}>Choose which series appear in your calendar and dashboard.</p>

          <div className={style.grid}>
            {SERIES_GROUPS.map((group) => {
              const isSelected = subscribed.has(group.key as SeriesKey);
              return (
                <button
                  key={group.key}
                  type="button"
                  className={`${style.card} ${isSelected ? style.cardSelected : ""}`}
                  style={{ "--series-color": SERIES_COLORS[group.key] } as React.CSSProperties}
                  onClick={() => toggle(group.key as SeriesKey)}
                  aria-pressed={isSelected}
                >
                  <span className={style.cardLabel}>{group.label}</span>
                  {group.children.length > 1 && (
                    <span className={style.cardSub}>
                      {group.children.map((c) => c.label).join(", ")}
                    </span>
                  )}
                  {isSelected && <span className={style.checkmark} aria-hidden="true">✓</span>}
                </button>
              );
            })}
          </div>

          {error && <p className={style.error}>{error}</p>}
          {saved && <p className={style.success}>Saved!</p>}

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
    </div>
  );
}
