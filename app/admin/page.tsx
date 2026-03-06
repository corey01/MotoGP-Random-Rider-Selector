"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuthJson } from "@/utils/auth";
import { useAuth } from "../_components/AuthProvider";
import styles from "./page.module.scss";

type AdminJobRun = {
  id: number;
  jobName: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  errorMessage: string | null;
  meta?: Record<string, unknown> | null;
};

type AdminJobsResponse = {
  ok: boolean;
  jobs: AdminJobRun[];
  recent: AdminJobRun[];
};

type AdminJobAction = {
  key: string;
  label: string;
  hint: string;
  path: string;
};

const ADMIN_JOB_ACTIONS: AdminJobAction[] = [
  {
    key: "motogp-full-sync",
    label: "Sync MotoGP (Full)",
    hint: "Runs season + events + riders sync",
    path: "/admin/sync",
  },
  {
    key: "motogp-events-sync",
    label: "Sync MotoGP Events",
    hint: "Refreshes sessions and rounds",
    path: "/admin/sync/events",
  },
  {
    key: "motogp-riders-sync",
    label: "Sync MotoGP Riders",
    hint: "Refreshes rider roster",
    path: "/admin/sync/riders",
  },
  {
    key: "scrape-f1",
    label: "Scrape F1",
    hint: "Fetches Formula 1 calendar",
    path: "/admin/scrape/f1",
  },
  {
    key: "scrape-bsb",
    label: "Scrape BSB",
    hint: "Scrapes British Superbike sessions",
    path: "/admin/scrape/bsb",
  },
  {
    key: "scrape-wsbk",
    label: "Scrape WSBK",
    hint: "Scrapes WorldSBK sessions",
    path: "/admin/scrape/wsbk",
  },
  {
    key: "scrape-speedway",
    label: "Scrape Speedway",
    hint: "Scrapes Speedway GP sessions",
    path: "/admin/scrape/speedway",
  },
  {
    key: "scrape-all",
    label: "Scrape All Series",
    hint: "Runs all non-MotoGP scrapers",
    path: "/admin/scrape/all",
  },
];

const seasonYearDefault = Number(
  process.env.NEXT_PUBLIC_MOTOGP_SEASON_YEAR || new Date().getFullYear()
);

const formatDateTime = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB");
};

const formatDuration = (ms: number | null) => {
  if (typeof ms !== "number") return "-";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
};

const statusClassName = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === "running") return styles.statusRunning;
  if (normalized === "success") return styles.statusSuccess;
  if (normalized === "error") return styles.statusError;
  return styles.statusUnknown;
};

export default function AdminPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated, isAdmin } = useAuth();

  const [yearInput, setYearInput] = useState(String(seasonYearDefault));
  const [jobs, setJobs] = useState<AdminJobRun[]>([]);
  const [recent, setRecent] = useState<AdminJobRun[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [runInFlight, setRunInFlight] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const parsedYear = useMemo(() => {
    const parsed = Number.parseInt(yearInput, 10);
    return Number.isFinite(parsed) ? parsed : seasonYearDefault;
  }, [yearInput]);

  const loadJobs = useCallback(async () => {
    setJobsLoading(true);
    setError(null);
    try {
      const payload = await fetchWithAuthJson<AdminJobsResponse>("/admin/jobs");
      setJobs(payload.jobs || []);
      setRecent(payload.recent || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load job status");
    } finally {
      setJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login?redirect=%2Fadmin");
      return;
    }

    if (!isAdmin) {
      router.replace("/");
      return;
    }

    void loadJobs();
  }, [isAdmin, isAuthenticated, isLoading, loadJobs, router]);

  const runJob = async (action: AdminJobAction) => {
    setError(null);
    setSuccessMessage(null);
    setRunInFlight(action.key);

    try {
      const endpoint = `${action.path}?year=${encodeURIComponent(String(parsedYear))}`;
      await fetchWithAuthJson<{ ok: boolean; year: number }>(endpoint, {
        method: "POST",
      });
      setSuccessMessage(`${action.label} queued for ${parsedYear}.`);
      await loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to run ${action.label}`);
    } finally {
      setRunInFlight(null);
    }
  };

  if (isLoading || !isAuthenticated || !isAdmin) {
    return (
      <section className={styles.adminPage}>
        <p className={styles.hint}>Checking access...</p>
      </section>
    );
  }

  return (
    <section className={styles.adminPage}>
      <div className={styles.titleRow}>
        <div>
          <h2 className={styles.title}>Admin</h2>
          <p className={styles.subtitle}>
            Run sync/scrape jobs and monitor execution status from the UI.
          </p>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.panel}>
          <h3 className={styles.panelTitle}>Target Year</h3>
          <label>
            <span className={styles.inputLabel}>Season Year</span>
            <input
              className={styles.yearInput}
              type="number"
              min={2000}
              max={2100}
              value={yearInput}
              onChange={(event) => setYearInput(event.target.value)}
            />
          </label>
        </div>

        <div className={styles.panel}>
          <h3 className={styles.panelTitle}>Run Jobs</h3>
          <div className={styles.actionsGrid}>
            {ADMIN_JOB_ACTIONS.map((action) => (
              <button
                key={action.key}
                className={styles.actionButton}
                type="button"
                disabled={Boolean(runInFlight)}
                onClick={() => void runJob(action)}
              >
                <span className={styles.actionLabel}>
                  {runInFlight === action.key ? "Running..." : action.label}
                </span>
                <span className={styles.actionHint}>{action.hint}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {successMessage && <p className={`${styles.statusLine} ${styles.success}`}>{successMessage}</p>}
      {error && <p className={`${styles.statusLine} ${styles.error}`}>{error}</p>}

      <div className={styles.panel}>
        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.refreshButton}
            onClick={() => void loadJobs()}
            disabled={jobsLoading}
          >
            {jobsLoading ? "Refreshing..." : "Refresh Status"}
          </button>
        </div>

        <h3 className={styles.panelTitle}>Latest By Job</h3>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Job</th>
                <th>Status</th>
                <th>Started</th>
                <th>Completed</th>
                <th>Duration</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={6}>No job history available.</td>
                </tr>
              )}
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>{job.jobName}</td>
                  <td>
                    <span className={`${styles.statusPill} ${statusClassName(job.status)}`}>
                      {job.status}
                    </span>
                  </td>
                  <td>{formatDateTime(job.startedAt)}</td>
                  <td>{formatDateTime(job.completedAt)}</td>
                  <td>{formatDuration(job.durationMs)}</td>
                  <td>{job.errorMessage || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.panel}>
        <h3 className={styles.panelTitle}>Recent Runs</h3>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Job</th>
                <th>Status</th>
                <th>Started</th>
                <th>Completed</th>
                <th>Duration</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr>
                  <td colSpan={6}>No recent runs available.</td>
                </tr>
              )}
              {recent.map((job) => (
                <tr key={`recent-${job.id}`}>
                  <td>{job.jobName}</td>
                  <td>
                    <span className={`${styles.statusPill} ${statusClassName(job.status)}`}>
                      {job.status}
                    </span>
                  </td>
                  <td>{formatDateTime(job.startedAt)}</td>
                  <td>{formatDateTime(job.completedAt)}</td>
                  <td>{formatDuration(job.durationMs)}</td>
                  <td>{job.errorMessage || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
