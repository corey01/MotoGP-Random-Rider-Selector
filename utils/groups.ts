import { fetchWithAuth } from "./auth";

const API = process.env.NEXT_PUBLIC_RACECAL_URL ?? "http://localhost:3001";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Group {
  id: number;
  name: string;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
}

export interface GroupWithRole extends Group {
  role: "owner" | "member";
}

export interface GroupMember {
  id: number;
  userId: number;
  displayName: string;
  role: "owner" | "member";
  joinedAt: string;
}

export interface GroupGuest {
  id: number;
  name: string;
}

export interface GroupInvite {
  id: number;
  groupId: number;
  invitedUserId: number;
  invitedByUserId: number;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  respondedAt: string | null;
  invitedUserDisplayName?: string | null;
  invitedByDisplayName?: string | null;
}

export interface PendingInvite {
  id: number;
  groupId: number;
  groupName: string;
  invitedByUserId: number;
  invitedByDisplayName: string | null;
  status: "pending";
  createdAt: string;
}

export interface SweepstakeSummary {
  id: number;
  groupId: number;
  roundId: number;
  status: "pending" | "generated";
  createdAt: string;
  roundName: string;
  roundPlace: string | null;
  roundCountry: string | null;
  roundStartDate: string | null;
}

export interface SweepstakeAssignment {
  id: number;
  sweepstakeId: number;
  participantName: string;
  participantType: "member" | "guest";
  riderId: number;
  riderName: string;
  assignedAt: string;
}

export interface SweepstakeDetail extends SweepstakeSummary {
  assignments: SweepstakeAssignment[];
}

export interface GroupDetail {
  group: Group;
  membershipRole: "owner" | "member";
  members: GroupMember[];
  guests: GroupGuest[];
  sweepstakes: SweepstakeSummary[];
  invites?: GroupInvite[];
}

export interface PublicSweepstakeData {
  sweepstake: {
    id: number;
    groupName: string;
    roundName: string;
    roundPlace: string | null;
    roundCountry: string | null;
    roundStartDate: string | null;
    status: "pending" | "generated";
  };
  assignments: {
    participantName: string;
    participantType: "member" | "guest";
    participantPhotoUrl: string | null;
    riderId: number;
    riderName: string;
  }[];
}

// ─── Auth-required API calls ──────────────────────────────────────────────────

export async function fetchGroups(): Promise<GroupWithRole[]> {
  const res = await fetchWithAuth("/groups");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to fetch groups");
  return data.groups;
}

export async function createGroup(name: string): Promise<Group> {
  const res = await fetchWithAuth("/groups", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to create group");
  return data.group;
}

export async function fetchGroup(id: number): Promise<GroupDetail> {
  const res = await fetchWithAuth(`/groups/${id}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Group not found");
  return { ...data, guests: data.guests ?? [], sweepstakes: data.sweepstakes ?? [] };
}

export async function updateGroup(
  id: number,
  updates: { name: string }
): Promise<Group> {
  const res = await fetchWithAuth(`/groups/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to update group");
  return data.group;
}

export async function deleteGroup(id: number): Promise<void> {
  const res = await fetchWithAuth(`/groups/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Failed to delete group");
  }
}

export async function inviteToGroup(
  groupId: number,
  displayName: string
): Promise<GroupInvite> {
  const res = await fetchWithAuth(`/groups/${groupId}/invite`, {
    method: "POST",
    body: JSON.stringify({ displayName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to send invite");
  return data.invite;
}

export async function respondToInvite(
  groupId: number,
  inviteId: number,
  accept: boolean
): Promise<void> {
  const res = await fetchWithAuth(
    `/groups/${groupId}/invites/${inviteId}/respond`,
    { method: "POST", body: JSON.stringify({ accept }) }
  );
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Failed to respond to invite");
  }
}

export async function fetchPendingInvites(): Promise<PendingInvite[]> {
  const res = await fetchWithAuth("/invites");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to fetch invites");
  return data.invites;
}

export async function addGuest(
  groupId: number,
  name: string
): Promise<GroupGuest> {
  const res = await fetchWithAuth(`/groups/${groupId}/guests`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to add guest");
  return data.guest;
}

export async function removeGuest(
  groupId: number,
  guestId: number
): Promise<void> {
  const res = await fetchWithAuth(`/groups/${groupId}/guests/${guestId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Failed to remove guest");
  }
}

// ─── Sweepstake API calls ─────────────────────────────────────────────────────

export async function deleteSweepstake(
  groupId: number,
  sweepstakeId: number
): Promise<void> {
  const res = await fetchWithAuth(`/groups/${groupId}/sweepstakes/${sweepstakeId}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Failed to delete sweepstake");
  }
}

export async function createSweepstake(
  groupId: number,
  roundId: number
): Promise<SweepstakeSummary> {
  const res = await fetchWithAuth(`/groups/${groupId}/sweepstakes`, {
    method: "POST",
    body: JSON.stringify({ roundId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to create sweepstake");
  return data.sweepstake;
}

export async function fetchSweepstakeDetail(
  groupId: number,
  sweepstakeId: number
): Promise<SweepstakeDetail> {
  const res = await fetchWithAuth(
    `/groups/${groupId}/sweepstakes/${sweepstakeId}`
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Sweepstake not found");
  return { ...data.sweepstake, assignments: data.assignments ?? [] };
}

export async function assignRiders(
  groupId: number,
  sweepstakeId: number,
  riderIds?: number[]
): Promise<SweepstakeAssignment[]> {
  const body: Record<string, unknown> = {};
  if (riderIds !== undefined) body.riderIds = riderIds;
  const res = await fetchWithAuth(
    `/groups/${groupId}/sweepstakes/${sweepstakeId}/assign`,
    { method: "POST", body: JSON.stringify(body) }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to assign riders");
  return data.assignments;
}

export async function searchUsers(
  q: string
): Promise<Array<{ id: number; displayName: string }>> {
  if (!q.trim()) return [];
  const res = await fetchWithAuth(`/users/search?q=${encodeURIComponent(q)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to search users");
  return data.users;
}

// ─── Public (no auth) ────────────────────────────────────────────────────────

export async function fetchPublicSweepstake(
  sweepstakeId: number
): Promise<PublicSweepstakeData> {
  const res = await fetch(`${API}/sweepstakes/${sweepstakeId}/public`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Sweepstake not found");
  return data;
}
