// Guest identity persistence via localStorage. Guests have no auth account.
const KEY = "trip_guest_id";
const PROFILE_KEY = "trip_guest_profile";

export type GuestProfile = {
  id: string;
  name: string;
  contact_type: string;
  contact_value: string;
};

export function getGuestId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}

export function setGuestProfile(p: GuestProfile) {
  localStorage.setItem(KEY, p.id);
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

export function getGuestProfile(): GuestProfile | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(PROFILE_KEY);
  return v ? JSON.parse(v) : null;
}

export function clearGuest() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(PROFILE_KEY);
}

const UNLOCK_KEY_PREFIX = "trip_unlocked_";
export function setTripUnlocked(slug: string) {
  localStorage.setItem(UNLOCK_KEY_PREFIX + slug, "1");
}
export function isTripUnlocked(slug: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(UNLOCK_KEY_PREFIX + slug) === "1";
}
