"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/_components/AuthProvider";
import { fetchWithAuth } from "@/utils/auth";
import { buildPathWithReturnTo, getCurrentPath } from "@/utils/returnTo";
import style from "./Admin.module.scss";
import PollingSchedule, { type PollingResponse } from "./PollingSchedule";
import JobTable, { type JobRun } from "./JobTable";

// --- Types ---

type UserRole = "user" | "admin" | "legacy";

interface AdminUser {
  id: number;
  email: string;
  displayName: string;
  role: UserRole;
}

interface JobsResponse {
  ok: boolean;
  jobs: JobRun[];
  recent: JobRun[];
}

// --- User lookup ---

function UserLookup({ showToast }: { showToast: (msg: string, ok: boolean) => void }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AdminUser[]>([]);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [pendingRole, setPendingRole] = useState<UserRole>("user");
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setSelected(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetchWithAuth(`/admin/users?q=${encodeURIComponent(value.trim())}`);
        const data = await res.json();
        setSuggestions(res.ok ? data.users : []);
      } catch {
        setSuggestions([]);
      }
    }, 250);
  };

  const handleSelect = (user: AdminUser) => {
    setSelected(user);
    setQuery(`${user.displayName} (${user.email})`);
    setPendingRole(user.role);
    setSuggestions([]);
  };

  const handleRoleChange = async () => {
    if (!selected || pendingRole === selected.role) return;
    setSaving(true);
    try {
      const res = await fetchWithAuth(`/admin/users/${selected.id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: pendingRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      setSelected(data.user);
      showToast(`${selected.email} → ${pendingRole}`, true);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Update failed", false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={style.section}>
      <h2 className={style.sectionTitle}>User Management</h2>
      <div className={style.userSearchWrap}>
        <input
          type="text"
          placeholder="Search by name or email…"
          value={query}
          autoComplete="off"
          className={style.userSearchInput}
          onChange={(e) => handleQueryChange(e.target.value)}
          onBlur={() => setTimeout(() => setSuggestions([]), 150)}
        />
        {suggestions.length > 0 && (
          <ul className={style.userSuggestions}>
            {suggestions.map((u) => (
              <li
                key={u.id}
                className={style.userSuggestionItem}
                onMouseDown={() => handleSelect(u)}
              >
                <span className={style.suggestionName}>{u.displayName}</span>
                <span className={style.suggestionEmail}>{u.email}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {selected && (
        <div className={style.userSelected}>
          <div className={style.userSelectedInfo}>
            <span className={style.userSelectedName}>{selected.displayName}</span>
            <span className={style.userSelectedEmail}>{selected.email}</span>
          </div>
          <select
            className={style.roleSelect}
            value={pendingRole}
            onChange={(e) => setPendingRole(e.target.value as UserRole)}
          >
            <option value="user">user</option>
            <option value="legacy">legacy</option>
            <option value="admin">admin</option>
          </select>
          <button
            className={style.saveRoleBtn}
            disabled={pendingRole === selected.role || saving}
            onClick={handleRoleChange}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      )}
    </section>
  );
}

// --- Main page ---

const CURRENT_YEAR = new Date().getFullYear();

type ButtonKey =
  | "motogp-full"
  | "motogp-events"
  | "motogp-riders"
  | "motogp-grid"
  | "standings-refresh"
  | "rookies-standings"
  | "motoamerica-standings"
  | "bsb-timing"
  | "wsbk-timing"
  | "f1-timing"
  | "rookies-timing"
  | "motoamerica-timing"
  | "scrape-bsb"
  | "scrape-wsbk"
  | "wsbk-riders"
  | "scrape-f1"
  | "scrape-speedway"
  | "scrape-gtwce"
  | "scrape-iomtt"
  | "wec-timing"
  | "scrape-wec"
  | "scrape-nls"
  | "scrape-rookiescup"
  | "scrape-all"
  | "motogp-results";

const ACTIONS: { key: ButtonKey; label: string; path: string; hint: string }[] =
  [
    {
      key: "motogp-full",
      label: "Full Data Sync",
      path: "/admin/sync",
      hint: "Calendars, riders, grids, results and new championship standings",
    },
    {
      key: "motogp-events",
      label: "MotoGP Events",
      path: "/admin/sync/events",
      hint: "motogp:events-sync",
    },
    {
      key: "motogp-riders",
      label: "MotoGP Riders",
      path: "/admin/sync/riders",
      hint: "motogp:riders-sync",
    },
    {
      key: "motogp-grid",
      label: "MotoGP / Moto2 / Moto3 Grids",
      path: "/admin/sync/grid",
      hint: "motogp:grid-sync",
    },
    {
      key: "motogp-results",
      label: "MotoGP / Moto2 / Moto3 Results",
      path: "/admin/sync/results",
      hint: "motogp:results-sync",
    },
    {
      key: "standings-refresh",
      label: "MotoGP / Moto2 / Moto3 Standings",
      path: "/admin/sync/standings",
      hint: "Whole season · riders, teams and constructors · all three classes · hourly around race weekends, daily between events and after new race results",
    },
    {
      key: "rookies-standings",
      label: "Rookies Cup Standings",
      path: "/admin/sync/rookiescup-standings",
      hint: "Whole season · hourly around race weekends, daily between events",
    },
    {
      key: "motoamerica-standings",
      label: "MotoAmerica Standings",
      path: "/admin/sync/motoamerica-standings",
      hint: "Whole season · all 8 classes · daily until calendar coverage is available",
    },
    { key: "f1-timing", label: "F1 Results, Grids & Standings", path: "/admin/sync/f1-timing", hint: "Whole season · races and sprints · hourly around race weekends, daily between events" },
    { key: "wsbk-timing", label: "WorldSBK / Support Timing", path: "/admin/sync/wsbk-timing", hint: "Full season results, published grids and championship standings · all four classes · hourly around race weekends, daily between events" },
    { key: "rookies-timing", label: "Rookies Cup Results", path: "/admin/sync/rookies-timing", hint: "Full season published race classifications · hourly around race weekends, daily between events" },
    { key: "motoamerica-timing", label: "MotoAmerica Results & Grids", path: "/admin/sync/motoamerica-timing", hint: "Published race reports and grids · completed event dates only · seven classes; Superbike Cup standings remain separate" },
    { key: "bsb-timing", label: "BSB / Support Timing", path: "/admin/sync/bsb-timing", hint: "Full season grids, race results and standings, including BMW heats, LCQ, Sprint and Main, plus British Sidecar crews at four BSB meetings · hourly around race weekends, daily between events" },
    { key: "scrape-bsb", label: "BSB", path: "/admin/scrape/bsb", hint: "scrape:bsb" },
    {
      key: "scrape-wsbk",
      label: "WSBK Calendar",
      path: "/admin/scrape/wsbk",
      hint: "scrape:wsbk",
    },
    {
      key: "wsbk-riders",
      label: "WSBK Riders",
      path: "/admin/sync/wsbk-riders",
      hint: "sync:wsbk-riders",
    },
    { key: "scrape-f1", label: "F1", path: "/admin/scrape/f1", hint: "scrape:f1" },
    {
      key: "scrape-speedway",
      label: "Speedway",
      path: "/admin/scrape/speedway",
      hint: "scrape:speedway",
    },
    {
      key: "scrape-gtwce",
      label: "GT WC Europe",
      path: "/admin/scrape/gtwce",
      hint: "scrape:gtwce",
    },
    {
      key: "scrape-iomtt",
      label: "Isle of Man TT",
      path: "/admin/scrape/iomtt",
      hint: "scrape:iomtt",
    },
    {
      key: "wec-timing",
      label: "FIA WEC Timing",
      path: "/admin/sync/wec-timing",
      hint: "timing:wec · Whole-season official race results and published starting grids · car entries and published drivers",
    },
    {
      key: "scrape-wec",
      label: "FIA WEC Calendar",
      path: "/admin/scrape/wec",
      hint: "scrape:wec · Official session times and Prologue tests · calendar only",
    },
    {
      key: "scrape-nls",
      label: "NLS",
      path: "/admin/scrape/nls",
      hint: "scrape:nls",
    },
    {
      key: "scrape-rookiescup",
      label: "Rookies Cup",
      path: "/admin/scrape/rookiescup",
      hint: "scrape:rookiescup",
    },
    {
      key: "scrape-all",
      label: "Scrape All",
      path: "/admin/scrape/all",
      hint: "bsb + wsbk + f1 + speedway + gtwce + iomtt + nls + wec + rookiescup",
    },
  ];

export default function AdminPage() {
  const { isAdmin, isAuthenticated, isLoading, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [year, setYear] = useState(CURRENT_YEAR);
  const [running, setRunning] = useState<Set<ButtonKey>>(new Set());
  const [lastResult, setLastResult] = useState<Record<string, string>>({});
  const [jobs, setJobs] = useState<JobRun[]>([]);
  const [recent, setRecent] = useState<JobRun[]>([]);
  const [jobsError, setJobsError] = useState("");
  const [polling, setPolling] = useState<PollingResponse | null>(null);
  const [pollingLoading, setPollingLoading] = useState(false);
  const [pollingError, setPollingError] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Redirect to login only if unauthenticated — avoids a loop if isAdmin
  // hasn't resolved yet or the user lacks the admin role.
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(
        buildPathWithReturnTo("/login", getCurrentPath(pathname, searchParams)),
      );
    }
  }, [isAuthenticated, isLoading, pathname, router, searchParams]);

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const loadPolling = useCallback(async () => {
    setPollingLoading(true);
    try {
      const res = await fetchWithAuth("/admin/polling");
      if (!res.ok) throw new Error("Polling status unavailable");
      const data: PollingResponse = await res.json();
      if (!data.ok || !Array.isArray(data.jobs) || !data.checkedAt) throw new Error("Invalid polling status");
      setPolling(data);
      setPollingError("");
    } catch {
      setPollingError("Unable to load planned sync times.");
    } finally {
      setPollingLoading(false);
    }
  }, []);

  const loadJobs = useCallback(async () => {
    void loadPolling();
    setJobsError("");
    try {
      const res = await fetchWithAuth("/admin/jobs");
      const data: JobsResponse = await res.json();
      if (!res.ok) throw new Error("Failed to load jobs");
      setJobs(data.jobs);
      setRecent(data.recent);
    } catch {
      setJobsError("Failed to load job status");
    }
  }, [loadPolling]);

  useEffect(() => {
    if (isAdmin) void loadJobs();
  }, [isAdmin, loadJobs]);

  const runAction = useCallback(
    async (key: ButtonKey, path: string, label: string) => {
      setRunning((prev) => new Set(prev).add(key));
      setLastResult((prev) => ({ ...prev, [key]: "running" }));

      try {
        const params = new URLSearchParams({year:String(year)});
        const res = await fetchWithAuth(`${path}?${params}`, {
          method: "POST",
        });
        const data = await res.json();
        if (!res.ok || (["bsb-timing","wsbk-timing","f1-timing","rookies-timing","motoamerica-timing","wec-timing"].includes(key) && (data.job?.status !== "success" || !(data.job?.meta?.snapshotsWritten > 0)))) {
          const msg = data.error ?? data.message ?? res.status;
          showToast(`${label} failed: ${msg}`, false);
          setLastResult((prev) => ({ ...prev, [key]: "failed" }));
        } else {
          showToast(["bsb-timing","wsbk-timing","f1-timing","rookies-timing","motoamerica-timing","wec-timing"].includes(key) ? `${label}: ${data.job.meta.snapshotsWritten} snapshots written, ${data.job.meta.resultRows} results, ${data.job.meta.gridRows ?? 0} grid rows` : `${label} completed (${year})`, true);
          setLastResult((prev) => ({ ...prev, [key]: "ok" }));
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Error";
        if (msg !== "Session expired") showToast(`${label}: ${msg}`, false);
        setLastResult((prev) => ({ ...prev, [key]: "failed" }));
      } finally {
        void loadJobs();
        setRunning((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [year, loadJobs, showToast]
  );

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (isLoading || !isAuthenticated || !isAdmin) return null;

  return (
    <div className={style.page}>
      <header className={style.header}>
        <div>
          <h1 className={style.title}>Admin</h1>
          <p className={style.subtitle}>
            Signed in as <strong>{user?.displayName ?? user?.email}</strong>
          </p>
        </div>
      </header>

      {/* Year picker */}
      <div className={style.yearRow}>
        <label htmlFor="year-input">Year</label>
        <input
          id="year-input"
          type="number"
          value={year}
          min={2020}
          max={2030}
          onChange={(e) => setYear(Number(e.target.value))}
          className={style.yearInput}
        />
      </div>

      {/* Action buttons */}
      <section className={style.section}>
        <h2 className={style.sectionTitle}>Sync &amp; Scrape</h2>
        <div className={style.grid}>
          {ACTIONS.map(({ key, label, path, hint }) => {
            const isRunning = running.has(key);
            const result = lastResult[key];
            return (
              <button
                key={key}
                className={`${style.actionBtn} ${key === "scrape-all" ? style.wide : ""}`}
                onClick={() => runAction(key, path, label)}
                disabled={isRunning}
              >
                <span className={style.btnLabel}>
                  {isRunning && <span className={style.spinner} />}
                  {label}
                </span>
                <span className={style.btnHint}>
                  {result === "ok" && "✓ Done"}
                  {result === "failed" && "✗ Failed"}
                  {result === "running" && "Running…"}
                  {!result && hint}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* User management */}
      <UserLookup showToast={showToast} />

      <PollingSchedule data={polling} error={pollingError} loading={pollingLoading} onRefresh={loadPolling} />

      {/* Job status */}
      <section className={style.section}>
        <div className={style.sectionHeader}>
          <h2 className={style.sectionTitle}>Latest Job Status</h2>
          <button className={style.refreshBtn} onClick={loadJobs}>
            Refresh
          </button>
        </div>
        {jobsError ? (
          <p className={style.errorText}>{jobsError}</p>
        ) : (
          <JobTable runs={jobs} cols={5} />
        )}
      </section>

      {/* Recent runs */}
      <section className={style.section}>
        <h2 className={style.sectionTitle}>Recent Runs</h2>
        <JobTable runs={recent} cols={4} />
      </section>

      {/* Toast */}
      {toast && (
        <div role={toast.ok ? "status" : "alert"} className={`${style.toast} ${toast.ok ? style.toastOk : style.toastError}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
