import { format, parseISO } from "date-fns";

export function fmtDate(d: string | Date) {
  const date = typeof d === "string" ? parseISO(d) : d;
  return format(date, "MMM d");
}
export function fmtDateLong(d: string | Date) {
  const date = typeof d === "string" ? parseISO(d) : d;
  return format(date, "EEE, MMM d");
}
export function fmtTime(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, "h:mm a");
}
export function fmtDateTime(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, "MMM d, h:mm a");
}
export function fmtRange(start: string, end: string) {
  return `${fmtDate(start)} – ${fmtDate(end)}`;
}

export const MEETING_TYPES = ["coffee","meal","walk","drinks","activity","flexible"] as const;
export const CONTACT_TYPES = ["wechat","whatsapp","email","phone","instagram","other"] as const;
export const VISIBILITY_OPTS = [
  { v: "private", label: "Private — nobody else sees it" },
  { v: "show_time_only", label: "Show time only — others see I'm busy" },
  { v: "show_people", label: "Show people — others see who" },
  { v: "show_details", label: "Show details — full visibility" },
] as const;
