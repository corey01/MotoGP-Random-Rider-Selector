"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/_components/AuthProvider";
import {
  assignRiders,
  fetchGroup,
  inviteToGroup,
  updateGroup,
  addGuest,
  removeGuest,
  type GroupAssignment,
  type GroupDetail,
  type GroupGuest,
  type GroupGuestAssignment,
} from "@/utils/groups";
import {
  fetchCalendarEvents,
  type ApiCalendarEvent,
} from "@/utils/getCalendarData";
import { getRiderData } from "@/utils/getRiderData";
import type { Rider } from "@/models/rider";
import RiderCard from "@/app/_components/RiderCard";
import style from "./GroupDetail.module.scss";

type Round = { id: number; name: string; place: string | null };

function deriveRounds(events: ApiCalendarEvent[]): Round[] {
  const seen = new Set<number>();
  const rounds: Round[] = [];
  for (const ev of events) {
    if (!seen.has(ev.round.id)) {
      seen.add(ev.round.id);
      rounds.push({
        id: ev.round.id,
        name: ev.round.name,
        place: ev.round.country ?? null,
      });
    }
  }
  return rounds;
}

function GroupDetailContent() {
  const searchParams = useSearchParams();
  const groupId = Number(searchParams.get("id"));

  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [allRiders, setAllRiders] = useState<Rider[]>([]);
  const [riderPool, setRiderPool] = useState<Rider[]>([]);
  const [removedRiderIds, setRemovedRiderIds] = useState<Set<string>>(new Set());
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");

  const [inviteName, setInviteName] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  const [guestName, setGuestName] = useState("");
  const [addingGuest, setAddingGuest] = useState(false);
  const [guestError, setGuestError] = useState("");

  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");

  const [editRound, setEditRound] = useState(false);
  const [selectedRoundId, setSelectedRoundId] = useState<number | "">("");
  const [savingRound, setSavingRound] = useState(false);

  const year = Number(
    process.env.NEXT_PUBLIC_MOTOGP_SEASON_YEAR || new Date().getFullYear()
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !groupId) return;

    const load = async () => {
      try {
        const [groupDetail, events, riderData] = await Promise.all([
          fetchGroup(groupId),
          fetchCalendarEvents({ year, series: ["motogp"], types: ["RACE"] }),
          getRiderData(),
        ]);
        setDetail(groupDetail);
        setSelectedRoundId(groupDetail.group.roundId ?? "");
        setRounds(deriveRounds(events));
        setAllRiders(riderData.allRiders);
        setRiderPool(riderData.allRiders);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load group");
      } finally {
        setLoadingData(false);
      }
    };

    void load();
  }, [isAuthenticated, groupId, year]);

  const isOwner = detail?.membershipRole === "owner";

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim()) return;
    setInviting(true);
    setInviteError("");
    setInviteSuccess("");
    try {
      await inviteToGroup(groupId, inviteName.trim());
      setInviteSuccess(`Invite sent to "${inviteName.trim()}"`);
      setInviteName("");
      const refreshed = await fetchGroup(groupId);
      setDetail(refreshed);
    } catch (e) {
      setInviteError(e instanceof Error ? e.message : "Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    setAddingGuest(true);
    setGuestError("");
    try {
      const guest = await addGuest(groupId, guestName.trim());
      setDetail((prev) =>
        prev ? { ...prev, guests: [...prev.guests, guest] } : prev
      );
      setGuestName("");
    } catch (e) {
      setGuestError(e instanceof Error ? e.message : "Failed to add guest");
    } finally {
      setAddingGuest(false);
    }
  };

  const handleRemoveGuest = async (guest: GroupGuest) => {
    try {
      await removeGuest(groupId, guest.id);
      setDetail((prev) =>
        prev
          ? { ...prev, guests: prev.guests.filter((g) => g.id !== guest.id) }
          : prev
      );
    } catch {
      // ignore
    }
  };

  const handleRemoveRider = (rider: Rider) => {
    setRiderPool((prev) => prev.filter((r) => r.id !== rider.id));
    setRemovedRiderIds((prev) => { const s = new Set(prev); s.add(rider.id); return s; });
  };

  const handleRestoreRider = (rider: Rider) => {
    setRiderPool((prev) =>
      [...prev, rider].sort((a, b) => (a.number || 999) - (b.number || 999))
    );
    setRemovedRiderIds((prev) => {
      const next = new Set(prev);
      next.delete(rider.id);
      return next;
    });
  };

  const handleTopN = (n: number) => {
    setRiderPool(allRiders.slice(0, n));
    setRemovedRiderIds(new Set(allRiders.slice(n).map((r) => r.id)));
  };

  const handleResetRiders = () => {
    setRiderPool(allRiders);
    setRemovedRiderIds(new Set());
  };

  const handleAssign = async () => {
    setAssigning(true);
    setAssignError("");
    try {
      const riderIds = riderPool.map((r) => r.dbId);
      await assignRiders(groupId, riderIds);
      const refreshed = await fetchGroup(groupId);
      setDetail(refreshed);
    } catch (e) {
      setAssignError(
        e instanceof Error ? e.message : "Failed to assign riders"
      );
    } finally {
      setAssigning(false);
    }
  };

  const handleSaveRound = async () => {
    setSavingRound(true);
    try {
      const updated = await updateGroup(groupId, {
        roundId: selectedRoundId !== "" ? selectedRoundId : null,
      });
      setDetail((prev) =>
        prev
          ? { ...prev, group: { ...prev.group, roundId: updated.roundId } }
          : prev
      );
      setEditRound(false);
    } catch {
      // ignore
    } finally {
      setSavingRound(false);
    }
  };

  if (isLoading || (!isAuthenticated && !isLoading)) return null;
  if (loadingData) return <div className={style.loading}>Loading…</div>;
  if (error) return <div className={style.errorPage}>{error}</div>;
  if (!detail) return null;

  const { group, members, guests, assignments, guestAssignments, invites } = detail;
  const linkedRound = rounds.find((r) => r.id === group.roundId);
  const publicUrl = `/sweepstake/results?id=${group.id}`;
  const totalParticipants = members.length + guests.length;
  const totalAssignments = assignments.length + (guestAssignments?.length ?? 0);

  return (
    <div className={style.page}>
      <div className={style.topBar}>
        <Link href="/groups" className={style.back}>
          ← Groups
        </Link>
      </div>

      <h2 className={style.groupName}>{group.name}</h2>

      {/* Round */}
      <section className={style.section}>
        <div className={style.sectionHeader}>
          <h3 className={style.sectionTitle}>Race Round</h3>
          {isOwner && !editRound && (
            <button
              className={style.editBtn}
              onClick={() => setEditRound(true)}
            >
              {group.roundId ? "Change" : "Link Round"}
            </button>
          )}
        </div>

        {editRound ? (
          <div className={style.roundEdit}>
            <select
              value={selectedRoundId}
              onChange={(e) =>
                setSelectedRoundId(
                  e.target.value !== "" ? Number(e.target.value) : ""
                )
              }
            >
              <option value="">— None —</option>
              {rounds.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                  {r.place ? ` (${r.place})` : ""}
                </option>
              ))}
            </select>
            <div className={style.roundEditActions}>
              <button
                className={style.cancelBtn}
                onClick={() => {
                  setEditRound(false);
                  setSelectedRoundId(group.roundId ?? "");
                }}
              >
                Cancel
              </button>
              <button
                className={style.saveBtn}
                onClick={handleSaveRound}
                disabled={savingRound}
              >
                {savingRound ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <p className={style.roundValue}>
            {linkedRound ? (
              `${linkedRound.name}${linkedRound.place ? ` · ${linkedRound.place}` : ""}`
            ) : (
              <span className={style.none}>Not linked to a round</span>
            )}
          </p>
        )}
      </section>

      {/* Members */}
      <section className={style.section}>
        <h3 className={style.sectionTitle}>Members ({members.length})</h3>
        <ul className={style.memberList}>
          {members.map((m) => (
            <li key={m.id} className={style.memberItem}>
              <span className={style.memberName}>{m.displayName}</span>
              <span className={style.memberRole}>{m.role}</span>
            </li>
          ))}
        </ul>

        {isOwner && (
          <form onSubmit={handleInvite} className={style.inviteForm}>
            <input
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Invite by display name"
            />
            <button type="submit" disabled={inviting || !inviteName.trim()}>
              {inviting ? "Sending…" : "Invite"}
            </button>
            {inviteError && <p className={style.fieldError}>{inviteError}</p>}
            {inviteSuccess && (
              <p className={style.fieldSuccess}>{inviteSuccess}</p>
            )}
          </form>
        )}

        {isOwner &&
          invites &&
          invites.filter((i) => i.status === "pending").length > 0 && (
            <div className={style.pendingInvites}>
              <p className={style.pendingLabel}>Pending invites:</p>
              {invites
                .filter((i) => i.status === "pending")
                .map((inv) => (
                  <span key={inv.id} className={style.pendingChip}>
                    {inv.invitedUserDisplayName ??
                      `User #${inv.invitedUserId}`}
                  </span>
                ))}
            </div>
          )}
      </section>

      {/* Guests */}
      <section className={style.section}>
        <h3 className={style.sectionTitle}>Guests ({guests.length})</h3>
        {guests.length > 0 && (
          <ul className={style.memberList}>
            {guests.map((g) => (
              <li key={g.id} className={style.memberItem}>
                <span className={style.memberName}>{g.name}</span>
                {isOwner && (
                  <button
                    className={style.removeMemberBtn}
                    onClick={() => handleRemoveGuest(g)}
                    title="Remove guest"
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {isOwner && (
          <form onSubmit={handleAddGuest} className={style.inviteForm}>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Guest name (no account needed)"
            />
            <button type="submit" disabled={addingGuest || !guestName.trim()}>
              {addingGuest ? "Adding…" : "Add Guest"}
            </button>
            {guestError && <p className={style.fieldError}>{guestError}</p>}
          </form>
        )}
      </section>

      {/* Rider Pool */}
      {isOwner && group.roundId && allRiders.length > 0 && (
        <section className={style.section}>
          <div className={style.sectionHeader}>
            <h3 className={style.sectionTitle}>
              Rider Pool ({riderPool.length})
            </h3>
            <div className={style.riderPoolActions}>
              <button
                className={style.topNBtn}
                type="button"
                onClick={() => handleTopN(10)}
              >
                Top 10
              </button>
              <button
                className={style.topNBtn}
                type="button"
                onClick={() => handleTopN(15)}
              >
                Top 15
              </button>
              {removedRiderIds.size > 0 && (
                <button
                  className={style.resetBtn}
                  type="button"
                  onClick={handleResetRiders}
                >
                  Reset all
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
              <RiderCard
                key={rider.id}
                rider={rider}
                removeEvent={handleRemoveRider}
              />
            ))}
          </div>
        </section>
      )}

      {/* Assignments */}
      <section className={style.section}>
        <div className={style.sectionHeader}>
          <h3 className={style.sectionTitle}>
            Assignments
            {totalAssignments > 0 && ` (${totalAssignments})`}
          </h3>
          {totalAssignments > 0 && (
            <Link href={publicUrl} className={style.publicLink}>
              Public link →
            </Link>
          )}
        </div>

        {isOwner && group.roundId && (
          <div className={style.assignRow}>
            <button
              className={style.assignBtn}
              onClick={handleAssign}
              disabled={
                assigning ||
                totalParticipants === 0 ||
                riderPool.length < totalParticipants
              }
            >
              {assigning
                ? "Assigning…"
                : totalAssignments > 0
                  ? "Re-assign Riders"
                  : "Assign Riders"}
            </button>
            {riderPool.length < totalParticipants && totalParticipants > 0 && (
              <p className={style.fieldError}>
                Need at least {totalParticipants} riders in pool (currently{" "}
                {riderPool.length})
              </p>
            )}
            {assignError && <p className={style.fieldError}>{assignError}</p>}
          </div>
        )}

        {!group.roundId && isOwner && (
          <p className={style.hint}>
            Link a round above to enable rider assignment.
          </p>
        )}

        {totalAssignments > 0 && (
          <ul className={style.assignmentList}>
            {assignments.map((a: GroupAssignment) => (
              <li key={`user-${a.id}`} className={style.assignmentItem}>
                <span className={style.assignmentUser}>
                  {a.userDisplayName}
                </span>
                <span className={style.assignmentRider}>
                  {a.riderName ?? `Rider #${a.riderId}`}
                </span>
              </li>
            ))}
            {guestAssignments?.map((a) => (
              <li key={`guest-${a.id}`} className={style.assignmentItem}>
                <span className={style.assignmentUser}>
                  {a.guestName}
                </span>
                <span className={style.assignmentRider}>
                  {a.riderName ?? `Rider #${a.riderId}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function GroupDetailPage() {
  return (
    <Suspense>
      <GroupDetailContent />
    </Suspense>
  );
}
