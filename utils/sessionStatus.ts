export function sessionDisruption(status?: string | null): 'Cancelled' | 'Postponed' | null {
  switch (status?.trim().toUpperCase()) {
    case 'CANCELLED':
    case 'CANCELED': return 'Cancelled';
    case 'POSTPONED': return 'Postponed';
    default: return null;
  }
}

export function strikeSessionTime(status?: string | null, start?: string | null): boolean {
  return sessionDisruption(status) === 'Cancelled' && !!start && !/^\d{4}-\d{2}-\d{2}$/.test(start);
}
