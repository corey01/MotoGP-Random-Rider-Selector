"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { fetchWithAuthJson } from "@/utils/auth";
import styles from "./GroupsPanel.module.scss";

type GroupListItem = {
  id: number;
  name: string;
  ownerId: number;
  roundId: number | null;
  createdAt: string;
  updatedAt: string;
  role: "owner" | "member";
};

type GroupsResponse = {
  ok: boolean;
  groups: GroupListItem[];
};

type CreateGroupResponse = {
  ok: boolean;
  group: Omit<GroupListItem, "role">;
  membershipRole: "owner" | "member";
};

const dateLabel = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB");
};

export default function GroupsPanel() {
  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = await fetchWithAuthJson<GroupsResponse>("/groups");
      setGroups(payload.groups || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load groups");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName) return;

    setIsCreating(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = await fetchWithAuthJson<CreateGroupResponse>("/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: nextName }),
      });

      const createdGroup: GroupListItem = {
        ...payload.group,
        role: payload.membershipRole,
      };
      setGroups((prev) => [createdGroup, ...prev.filter((g) => g.id !== createdGroup.id)]);
      setName("");
      setSuccess(`Created group "${createdGroup.name}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (group: GroupListItem) => {
    if (group.role !== "owner") return;

    const confirmed = window.confirm(
      `Delete "${group.name}"? This will remove members, invites, and assignments for this group.`
    );
    if (!confirmed) return;

    setDeletingGroupId(group.id);
    setError(null);
    setSuccess(null);
    try {
      await fetchWithAuthJson<{ ok: boolean }>(`/groups/${group.id}`, {
        method: "DELETE",
      });
      setGroups((prev) => prev.filter((item) => item.id !== group.id));
      setSuccess(`Deleted group "${group.name}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete group");
    } finally {
      setDeletingGroupId(null);
    }
  };

  return (
    <section className={styles.panel}>
      <div className={styles.titleRow}>
        <h3 className={styles.title}>Groups</h3>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.smallButton}
            onClick={() => void loadGroups()}
            disabled={isLoading}
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
          <Link href="/invites" className={styles.viewLink}>
            Invites
          </Link>
        </div>
      </div>
      <p className={styles.subtitle}>Create groups, manage members, and run rider assignments.</p>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}

      <form className={styles.createForm} onSubmit={handleCreate}>
        <input
          className={styles.input}
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="New group name"
          required
        />
        <button className={styles.createButton} type="submit" disabled={isCreating}>
          {isCreating ? "Creating..." : "Create"}
        </button>
      </form>

      <div className={styles.list}>
        {groups.length === 0 && !isLoading && <p className={styles.empty}>No groups yet.</p>}
        {groups.map((group) => (
          <article className={styles.card} key={group.id}>
            <div className={styles.cardTop}>
              <h4 className={styles.groupName}>{group.name}</h4>
                <span className={styles.meta}>{(group.role || "member").toUpperCase()}</span>
            </div>
            <p className={styles.meta}>
              Updated {dateLabel(group.updatedAt)}
              {group.roundId ? ` · Round #${group.roundId}` : " · No round selected"}
            </p>
            <div className={styles.actions}>
              <Link href={`/groups?id=${group.id}`} className={styles.viewLink}>
                Open Group
              </Link>
              {group.role === "owner" && (
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => void handleDelete(group)}
                  disabled={deletingGroupId === group.id}
                >
                  {deletingGroupId === group.id ? "Deleting..." : "Delete"}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
