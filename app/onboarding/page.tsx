"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/_components/AuthProvider";
import { apiOnboarding } from "@/utils/auth";
import { SERIES_GROUPS } from "@/app/_components/Calendar/filterConfig";
import style from "./Onboarding.module.scss";

const SERIES_COLORS: Record<string, string> = {
  motogp: "var(--motogp-red)",
  wsbk: "var(--wsbk-blue)",
  bsb: "#1db954",
  speedway: "#f57c00",
  f1: "var(--f1-red)",
};

export default function OnboardingPage() {
  const { updateUser } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set(["motogp"]));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selected.size === 0) {
      setError("Select at least one series to follow.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await apiOnboarding(Array.from(selected));
      updateUser({ onboardingComplete: true });
      router.replace("/");
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
          <p className={style.subtitle}>Choose the series you want to follow</p>
        </div>

        <div className={style.grid}>
          {SERIES_GROUPS.map((group) => {
            const isSelected = selected.has(group.key);
            return (
              <button
                key={group.key}
                type="button"
                className={`${style.card} ${isSelected ? style.cardSelected : ""}`}
                style={{ "--series-color": SERIES_COLORS[group.key] } as React.CSSProperties}
                onClick={() => toggle(group.key)}
                aria-pressed={isSelected}
              >
                <span className={style.cardLabel}>{group.label}</span>
                {group.children.length > 1 && (
                  <span className={style.cardSub}>
                    {group.children.map((c) => c.label).join(", ")}
                  </span>
                )}
                <span className={style.checkmark} aria-hidden="true">
                  {isSelected ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>

        {error && <p className={style.error}>{error}</p>}

        <button
          type="button"
          className={style.submit}
          onClick={handleSubmit}
          disabled={submitting || selected.size === 0}
        >
          {submitting ? "Saving…" : "Start tracking"}
        </button>
      </div>
    </div>
  );
}
