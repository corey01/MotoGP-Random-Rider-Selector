"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/_components/AuthProvider";
import { fetchJson, fetchWithAuthJson } from "@/utils/auth";
import type { ApiCalendarEvent } from "@/utils/getCalendarData";
import styles from "./page.module.scss";

type Group = {
  id: number;
  name: string;
  ownerId: number;
  roundId: number | null;
  createdAt: string;
  updatedAt: string;
};

type GroupMember = {
  id: number;
  userId: number;
  displayName: string;
  role: "owner" | "member";
  joinedAt: string;
};

type GroupInvite = {
  id: number;
  groupId: number;
  invitedUserId: number;
  invitedByUserId: number;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  respondedAt: string | null;
  invitedUserDisplayName: string | null;
  invitedByDisplayName: string | null;
};

type GroupAssignment = {
  id: number;
  userId: number;
  userDisplayName: string;
  riderId: number;
  riderName: string | null;
  assignedAt: string;
};

type GroupDetailResponse = {
  ok: boolean;
  group: Group;
  membershipRole: "owner" | "member";
  members: GroupMember[];
  assignments: GroupAssignment[];
  invites?: GroupInvite[];
};

type AssignResponse = {
  ok: boolean;
  count: number;
  assignments: GroupAssignment[];
};

type UsersSearchResponse = {
  ok: boolean;
  users: Array<{ id: number; displayName: string }>;
};

type CalendarEventsResponse = {
  ok: boolean;
  events: ApiCalendarEvent[];
};

type RoundOption = {
  id: number;
  label: string;
};

const seasonYear = Number(
  process.env.NEXT_PUBLIC_MOTOGP_SEASON_YEAR || new Date().getFullYear()
);

const toDateLabel = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB");
};

function parseGroupIdFromSearchParam(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export default function GroupDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const groupId = parseGroupIdFromSearchParam(searchParams.get("id"));

  const [group, setGroup] = useState<Group | null>(null);
  const [membershipRole, setMembershipRole] = useState<"owner" | "member" | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [assignments, setAssignments] = useState<GroupAssignment[]>([]);
  const [invites, setInvites] = useState<GroupInvite[]>([]);
  const [roundOptions, setRoundOptions] = useState<RoundOption[]>([]);
  const [roundSelection, setRoundSelection] = useState("none");
  const [inviteQuery, setInviteQuery] = useState("");
  const [inviteSuggestions, setInviteSuggestions] = useState<
    Array<{ id: number; displayName: string }>
  >([]);

  const [loadingData, setLoadingData] = useState(false);
  const [updatingRound, setUpdatingRound] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isOwner = membershipRole === "owner";

  const loadGroup = useCallback(async () => {
    if (!groupId) return null;

    const payload = await fetchWithAuthJson<GroupDetailResponse>(`/groups/${groupId}`);
    setGroup(payload.group);
    setMembershipRole(payload.membershipRole);
    setMembers(payload.members || []);
    setAssignments(payload.assignments || []);
    setInvites(payload.invites || []);
    setRoundSelection(payload.group.roundId ? String(payload.group.roundId) : "none");
    return payload;
  }, [groupId]);

  const loadRoundOptions = useCallback(async () => {
    const payload = await fetchJson<CalendarEventsResponse>(
      `/calendar-events?year=${seasonYear}&type=RACE`
    );

    const uniqueByRoundId = new Map<number, RoundOption>();
    for (const event of payload.events || []) {
      const roundId = event.round?.id;
      if (!roundId || uniqueByRoundId.has(roundId)) continue;
      const series = event.series ? String(event.series).toUpperCase() : "";
      const numberPart = event.round?.number ? `#${event.round.number} ` : "";
      const namePart = event.round?.name || event.title || `Round ${roundId}`;
      const countryPart = event.round?.country ? ` - ${event.round.country}` : "";
      uniqueByRoundId.set(roundId, {
        id: roundId,
        label: `${series}: ${numberPart}${namePart}${countryPart}`,
      });
    }

    const sorted = Array.from(uniqueByRoundId.values()).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
    setRoundOptions(sorted);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      const redirect = groupId ? `/groups?id=${groupId}` : "/sweepstake";
      router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }
    if (!groupId) return;

    let cancelled = false;
    const load = async () => {
      setLoadingData(true);
      setError(null);
      try {
        const payload = await loadGroup();
        if (payload?.membershipRole === "owner") {
          try {
            await loadRoundOptions();
          } catch {
            // Round options are optional for group detail rendering.
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load group");
        }
      } finally {
        if (!cancelled) {
          setLoadingData(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [groupId, isAuthenticated, isLoading, loadGroup, loadRoundOptions, router]);

  useEffect(() => {
    if (!isOwner) {
      setInviteSuggestions([]);
      return;
    }

    const q = inviteQuery.trim();
    if (q.length < 1) {
      setInviteSuggestions([]);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          const payload = await fetchWithAuthJson<UsersSearchResponse>(
            `/users/search?q=${encodeURIComponent(q)}`
          );
          if (!cancelled) {
            setInviteSuggestions(payload.users || []);
          }
        } catch {
          if (!cancelled) {
            setInviteSuggestions([]);
          }
        }
      })();
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [inviteQuery, isOwner]);

  const derivedRoundOptions = useMemo(() => {
    if (!group?.roundId) return roundOptions;
    if (roundOptions.some((option) => option.id === group.roundId)) return roundOptions;
    return [...roundOptions, { id: group.roundId, label: `Current round #${group.roundId}` }];
  }, [group?.roundId, roundOptions]);

  const handleRoundSave = async () => {
    if (!groupId || !isOwner) return;
    setUpdatingRound(true);
    setError(null);
    setSuccess(null);

    const nextRoundId = roundSelection === "none" ? null : Number.parseInt(roundSelection, 10);
    if (nextRoundId !== null && (!Number.isInteger(nextRoundId) || nextRoundId < 1)) {
      setError("Select a valid round.");
      setUpdatingRound(false);
      return;
    }

    try {
      const payload = await fetchWithAuthJson<{ ok: boolean; group: Group }>(`/groups/${groupId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roundId: nextRoundId }),
      });
      setGroup(payload.group);
      setSuccess("Round updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update round");
    } finally {
      setUpdatingRound(false);
    }
  };

  const handleAssign = async () => {
    if (!groupId || !isOwner) return;
    setAssigning(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = await fetchWithAuthJson<AssignResponse>(`/groups/${groupId}/assign`, {
        method: "POST",
      });
      setAssignments(payload.assignments || []);
      setSuccess(`Assigned riders for ${payload.count} member(s).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign riders");
    } finally {
      setAssigning(false);
    }
  };

  const handleInvite = async () => {
    if (!groupId || !isOwner) return;
    const displayName = inviteQuery.trim();
    if (!displayName) return;

    setInviting(true);
    setError(null);
    setSuccess(null);
    try {
      await fetchWithAuthJson<{ ok: boolean }>(`/groups/${groupId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ displayName }),
      });
      setInviteQuery("");
      setInviteSuggestions([]);
      setSuccess(`Invite sent to ${displayName}.`);
      await loadGroup();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <section className={styles.page}>
        <p className={styles.meta}>Checking access...</p>
      </section>
    );
  }

  if (!groupId) {
    return (
      <section className={styles.page}>
        <h2 className={styles.title}>Group</h2>
        <p className={styles.meta}>Missing group id. Open a group from the Groups tab.</p>
        <div className={styles.links}>
          <Link href="/sweepstake" className={styles.linkButton}>
            Back to Sweepstake
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.topRow}>
        <div>
          <h2 className={styles.title}>{group?.name || "Group"}</h2>
          <p className={styles.meta}>
            {membershipRole ? `Your role: ${membershipRole.toUpperCase()}` : ""}
          </p>
        </div>
        <div className={styles.links}>
          <Link href="/sweepstake" className={styles.linkButton}>
            Sweepstake
          </Link>
          <Link href="/invites" className={styles.linkButton}>
            Invites
          </Link>
        </div>
      </div>

      {success && <p className={`${styles.status} ${styles.success}`}>{success}</p>}
      {error && <p className={`${styles.status} ${styles.error}`}>{error}</p>}

      <div className={styles.grid}>
        <section className={styles.panel}>
          <h3 className={styles.panelTitle}>Members</h3>
          <div className={styles.list}>
            {members.map((member) => (
              <div className={styles.memberRow} key={member.id}>
                <span className={styles.memberName}>{member.displayName}</span>
                <span className={styles.badge}>{member.role}</span>
              </div>
            ))}
            {members.length === 0 && <p className={styles.meta}>No members in this group yet.</p>}
          </div>
        </section>

        {isOwner && (
          <section className={styles.panel}>
            <h3 className={styles.panelTitle}>Invite User</h3>
            <div className={styles.fieldRow}>
              <input
                type="text"
                className={styles.input}
                value={inviteQuery}
                onChange={(event) => setInviteQuery(event.target.value)}
                placeholder="Search display name"
              />
              <button
                type="button"
                className={styles.button}
                disabled={inviting || !inviteQuery.trim()}
                onClick={() => void handleInvite()}
              >
                {inviting ? "Sending..." : "Send Invite"}
              </button>
            </div>
            {inviteSuggestions.length > 0 && (
              <div className={styles.suggestions}>
                {inviteSuggestions.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className={styles.suggestionButton}
                    onClick={() => {
                      setInviteQuery(user.displayName);
                      setInviteSuggestions([]);
                    }}
                  >
                    {user.displayName}
                  </button>
                ))}
              </div>
            )}
            <p className={styles.hint}>Choose a suggested user to ensure exact display-name match.</p>
          </section>
        )}

        {isOwner && (
          <section className={styles.panel}>
            <h3 className={styles.panelTitle}>Round Selection</h3>
            <div className={styles.fieldRow}>
              <select
                className={styles.select}
                value={roundSelection}
                onChange={(event) => setRoundSelection(event.target.value)}
              >
                <option value="none">No round selected</option>
                {derivedRoundOptions.map((option) => (
                  <option key={option.id} value={String(option.id)}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={styles.button}
                disabled={updatingRound}
                onClick={() => void handleRoundSave()}
              >
                {updatingRound ? "Saving..." : "Save Round"}
              </button>
            </div>
            <p className={styles.hint}>
              Round ID is stored on the group and used for assignment rider pool.
            </p>
          </section>
        )}

        {isOwner && (
          <section className={styles.panel}>
            <h3 className={styles.panelTitle}>Assignment</h3>
            <div className={styles.fieldRow}>
              <button
                type="button"
                className={styles.button}
                disabled={assigning || !group?.roundId}
                onClick={() => void handleAssign()}
              >
                {assigning ? "Assigning..." : "Assign Riders"}
              </button>
            </div>
            <p className={styles.hint}>Assignments overwrite previous results for this group.</p>
          </section>
        )}

        {isOwner && (
          <section className={styles.panel}>
            <h3 className={styles.panelTitle}>Invites</h3>
            <div className={styles.list}>
              {invites.map((invite) => (
                <div className={styles.inviteRow} key={invite.id}>
                  <span className={styles.memberName}>
                    {invite.invitedUserDisplayName || `User #${invite.invitedUserId}`}
                  </span>
                  <span className={styles.badge}>{invite.status}</span>
                </div>
              ))}
              {invites.length === 0 && <p className={styles.meta}>No invites yet.</p>}
            </div>
          </section>
        )}

        <section className={`${styles.panel} ${styles.fullWidth}`}>
          <h3 className={styles.panelTitle}>Results</h3>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Rider</th>
                  <th>Assigned At</th>
                </tr>
              </thead>
              <tbody>
                {assignments.length === 0 && (
                  <tr>
                    <td colSpan={3}>No assignments yet.</td>
                  </tr>
                )}
                {assignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td>{assignment.userDisplayName}</td>
                    <td>{assignment.riderName || `Rider #${assignment.riderId}`}</td>
                    <td>{toDateLabel(assignment.assignedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {loadingData && <p className={styles.hint}>Refreshing group data...</p>}
        </section>
      </div>
    </section>
  );
}

