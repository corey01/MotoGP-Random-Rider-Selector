import style from './Admin.module.scss';

type RoundOutcome = {
  roundId?: number;
  roundNumber?: number;
  subSeries?: string;
  status?: string;
  error?: string;
  resultRows?: number;
  gridRows?: number;
  standingsRows?: number;
  teamRows?: number;
  constructorRows?: number;
  unchanged?: boolean;
};

export interface JobRun {
  id: string | number;
  jobName: string;
  status: 'success' | 'error' | 'failed' | 'running' | 'skipped';
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  meta?: {
    year?: number;
    scope?: string;
    roundId?: number;
    subSeries?: string;
    snapshotsWritten?: number;
    gridRows?: number;
    resultRows?: number;
    standingsRows?: number;
    teamRows?: number;
    constructorRows?: number;
    results?: RoundOutcome[];
    riderClasses?: Array<{subSeries?: string; count?: number; error?: string}>;
  } | null;
}

const TIMING_JOBS = ['timing:bsb', 'timing:wsbk', 'timing:f1', 'timing:rookiescup', 'timing:motoamerica', 'timing:wec'];

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function fmtDuration(start: string | null, end: string | null): string {
  if (!start || !end) return '—';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

function roundLabel(entry: RoundOutcome): string {
  if (entry.roundNumber != null) return `Round ${entry.roundNumber}`;
  return entry.roundId != null ? `Round ID ${entry.roundId}` : 'Unknown round';
}

function outcomeDetail(entry: RoundOutcome, motoGP: boolean): string {
  if (entry.error) return `: ${entry.error}`;
  if (entry.status === 'awaiting_publication') return ': Awaiting official publication';
  if (entry.status !== 'success') return '';
  if (motoGP) return `: ${entry.teamRows ?? 0} team rows, ${entry.constructorRows ?? 0} constructor rows${entry.unchanged ? ' · Official standings unchanged' : ''}`;
  return `: ${entry.resultRows ?? 0} results, ${entry.gridRows ?? 0} grid rows, ${entry.standingsRows ?? 0} standings rows`;
}

function ImportDetails({run}: {run: JobRun}) {
  const meta = run.meta;
  const motoGP = run.jobName === 'motogp:standings-sync';
  if (!meta || (!motoGP && !TIMING_JOBS.includes(run.jobName))) return null;
  return <details className={style.timingSummary}>
    <summary>{meta.snapshotsWritten ?? 0} snapshots written · {motoGP
      ? `${meta.teamRows ?? 0} team rows · ${meta.constructorRows ?? 0} constructor rows`
      : `${meta.resultRows ?? 0} results · ${meta.gridRows ?? 0} grid rows · ${meta.standingsRows ?? 0} standings rows`}</summary>
    <p>Scope: {meta.scope ?? 'unknown'}{meta.year != null ? ` · Year ${meta.year}` : ''}{meta.roundId != null ? ` · Round ID ${meta.roundId}` : ''}{meta.subSeries ? ` · ${meta.subSeries}` : ''}</p>
    {motoGP && !!meta.riderClasses?.length && <>
      <p>Rider standings refresh</p>
      <ul>{meta.riderClasses.map((entry, index) => <li key={index}>{entry.subSeries ?? 'Unknown class'}: {entry.error ?? (entry.count != null ? `${entry.count} rider entries` : 'No rider count reported')}</li>)}</ul>
    </>}
    <ul>{meta.results?.map((entry, index) => <li key={index}>{roundLabel(entry)} · {entry.subSeries ?? 'all classes'} · {entry.status}{outcomeDetail(entry, motoGP)}</li>)}</ul>
  </details>;
}

export default function JobTable({runs, cols}: {runs: JobRun[]; cols: number}) {
  if (!runs.length) return <p className={style.empty}>No runs yet</p>;
  return <div className={style.tableWrap}>
    <table className={style.table}>
      <thead><tr><th>Job</th><th>Status</th><th>Started</th><th>Duration</th>{cols > 4 && <th>Error</th>}</tr></thead>
      <tbody>{runs.map(run => <tr key={run.id}>
        <td className={style.jobCell}><code>{run.jobName}</code>
          {run.errorMessage && <details className={style.timingSummary}>
            <summary>Error details</summary>
            <p className={style.jobError}>{run.errorMessage}</p>
          </details>}
          <ImportDetails run={run}/>
        </td>
        <td><span className={`${style.badge} ${style[run.status === 'error' ? 'failed' : run.status === 'skipped' ? 'pending' : run.status]}`}>{run.status}</span></td>
        <td>{fmtDate(run.startedAt)}</td><td>{fmtDuration(run.startedAt, run.completedAt)}</td>
        {cols > 4 && <td className={style.errorCell} title={run.errorMessage ?? undefined}>{run.errorMessage ?? ''}</td>}
      </tr>)}</tbody>
    </table>
  </div>;
}
