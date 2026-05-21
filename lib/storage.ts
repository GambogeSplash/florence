"use client";

import { BusinessProfile, DEFAULT_PROFILE } from "./types";

const KEY = "florence.profile.v1";

export function loadProfile(): BusinessProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BusinessProfile;
  } catch {
    return null;
  }
}

export function saveProfile(p: BusinessProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function clearProfile() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function profileOrDefault(): BusinessProfile {
  return loadProfile() ?? DEFAULT_PROFILE;
}
