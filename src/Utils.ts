import { type JSON } from "./JSON";

export type UserID = string;
export type UUID = string;

/* Versioning */

export type Versioned<A> = { content: A, timestamp: number };

export function versioned<A>(content: A, timestamp?: number): Versioned<A> {
  if (timestamp === undefined) {
    timestamp = Date.now();
  }
  return { content, timestamp };
}

/* Base64 encoding/decoding */

export function b64encode(data: Uint8Array): string {
  const binString = String.fromCodePoint(...data);
  return btoa(binString);
}

export function b64decode(data: string): Uint8Array {
  const binString = atob(data);
  return Uint8Array.from(binString, (m: string) => m.codePointAt(0) as any);
}

export function getDeviceID(): string {
  const ls = localStorage.getItem("device-id");
  if (ls) return ls;
  const uuid: string = crypto.randomUUID();
  if (!uuid) {
    throw Error("getDeviceID: not a secure context?");
  }
  localStorage.setItem("device-id", uuid);
  return uuid;
}

export function getGroupChannelId(data: UUID): string {
  return b64encode(new TextEncoder().encode(data));
}

// Convert a timestamp to an ISO date string (YYYY-MM-DD).
export function ts2iso(n: number): string {
  return new Date(n).toISOString().substring(0, 10);
}

/**
 * Origin of a change (local or remote).
 * Used to track and propagate changes correctly.
 */
export const enum Origin {
  /**
   * Change made locally (e.g., via UI).
   */
  LOCAL,
  /**
   * Change received from a remote source.
   */
  REMOTE,
};
