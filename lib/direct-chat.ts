import { createHash } from "node:crypto";

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function directThreadId(firstEmail: string, secondEmail: string) {
  const participants = [
    normalizeEmail(firstEmail),
    normalizeEmail(secondEmail),
  ]
    .sort()
    .join("|");

  return `dm-${createHash("sha256")
    .update(participants)
    .digest("hex")
    .slice(0, 48)}`;
}

export function nameFromEmail(email: string) {
  return (
    normalizeEmail(email)
      .split("@")[0]
      .split(/[._-]+/)
      .filter(Boolean)
      .map(
        (part) =>
          part.charAt(0).toUpperCase() + part.slice(1),
      )
      .join(" ") || "Influence User"
  );
}