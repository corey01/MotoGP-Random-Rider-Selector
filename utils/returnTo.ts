"use client";

export const RETURN_TO_PARAM = "returnTo";

type SearchParamsLike = {
  toString(): string;
};

export function normalizeReturnTo(returnTo: string | null | undefined): string | null {
  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return null;
  }

  return returnTo;
}

export function buildPathWithReturnTo(
  pathname: string,
  returnTo: string | null | undefined,
): string {
  const safeReturnTo = normalizeReturnTo(returnTo);
  if (!safeReturnTo) return pathname;

  const params = new URLSearchParams();
  params.set(RETURN_TO_PARAM, safeReturnTo);
  return `${pathname}?${params.toString()}`;
}

export function getCurrentPath(
  pathname: string,
  searchParams?: SearchParamsLike | null,
): string {
  const search = searchParams?.toString();
  return search ? `${pathname}?${search}` : pathname;
}
