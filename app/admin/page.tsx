"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/_components/AuthProvider";
import { fetchWithAuth } from "@/utils/auth";
import { buildPathWithReturnTo, getCurrentPath } from "@/utils/returnTo";
import style from "./Admin.module.scss";

// --- Types ---

type UserRole = "user" | "admin" | "legacy";

interface AdminUser {
  id: number;
  email: string;
  displayName: string;
  role: UserRole;
}

interface JobRun {
  id: string;
  jobName: string;
  status: "success" | "failed" | "running";
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
}

interface JobsResponse {
  ok: boolean;
  jobs: JobRun[];
  recent: JobRun[];
}

// --- Helpers ---

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function fmtDuration(start: string | null, end: string | null): string {
  if (!start || !end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// --- Components ---

function StatusBadge({ status }: { status: JobRun["status"] }) {
  return <span className={`${style.badge} ${style[status]}`}>{status}</span>;
}

function JobTable({ runs, cols }: { runs: JobRun[]; cols: number }) {
  if (!runs.length) {
    return (
      <p className={style.empty}>No runs yet</p>
    );
  }

  return (
    <div className={style.tableWrap}>
      <table className={style.table}>
        <thead>
          <tr>
            <th>Job</th>
            <th>Status</th>
            <th>Started</th>
            <th>Duration</th>
            {cols > 4 && <th>Error</th>}
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id}>
              <td><code>{run.jobName}</code></td>
              <td><StatusBadge status={run.status} /></td>
              <td>{fmtDate(run.startedAt)}</td>
              <td>{fmtDuration(run.startedAt, run.completedAt)}</td>
              {cols > 4 && (
                <td className={style.errorCell}>{run.errorMessage ?? ""}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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
  | "scrape-bsb"
  | "scrape-wsbk"
  | "scrape-f1"
  | "scrape-speedway"
  | "scrape-all"
  | "motogp-results";

const ACTIONS: { key: ButtonKey; label: string; path: string; hint: string }[] =
  [
    {
      key: "motogp-full",
      label: "MotoGP Full Sync",
      path: "/admin/sync",
      hint: "motogp:full-sync",
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
      label: "MotoGP Grid",
      path: "/admin/sync/grid",
      hint: "motogp:grid-sync",
    },
    {
      key: "motogp-results",
      label: "MotoGP Results",
      path: "/admin/sync/results",
      hint: "motogp:results-sync",
    },
    { key: "scrape-bsb", label: "BSB", path: "/admin/scrape/bsb", hint: "scrape:bsb" },
    {
      key: "scrape-wsbk",
      label: "WSBK",
      path: "/admin/scrape/wsbk",
      hint: "scrape:wsbk",
    },
    { key: "scrape-f1", label: "F1", path: "/admin/scrape/f1", hint: "scrape:f1" },
    {
      key: "scrape-speedway",
      label: "Speedway",
      path: "/admin/scrape/speedway",
      hint: "scrape:speedway",
    },
    {
      key: "scrape-all",
      label: "Scrape All",
      path: "/admin/scrape/all",
      hint: "bsb + wsbk + f1 + speedway",
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

  const loadJobs = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (isAdmin) void loadJobs();
  }, [isAdmin, loadJobs]);

  const runAction = useCallback(
    async (key: ButtonKey, path: string, label: string) => {
      setRunning((prev) => new Set(prev).add(key));
      setLastResult((prev) => ({ ...prev, [key]: "running" }));

      try {
        const res = await fetchWithAuth(`${path}?year=${year}`, {
          method: "POST",
        });
        const data = await res.json();
        if (!res.ok) {
          const msg = data.error ?? data.message ?? res.status;
          showToast(`${label} failed: ${msg}`, false);
          setLastResult((prev) => ({ ...prev, [key]: "failed" }));
        } else {
          showToast(`${label} completed (${year})`, true);
          setLastResult((prev) => ({ ...prev, [key]: "ok" }));
          void loadJobs();
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Error";
        if (msg !== "Session expired") showToast(`${label}: ${msg}`, false);
        setLastResult((prev) => ({ ...prev, [key]: "failed" }));
      } finally {
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
        <div className={`${style.toast} ${toast.ok ? style.toastOk : style.toastError}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
