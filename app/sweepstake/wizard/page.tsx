"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/_components/AuthProvider";
import {
  fetchGroups,
  fetchGroup,
  createSweepstake,
  fetchSweepstakeDetail,
  assignRiders,
  addGuest,
  removeGuest,
  type GroupWithRole,
  type GroupMember,
  type GroupGuest,
  type SweepstakeAssignment,
} from "@/utils/groups";
import {
  fetchCalendarEvents,
  type ApiCalendarEvent,
} from "@/utils/getCalendarData";
import { getRiderData, fetchGrid } from "@/utils/getRiderData";
import type { GridEntry } from "@/utils/getRiderData";
import type { Rider } from "@/models/rider";
import RiderCard from "@/app/_components/RiderCard";
import { buildPathWithReturnTo, getCurrentPath } from "@/utils/returnTo";
import style from "./SweepstakeWizard.module.scss";

type Round = { id: number; name: string; place: string | null; country: string | null };

function deriveRounds(events: ApiCalendarEvent[]): Round[] {
  const seen = new Set<number>();
  const rounds: Round[] = [];
  for (const ev of events) {
    if (!seen.has(ev.round.id)) {
      seen.add(ev.round.id);
      rounds.push({
        id: ev.round.id,
        name: ev.round.name,
        place: ev.round.circuit ?? null,
        country: ev.round.country ?? null,
      });
    }
  }
  return rounds;
}

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS = ["Setup", "Participants", "Riders", "Results"];

function WizardContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const urlGroupId = searchParams.get("groupId") ? Number(searchParams.get("groupId")) : null;
  const urlRoundId = searchParams.get("roundId") ? Number(searchParams.get("roundId")) : null;
  const urlSweepstakeId = searchParams.get("sweepstakeId") ? Number(searchParams.get("sweepstakeId")) : null;

  const year = Number(process.env.NEXT_PUBLIC_MOTOGP_SEASON_YEAR || new Date().getFullYear());

  // ── Core wizard state ────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>(1);
  const [initialising, setInitialising] = useState(true);
  const [initError, setInitError] = useState("");

  // Step 1
  const [groups, setGroups] = useState<GroupWithRole[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(urlGroupId);
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(urlRoundId);
  const [sweepstakeId, setSweepstakeId] = useState<number | null>(urlSweepstakeId);

  // Step 2
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [guests, setGuests] = useState<GroupGuest[]>([]);
  const [guestName, setGuestName] = useState("");
  const [addingGuest, setAddingGuest] = useState(false);
  const [guestError, setGuestError] = useState("");

  // Step 3
  const [allRiders, setAllRiders] = useState<Rider[]>([]);
  const [riderPool, setRiderPool] = useState<Rider[]>([]);
  const [removedRiderIds, setRemovedRiderIds] = useState<Set<string>>(new Set());
  const [gridEntries, setGridEntries] = useState<GridEntry[]>([]);
  const [gridStatus, setGridStatus] = useState<'idle' | 'loading' | 'ready' | 'unavailable'>('idle');

  // Step 1
  const [step1Error, setStep1Error] = useState("");

  // Step 4
  const [assignments, setAssignments] = useState<SweepstakeAssignment[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(
        buildPathWithReturnTo("/login", getCurrentPath(pathname, searchParams)),
      );
    }
  }, [isLoading, isAuthenticated, pathname, router, searchParams]);

  // ── Initialise wizard ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    const init = async () => {
      try {
        // Always load group list and calendar for step 1
        const [ownedGroups, events, riderData] = await Promise.all([
          fetchGroups(),
          fetchCalendarEvents({ year, series: ["motogp"], types: ["RACE"] }),
          getRiderData(),
        ]);

        const ownedOnly = ownedGroups.filter((g) => g.role === "owner");
        setGroups(ownedOnly);
        setRounds(deriveRounds(events));
        setAllRiders(riderData.standardRiders);
        setRiderPool(riderData.standardRiders);

        // Editing an existing sweepstake — load its data and jump to step 3
        if (urlSweepstakeId && urlGroupId) {
          const detail = await fetchSweepstakeDetail(urlGroupId, urlSweepstakeId);
          setSelectedGroupId(urlGroupId);
          setSelectedRoundId(detail.roundId);
          setSweepstakeId(urlSweepstakeId);

          const groupDetail = await fetchGroup(urlGroupId);
          setMembers(groupDetail.members);
          setGuests(groupDetail.guests);
          setAssignments(detail.assignments);

          setStep(3);
          return;
        }

        // Group pre-filled — load its members and jump to step 2 if round is also known
        if (urlGroupId) {
          const groupDetail = await fetchGroup(urlGroupId);
          setMembers(groupDetail.members);
          setGuests(groupDetail.guests);

          if (urlRoundId) {
            // Both known — skip to step 2
            setStep(2);
          }
        }
      } catch (e) {
        setInitError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setInitialising(false);
      }
    };

    void init();
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Step 1 → 2 ───────────────────────────────────────────────────────────────
  const handleSetupNext = async () => {
    if (!selectedGroupId || !selectedRoundId) return;
    if (members.length === 0) {
      // Load members if we don't have them yet (group was selected in step 1)
      try {
        const groupDetail = await fetchGroup(selectedGroupId);
        setMembers(groupDetail.members);
        setGuests(groupDetail.guests);
      } catch {
        // ignore — will show empty list
      }
    }
    setStep(2);
  };

  // ── Step 2 → 3 ───────────────────────────────────────────────────────────────
  const handleParticipantsNext = () => {
    if (selectedRoundId) {
      setGridStatus('loading');
      fetchGrid(selectedRoundId, year)
        .then((r) => { setGridEntries(r.grid); setGridStatus('ready'); })
        .catch(() => setGridStatus('unavailable'));
    }
    setStep(3);
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !selectedGroupId) return;
    setAddingGuest(true);
    setGuestError("");
    try {
      const guest = await addGuest(selectedGroupId, guestName.trim());
      setGuests((prev) => [...prev, guest]);
      setGuestName("");
    } catch (e) {
      setGuestError(e instanceof Error ? e.message : "Failed to add guest");
    } finally {
      setAddingGuest(false);
    }
  };

  const handleRemoveGuest = async (guest: GroupGuest) => {
    if (!selectedGroupId) return;
    try {
      await removeGuest(selectedGroupId, guest.id);
      setGuests((prev) => prev.filter((g) => g.id !== guest.id));
    } catch {
      // ignore
    }
  };

  // ── Step 3: rider pool ────────────────────────────────────────────────────────
  const handleRemoveRider = (rider: Rider) => {
    setRiderPool((prev) => prev.filter((r) => r.id !== rider.id));
    setRemovedRiderIds((prev) => { const s = new Set(prev); s.add(rider.id); return s; });
  };

  const handleRestoreRider = (rider: Rider) => {
    setRiderPool((prev) => [...prev, rider].sort((a, b) => (a.number || 999) - (b.number || 999)));
    setRemovedRiderIds((prev) => { const s = new Set(prev); s.delete(rider.id); return s; });
  };

  const handleTopN = (n: number) => {
    const gridIds = gridEntries
      .map((e) => e.rider?.id ?? e.rider?.riders_api_uuid)
      .filter(Boolean) as string[];
    const inGrid = allRiders.filter((r) => gridIds.includes(r.id));
    inGrid.sort((a, b) => gridIds.indexOf(a.id) - gridIds.indexOf(b.id));
    setRiderPool(inGrid.slice(0, n));
    setRemovedRiderIds(new Set(allRiders.filter((r) => !inGrid.slice(0, n).find((g) => g.id === r.id)).map((r) => r.id)));
  };

  const handleResetRiders = () => {
    setRiderPool(allRiders);
    setRemovedRiderIds(new Set());
  };

  // ── Step 3 → 4: generate ─────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!selectedGroupId || !selectedRoundId) return;
    setGenerating(true);
    setGenerateError("");
    try {
      let sid = sweepstakeId;
      if (!sid) {
        // Create sweepstake first
        const created = await createSweepstake(selectedGroupId, selectedRoundId);
        sid = created.id;
        setSweepstakeId(sid);
      }
      const riderIds = riderPool.map((r) => r.dbId);
      const result = await assignRiders(selectedGroupId, sid, riderIds);
      setAssignments(result);
      setStep(4);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to generate";
      if (msg.toLowerCase().includes("already exists")) {
        setStep1Error(msg);
        setStep(1);
      } else {
        setGenerateError(msg);
      }
    } finally {
      setGenerating(false);
    }
  };

  const totalParticipants = members.length + guests.length;
  const canGenerate = totalParticipants > 0 && riderPool.length >= totalParticipants;

  if (!isAuthenticated && !isLoading) return null;
  if (initialising) return <div className={style.loading}>Loading…</div>;
  if (initError) return <div className={style.loading}>{initError}</div>;

  const backHref = selectedGroupId
    ? `/groups/detail?id=${selectedGroupId}`
    : "/groups";

  return (
    <div className={style.page}>
      <div className={style.topBar}>
        <Link href={backHref} className={style.back}>
          ← {selectedGroupId ? "Group" : "Groups"}
        </Link>
      </div>

      {/* Step indicator */}
      <div className={style.steps}>
        {STEP_LABELS.map((label, i) => {
          const s = (i + 1) as Step;
          return (
            <div
              key={s}
              className={[
                style.stepDot,
                step === s ? style.stepDotActive : "",
                step > s ? style.stepDotDone : "",
              ].join(" ")}
            >
              {label}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Setup ─────────────────────────────────────────────────────── */}
      {step === 1 && (
        <div>
          {!urlGroupId && (
            <div className={style.field}>
              <label>Group</label>
              {groups.length === 0 ? (
                <p className={style.hint}>
                  You need to own a group to create a sweepstake.{" "}
                  <Link href="/groups">Create one</Link>.
                </p>
              ) : (
                <div className={style.groupList}>
                  {groups.map((g) => (
                    <label
                      key={g.id}
                      className={[
                        style.groupOption,
                        selectedGroupId === g.id ? style.selected : "",
                      ].join(" ")}
                    >
                      <input
                        type="radio"
                        name="group"
                        value={g.id}
                        checked={selectedGroupId === g.id}
                        onChange={() => { setSelectedGroupId(g.id); setStep1Error(""); }}
                      />
                      {g.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {!urlRoundId && (
            <div className={style.field}>
              <label htmlFor="wizard-round">Race Round</label>
              <select
                id="wizard-round"
                value={selectedRoundId ?? ""}
                onChange={(e) => {
                  setSelectedRoundId(e.target.value ? Number(e.target.value) : null);
                  setStep1Error("");
                }}
              >
                <option value="">— Select a round —</option>
                {rounds.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}{r.country ? ` · ${r.country}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {urlGroupId && urlRoundId && (
            <div className={style.field}>
              <p>
                <strong>
                  {rounds.find((r) => r.id === urlRoundId)?.name ?? `Round #${urlRoundId}`}
                </strong>
                {" — "}
                {groups.find((g) => g.id === urlGroupId)?.name ?? `Group #${urlGroupId}`}
              </p>
            </div>
          )}

          {step1Error && <p className={style.error}>{step1Error}</p>}

          <div className={style.actions}>
            <button
              className={style.nextBtn}
              disabled={!selectedGroupId || !selectedRoundId}
              onClick={handleSetupNext}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Participants ──────────────────────────────────────────────── */}
      {step === 2 && (
        <div>
          <p className={style.sectionTitle}>Members ({members.length})</p>
          <ul className={style.memberList}>
            {members.map((m) => (
              <li key={m.id} className={style.memberItem}>
                <span>{m.displayName}</span>
                <span className={style.memberRole}>{m.role}</span>
              </li>
            ))}
          </ul>

          <p className={style.sectionTitle} style={{ marginTop: "1.25rem" }}>
            Guests ({guests.length})
          </p>
          {guests.length > 0 && (
            <ul className={style.memberList}>
              {guests.map((g) => (
                <li key={g.id} className={style.memberItem}>
                  <span>{g.name}</span>
                  <button
                    className={style.removeMemberBtn}
                    onClick={() => handleRemoveGuest(g)}
                    title="Remove guest"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleAddGuest} className={style.inlineForm}>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Add guest name"
            />
            <button type="submit" disabled={addingGuest || !guestName.trim()}>
              {addingGuest ? "Adding…" : "Add"}
            </button>
          </form>
          {guestError && <p className={style.fieldError}>{guestError}</p>}

          <div className={style.actions}>
            <button className={style.backBtn} onClick={() => setStep(1)}>
              ←
            </button>
            <button
              className={style.nextBtn}
              disabled={totalParticipants === 0}
              onClick={handleParticipantsNext}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Rider Pool ────────────────────────────────────────────────── */}
      {step === 3 && (
        <div>
          <div className={style.riderPoolHeader}>
            <p className={style.sectionTitle}>
              Rider Pool ({riderPool.length})
            </p>
            <div className={style.riderPoolActions}>
              <button className={style.topNBtn} type="button" onClick={() => handleTopN(10)} disabled={gridStatus !== 'ready'}>
                Top 10
              </button>
              <button className={style.topNBtn} type="button" onClick={() => handleTopN(15)} disabled={gridStatus !== 'ready'}>
                Top 15
              </button>
              {gridStatus === 'unavailable' && (
                <span className={style.gridUnavailable}>Grid order not available yet</span>
              )}
              {removedRiderIds.size > 0 && (
                <button className={style.resetBtn} type="button" onClick={handleResetRiders}>
                  Restore All
                </button>
              )}
            </div>
          </div>

          {removedRiderIds.size > 0 && (
            <div className={style.removedSection}>
              <p className={style.removedLabel}>
                Removed ({removedRiderIds.size}) — click to restore:
              </p>
              <div className={style.removedChips}>
                {allRiders
                  .filter((r) => removedRiderIds.has(r.id))
                  .map((r) => (
                    <button
                      key={r.id}
                      className={style.removedChip}
                      onClick={() => handleRestoreRider(r)}
                    >
                      {r.name} {r.surname}
                    </button>
                  ))}
              </div>
            </div>
          )}

          <div className={style.riderGrid}>
            {riderPool.map((rider) => (
              <RiderCard key={rider.id} rider={rider} removeEvent={handleRemoveRider} />
            ))}
          </div>

          {!canGenerate && totalParticipants > 0 && (
            <p className={style.fieldError}>
              Need at least {totalParticipants} riders (currently {riderPool.length})
            </p>
          )}

          {generateError && <p className={style.error}>{generateError}</p>}

          <div className={style.actions}>
            <button className={style.backBtn} onClick={() => setStep(2)}>
              ←
            </button>
            <button
              className={style.generateBtn}
              disabled={!canGenerate || generating}
              onClick={handleGenerate}
            >
              {generating
                ? "Generating…"
                : assignments.length > 0
                  ? "Regenerate"
                  : "Generate"}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Results ───────────────────────────────────────────────────── */}
      {step === 4 && (
        <div>
          <div className={style.resultsHeader}>
            <p className={style.sectionTitle}>Results ({assignments.length})</p>
            {sweepstakeId && (
              <Link
                href={`/sweepstake/results?id=${sweepstakeId}`}
                className={style.publicLink}
              >
                Public link →
              </Link>
            )}
          </div>

          <ul className={style.assignmentList}>
            {assignments.map((a) => (
              <li key={a.id} className={style.assignmentItem}>
                <span className={style.assignmentParticipant}>
                  {a.participantName}
                </span>
                <span className={style.assignmentRider}>{a.riderName}</span>
              </li>
            ))}
          </ul>

          <div className={style.actions}>
            <button className={style.backBtn} onClick={() => setStep(3)}>
              ← Edit
            </button>
            <Link
              href={backHref}
              className={style.nextBtn}
              style={{ textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              Done
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SweepstakeWizardPage() {
  return (
    <Suspense>
      <WizardContent />
    </Suspense>
  );
}
