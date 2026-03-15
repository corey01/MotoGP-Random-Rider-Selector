"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/_components/AuthProvider";
import {
  fetchGroup,
  inviteToGroup,
  addGuest,
  removeGuest,
  deleteSweepstake,
  searchUsers,
  type GroupDetail,
  type GroupGuest,
  type SweepstakeSummary,
} from "@/utils/groups";
import style from "./GroupDetail.module.scss";

function formatRoundLabel(s: SweepstakeSummary): string {
  let label = s.roundName;
  if (s.roundCountry) label += ` · ${s.roundCountry}`;
  return label;
}

function GroupDetailContent() {
  const searchParams = useSearchParams();
  const groupId = Number(searchParams.get("id"));

  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");

  const [inviteName, setInviteName] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{ id: number; displayName: string }>>([]);
  const suggestTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [guestName, setGuestName] = useState("");
  const [addingGuest, setAddingGuest] = useState(false);
  const [guestError, setGuestError] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !groupId) return;

    const load = async () => {
      try {
        const groupDetail = await fetchGroup(groupId);
        setDetail(groupDetail);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load group");
      } finally {
        setLoadingData(false);
      }
    };

    void load();
  }, [isAuthenticated, groupId]);

  const isOwner = detail?.membershipRole === "owner";

  const handleInviteNameChange = (value: string) => {
    setInviteName(value);
    if (suggestTimeoutRef.current) clearTimeout(suggestTimeoutRef.current);
    if (!value.trim()) { setSuggestions([]); return; }
    suggestTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchUsers(value.trim());
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      }
    }, 250);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim()) return;
    setInviting(true);
    setInviteError("");
    setInviteSuccess("");
    setSuggestions([]);
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

  const handleDeleteSweepstake = async (s: SweepstakeSummary) => {
    if (!confirm(`Delete sweepstake for "${formatRoundLabel(s)}"? This cannot be undone.`)) return;
    try {
      await deleteSweepstake(groupId, s.id);
      setDetail((prev) =>
        prev
          ? { ...prev, sweepstakes: prev.sweepstakes.filter((sw) => sw.id !== s.id) }
          : prev
      );
    } catch {
      // ignore
    }
  };

  if (isLoading || (!isAuthenticated && !isLoading)) return null;
  if (loadingData) return <div className={style.loading}>Loading…</div>;
  if (error) return <div className={style.errorPage}>{error}</div>;
  if (!detail) return null;

  const { group, members, guests, sweepstakes, invites } = detail;

  return (
    <div className={style.page}>
      <div className={style.topBar}>
        <Link href="/groups" className={style.back}>
          ← Groups
        </Link>
      </div>

      <h2 className={style.groupName}>{group.name}</h2>

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
            <div className={style.inviteInputWrap}>
              <input
                type="text"
                value={inviteName}
                onChange={(e) => handleInviteNameChange(e.target.value)}
                placeholder="Invite by display name"
                autoComplete="off"
              />
              {suggestions.length > 0 && (
                <ul className={style.suggestions}>
                  {suggestions.map((s) => (
                    <li
                      key={s.id}
                      className={style.suggestionItem}
                      onMouseDown={() => {
                        setInviteName(s.displayName);
                        setSuggestions([]);
                      }}
                    >
                      {s.displayName}
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
                    {inv.invitedUserDisplayName ?? `User #${inv.invitedUserId}`}
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

      {/* Sweepstakes */}
      <section className={style.section}>
        <div className={style.sectionHeader}>
          <h3 className={style.sectionTitle}>
            Sweepstakes {sweepstakes.length > 0 && `(${sweepstakes.length})`}
          </h3>
          {isOwner && (
            <Link
              href={`/sweepstake/wizard?groupId=${group.id}`}
              className={style.editBtn}
            >
              + New Sweepstake
            </Link>
          )}
        </div>

        {sweepstakes.length === 0 ? (
          <p className={style.hint}>
            {isOwner
              ? "No sweepstakes yet. Start one for an upcoming race."
              : "No sweepstakes yet."}
          </p>
        ) : (
          <ul className={style.sweepstakeList}>
            {sweepstakes.map((s) => (
              <li key={s.id} className={style.sweepstakeItem}>
                <Link
                  href={`/sweepstake/results?id=${s.id}`}
                  className={style.sweepstakeLink}
                >
                  <span className={style.sweepstakeName}>
                    {formatRoundLabel(s)}
                  </span>
                  <span
                    className={
                      s.status === "generated"
                        ? style.statusGenerated
                        : style.statusPending
                    }
                  >
                    {s.status}
                  </span>
                </Link>
                {isOwner && (
                  <>
                    <Link
                      href={`/sweepstake/wizard?groupId=${group.id}&sweepstakeId=${s.id}`}
                      className={style.editBtn}
                      title="Edit / regenerate"
                    >
                      Edit
                    </Link>
                    <button
                      className={style.removeMemberBtn}
                      onClick={() => handleDeleteSweepstake(s)}
                      title="Delete sweepstake"
                    >
                      ✕
                    </button>
                  </>
                )}
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
