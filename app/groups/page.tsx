"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/_components/AuthProvider";
import {
  createGroup,
  deleteGroup,
  fetchGroups,
  fetchPendingInvites,
  respondToInvite,
  type GroupWithRole,
  type PendingInvite,
} from "@/utils/groups";
import { buildPathWithReturnTo, getCurrentPath } from "@/utils/returnTo";
import style from "./Groups.module.scss";

function GroupsContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [groups, setGroups] = useState<GroupWithRole[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [respondingId, setRespondingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(
        buildPathWithReturnTo("/login", getCurrentPath(pathname, searchParams)),
      );
    }
  }, [isLoading, isAuthenticated, pathname, router, searchParams]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const load = async () => {
      try {
        const [groupsData, invitesData] = await Promise.all([
          fetchGroups(),
          fetchPendingInvites(),
        ]);
        setGroups(groupsData);
        setInvites(invitesData);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoadingData(false);
      }
    };

    void load();
  }, [isAuthenticated]);

  const openCreate = () => {
    setNewName("");
    setCreateError("");
    setShowCreate(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      const group = await createGroup(newName.trim());
      setGroups((prev) => [{ ...group, role: "owner" as const }, ...prev]);
      setShowCreate(false);
      router.push(`/groups/detail?id=${group.id}`);
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
            <h2 className={style.modalTitle}>New Group</h2>
            <form onSubmit={handleCreate} className={style.form}>
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
                  disabled={creating || !newName.trim()}
                >
                  {creating ? "Creating…" : "Create"}
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
