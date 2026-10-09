const TERMINAL_STATUSES = new Set(['closed', 'sold', 'unsold']);

export const getAuctionPhase = (lot, now = Date.now()) => {
  if (TERMINAL_STATUSES.has(lot?.status)) return lot.status;

  const startTime = new Date(lot?.startDate).getTime();
  const endTime = new Date(lot?.endDate).getTime();
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime || endTime <= now) {
    return 'ended';
  }
  return startTime > now ? 'upcoming' : 'live';
};

export const getAuctionTargetTime = (lot, now = Date.now()) => (
  getAuctionPhase(lot, now) === 'upcoming'
    ? new Date(lot.startDate).getTime()
    : new Date(lot.endDate).getTime()
);

export const isPastAuctionPhase = (phase) => (
  phase === 'ended' || TERMINAL_STATUSES.has(phase)
);
