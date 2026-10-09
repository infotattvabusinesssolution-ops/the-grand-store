const EVENT_TIMEZONE_OFFSET = "+02:00";

export const resolveEventImage = (image) => {
  const source = String(image || "").trim();
  if (!source) return "";
  if (/^(https?:)?\/\//i.test(source) || source.startsWith("data:") || source.startsWith("blob:")) {
    return source;
  }
  const apiUrl = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  return `${apiUrl}${source.startsWith("/") ? "" : "/"}${source}`;
};

const dateKey = (date) => {
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 10);
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
};

export const getEventDateTime = (event, field) => {
  const day = dateKey(event?.date);
  const time = event?.[field];
  if (!day || !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(time || ""))) return null;
  const parsed = new Date(`${day}T${time}:00${EVENT_TIMEZONE_OFFSET}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getEventPhase = (event, now = new Date()) => {
  if (event?.status === "cancelled") return "cancelled";
  if (event?.status === "completed") return "completed";
  if (event?.approvalStatus && event.approvalStatus !== "approved") return event.approvalStatus;

  const startAt = getEventDateTime(event, "startTime");
  const endAt = getEventDateTime(event, "endTime");
  if (!startAt || !endAt || endAt <= startAt || endAt <= now) return "completed";
  if (startAt <= now) return "ongoing";
  return "upcoming";
};

export const getTierAvailability = (tier) => Math.max(
  0,
  Number(tier?.quantity || 0) - Number(tier?.sold || 0) - Number(tier?.reserved || 0),
);

export const isEventBookable = (event, now = new Date()) => (
  event?.approvalStatus === "approved" && ["upcoming", "ongoing"].includes(getEventPhase(event, now))
);
