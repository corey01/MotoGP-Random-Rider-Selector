"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/_components/AuthProvider";
import {
  createGroup,
  deleteGroup,
  fetchGroups,
  fetchPendingInvites,
  respondToInvite,
  updateGroup,
  type GroupWithRole,
  type PendingInvite,
} from "@/utils/groups";
import {
  fetchCalendarEvents,
  type ApiCalendarEvent,
} from "@/utils/getCalendarData";
import style from "./Groups.module.scss";

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

function GroupsContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [groups, setGroups] = useState<GroupWithRole[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");

  // Modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createMode, setCreateMode] = useState<"new" | "existing">("existing");
  // Shared round ID across both modes
  const [selectedRoundId, setSelectedRoundId] = useState<number | "">("");
  // New group fields
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  // Existing group fields
  const [existingGroupId, setExistingGroupId] = useState<number | "">("");

  // Invite respond state
  const [respondingId, setRespondingId] = useState<number | null>(null);

  const year = Number(
    process.env.NEXT_PUBLIC_MOTOGP_SEASON_YEAR || new Date().getFullYear()
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const load = async () => {
      try {
        const [groupsData, invitesData, events] = await Promise.all([
          fetchGroups(),
          fetchPendingInvites(),
          fetchCalendarEvents({ year, series: ["motogp"], types: ["RACE"] }),
        ]);
        setGroups(groupsData);
        setInvites(invitesData);
        setRounds(deriveRounds(events));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoadingData(false);
      }
    };

    void load();
  }, [isAuthenticated, year]);

  // Auto-open create modal when navigated from calendar with ?create=<roundId>
  useEffect(() => {
    const createRoundId = searchParams.get("create");
    if (createRoundId && rounds.length > 0 && !showCreate) {
      setSelectedRoundId(Number(createRoundId));
      setNewName("");
      setExistingGroupId("");
      setCreateError("");
      setShowCreate(true);
    }
  }, [searchParams, rounds]);

  const openCreate = () => {
    setCreateMode("existing");
    setNewName("");
    setExistingGroupId("");
    setCreateError("");
    setShowCreate(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");

    try {
      if (effectiveMode === "new") {
        if (!newName.trim()) return;
        const group = await createGroup(
          newName.trim(),
          selectedRoundId !== "" ? selectedRoundId : null
        );
        setGroups((prev) => [{ ...group, role: "owner" as const }, ...prev]);
        setShowCreate(false);
        router.push(`/groups/detail?id=${group.id}`);
      } else {
        if (existingGroupId === "" || selectedRoundId === "") return;
        await updateGroup(existingGroupId, { roundId: selectedRoundId });
        setShowCreate(false);
        router.push(`/groups/detail?id=${existingGroupId}`);
      }
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Failed");
    } finally {
      setCreating(false);
    }
  };

  const handleRespond = async (invite: PendingInvite, accept: boolean) => {
    setRespondingId(invite.id);
    try {
      await respondToInvite(invite.groupId, invite.id, accept);
      setInvites((prev) => prev.filter((i) => i.id !== invite.id));
      if (accept) {
        const refreshed = await fetchGroups();
        setGroups(refreshed);
      }
    } catch {
      // ignore
    } finally {
      setRespondingId(null);
    }
  };

  const handleDelete = async (group: GroupWithRole) => {
    if (!confirm(`Delete "${group.name}"? This cannot be undone.`)) return;
    try {
      await deleteGroup(group.id);
      setGroups((prev) => prev.filter((g) => g.id !== group.id));
    } catch {
      // ignore
    }
  };

  if (isLoading || (!isAuthenticated && !isLoading)) return null;
  if (loadingData) return <div className={style.loading}>Loading…</div>;

  const ownedGroups = groups.filter((g) => g.role === "owner");
  // Fall back to "new" if there are no owned groups to select
  const effectiveMode =
    createMode === "existing" && ownedGroups.length === 0 ? "new" : createMode;

  return (
    <div className={style.page}>
      {error && <p className={style.error}>{error}</p>}

      {invites.length > 0 && (
        <section className={style.section}>
          <h2 className={style.sectionTitle}>Pending Invites</h2>
          <ul className={style.inviteList}>
            {invites.map((invite) => (
              <li key={invite.id} className={style.inviteItem}>
                <span>
                  <strong>{invite.groupName}</strong>
                  {invite.invitedByDisplayName && (
                    <> — invited by {invite.invitedByDisplayName}</>
                  )}
                </span>
                <div className={style.inviteActions}>
                  <button
                    className={style.acceptBtn}
                    disabled={respondingId === invite.id}
                    onClick={() => handleRespond(invite, true)}
                  >
                    Accept
                  </button>
                  <button
                    className={style.declineBtn}
                    disabled={respondingId === invite.id}
                    onClick={() => handleRespond(invite, false)}
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={style.section}>
        <div className={style.sectionHeader}>
          <h2 className={style.sectionTitle}>Your Groups</h2>
          <button className={style.createBtn} onClick={openCreate}>
            + New Group
          </button>
        </div>

        {groups.length === 0 ? (
          <p className={style.empty}>
            No groups yet. Create one to get started.
          </p>
        ) : (
          <ul className={style.groupList}>
            {groups.map((group) => (
              <li key={group.id} className={style.groupItem}>
                <Link
                  href={`/groups/detail?id=${group.id}`}
                  className={style.groupLink}
                >
                  <span className={style.groupName}>{group.name}</span>
                  <span className={style.groupRole}>{group.role}</span>
                </Link>
                {group.role === "owner" && (
                  <button
                    className={style.deleteBtn}
                    onClick={() => handleDelete(group)}
                    title="Delete group"
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {showCreate && (
        <div
          className={style.modalOverlay}
          onClick={() => setShowCreate(false)}
        >
          <div className={style.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={style.modalTitle}>Create / Link Sweepstake</h2>

            {/* Mode toggle */}
            <div className={style.modeToggle}>
              <button
                type="button"
                className={
                  effectiveMode === "existing" ? style.modeActive : style.modeBtn
                }
                onClick={() => setCreateMode("existing")}
                disabled={ownedGroups.length === 0}
              >
                Existing group
              </button>
              <button
                type="button"
                className={
                  effectiveMode === "new" ? style.modeActive : style.modeBtn
                }
                onClick={() => setCreateMode("new")}
              >
                New group
              </button>
            </div>

            <form onSubmit={handleCreate} className={style.form}>
              {/* Round picker — shared, always shown first */}
              <div className={style.field}>
                <label htmlFor="group-round">
                  Race Round{" "}
                  {effectiveMode === "new" && (
                    <span className={style.optional}>(optional)</span>
                  )}
                </label>
                <select
                  id="group-round"
                  value={selectedRoundId}
                  onChange={(e) =>
                    setSelectedRoundId(
                      e.target.value !== "" ? Number(e.target.value) : ""
                    )
                  }
                  required={effectiveMode === "existing"}
                >
                  <option value="">— None —</option>
                  {rounds.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                      {r.place ? ` (${r.place})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {effectiveMode === "new" ? (
                <div className={style.field}>
                  <label htmlFor="group-name">Group Name</label>
                  <input
                    id="group-name"
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Sunday Sweepstake"
                    required
                    autoFocus
                  />
                </div>
              ) : (
                <div className={style.field}>
                  <label htmlFor="existing-group">Group</label>
                  <select
                    id="existing-group"
                    value={existingGroupId}
                    onChange={(e) =>
                      setExistingGroupId(
                        e.target.value !== "" ? Number(e.target.value) : ""
                      )
                    }
                    required
                  >
                    <option value="">— Select a group —</option>
                    {ownedGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {createError && <p className={style.error}>{createError}</p>}
              <div className={style.modalActions}>
                <button
                  type="button"
                  className={style.cancelBtn}
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={style.submitBtn}
                  disabled={
                    creating ||
                    (effectiveMode === "new" && !newName.trim()) ||
                    (effectiveMode === "existing" &&
                      (existingGroupId === "" || selectedRoundId === ""))
                  }
                >
                  {creating
                    ? "Saving…"
                    : effectiveMode === "new"
                      ? "Create"
                      : "Link Round"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GroupsPage() {
  return (
    <Suspense>
      <GroupsContent />
    </Suspense>
  );
}
