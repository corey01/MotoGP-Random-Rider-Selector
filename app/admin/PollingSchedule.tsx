import style from "./Admin.module.scss";

export interface PollingJob {
  jobName: string;
  series: string;
  year: number;
  calendar?: boolean;
  mode: "race-weekend" | "quiet";
  intervalMs: number;
  effectiveIntervalMs?: number;
  isRunning?: boolean;
  isStalled?: boolean;
  calendarAvailable: boolean;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  lastStatus: string | null;
  lastError: string | null;
  nextCheckAt: string | null;
}

export interface PollingResponse {
  ok: boolean;
  checkedAt: string;
  jobs: PollingJob[];
}

const SERIES_LABELS: Record<string, string> = {
  motogp: "MotoGP / Moto2 / Moto3",
  f1: "Formula 1",
  wsbk: "WorldSBK / Support",
  bsb: "British championships",
  rookiescup: "Rookies Cup",
  motoamerica: "MotoAmerica",
};

function timestamp(value: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : date.toLocaleString();
}

function intervalLabel(milliseconds: number) {
  if (milliseconds === 86_400_000) return "daily";
  if (milliseconds === 3_600_000) return "hourly";
  if (milliseconds < 3_600_000) return `every ${milliseconds / 60_000} minutes`;
  return `every ${milliseconds / 3_600_000} hours`;
}

export default function PollingSchedule({
  data, error, loading, onRefresh,
}: {
  data: PollingResponse | null;
  error: string;
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <section className={style.section} aria-labelledby="polling-title" aria-busy={loading}>
      <div className={style.sectionHeader}>
        <h2 id="polling-title" className={style.sectionTitle}>Automatic Sync Schedule</h2>
        <button type="button" className={style.refreshBtn} disabled={loading} onClick={onRefresh}>
          {loading ? "Refreshing…" : "Refresh schedule"}
        </button>
      </div>
      <p className={style.subtitle}>Automatic checks cover the current season and use each series’ calendar, including the day before and two days after a round. Data imports run daily between events; calendars have their own intervals. Manual syncs run immediately for the year selected above.</p>
      {error && <p role="alert" className={style.errorText}>{error}{data && " The schedule below shows the last retrieved status."}</p>}
      {data && <p className={style.subtitle}>Status retrieved: {timestamp(data.checkedAt)}. All times are local to your device.</p>}
      {!data && loading && <p role="status" className={style.empty}>Loading automatic sync schedule…</p>}
      {data && data.jobs.length === 0 && <p className={style.empty}>No automatic sync jobs reported.</p>}
      <div className={style.pollingGrid}>
        {data?.jobs.map(job => {
          const running = job.isRunning ?? job.lastStatus === "running";
          const failed = job.isStalled || job.lastStatus === "error" || job.lastStatus === "failed";
          const status = job.isStalled ? "Previous import interrupted" : running ? "Running" : failed ? "Last attempt failed" : job.lastStatus === "success" ? "Last attempt succeeded" : "Awaiting first attempt";
          return (
            <article className={style.pollingCard} key={job.jobName}>
              <h3>{SERIES_LABELS[job.series] ?? job.series} · {job.year}</h3>
              <code>{job.jobName}</code>
              <p>{job.calendar ? "Calendar" : "Data"} · {job.mode === "race-weekend" ? "Race weekend" : "Between events"} · {intervalLabel(job.intervalMs)}</p>
              <p className={`${style.badge} ${style[running ? "running" : failed ? "failed" : job.lastStatus === "success" ? "success" : "pending"]}`}>{status}</p>
              {!job.calendarAvailable && <p>No calendar available. Using the quiet schedule.</p>}
              <dl>
                <dt>Last attempt</dt><dd>{timestamp(job.lastAttemptAt)}</dd>
                <dt>Last success</dt><dd>{timestamp(job.lastSuccessAt)}</dd>
                <dt>Next check</dt><dd>{running ? "After the current import finishes" : timestamp(job.nextCheckAt)}</dd>
              </dl>
              {job.lastError && <p className={style.errorText}>{job.lastError}</p>}
              {failed && <p>Failed imports retry {intervalLabel(job.effectiveIntervalMs ?? Math.min(job.intervalMs, job.mode === "race-weekend" ? 3_600_000 : 21_600_000))}.</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
