"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../_components/AuthProvider";
import { fetchWithAuthJson } from "@/utils/auth";
import styles from "./page.module.scss";

type PendingInvite = {
  id: number;
  groupId: number;
  groupName: string;
  invitedByUserId: number;
  invitedByDisplayName: string | null;
  status: "pending";
  createdAt: string;
};

type InvitesResponse = {
  ok: boolean;
  invites: PendingInvite[];
};

const toDateLabel = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB");
};

export default function InvitesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadInvites = useCallback(async () => {
    setLoadingInvites(true);
    setError(null);
    try {
      const payload = await fetchWithAuthJson<InvitesResponse>("/invites");
      setInvites(payload.invites || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invites");
    } finally {
      setLoadingInvites(false);
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login?redirect=%2Finvites");
      return;
    }
    void loadInvites();
  }, [isAuthenticated, isLoading, loadInvites, router]);

  const respondToInvite = async (invite: PendingInvite, accept: boolean) => {
    setActioningId(invite.id);
    setError(null);
    setSuccess(null);

    try {
      await fetchWithAuthJson<{ ok: boolean }>(
        `/groups/${invite.groupId}/invites/${invite.id}/respond`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ accept }),
        }
      );

      setInvites((prev) => prev.filter((item) => item.id !== invite.id));
      setSuccess(
        accept
          ? `Accepted invite to ${invite.groupName}.`
          : `Declined invite to ${invite.groupName}.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to respond to invite");
    } finally {
      setActioningId(null);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <section className={styles.page}>
        <p className={styles.subtitle}>Checking access...</p>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <h2 className={styles.title}>Invites</h2>
      <p className={styles.subtitle}>Respond to pending group invitations.</p>

      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.toolbarButton}
          onClick={() => void loadInvites()}
          disabled={loadingInvites}
        >
          {loadingInvites ? "Refreshing..." : "Refresh"}
        </button>
        <Link href="/sweepstake" className={styles.openButton}>
          Back to Sweepstake
        </Link>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}

      {invites.length === 0 && !loadingInvites && (
        <p className={styles.empty}>No pending invites.</p>
      )}

      <div className={styles.list}>
        {invites.map((invite) => (
          <article className={styles.card} key={invite.id}>
            <h3 className={styles.groupName}>{invite.groupName}</h3>
            <p className={styles.meta}>
              Invited by {invite.invitedByDisplayName || `User #${invite.invitedByUserId}`} on{" "}
              {toDateLabel(invite.createdAt)}
            </p>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.acceptButton}
                disabled={actioningId === invite.id}
                onClick={() => void respondToInvite(invite, true)}
              >
                {actioningId === invite.id ? "Saving..." : "Accept"}
              </button>
              <button
                type="button"
                className={styles.declineButton}
                disabled={actioningId === invite.id}
                onClick={() => void respondToInvite(invite, false)}
              >
                Decline
              </button>
              <Link className={styles.openButton} href={`/groups?id=${invite.groupId}`}>
                Open Group
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
