import { type JSON } from "./JSON";

export type UserID = string;
export type UUID = string;

export function b64encode(data: Uint8Array): string {
  const binString = String.fromCodePoint(...data);
  return btoa(binString);
}

export function b64decode(data: string): Uint8Array {
  const binString = atob(data);
  return Uint8Array.from(binString, (m: string) => m.codePointAt(0) as any);
}

export function getItem<a>(key: string, parser: (_: JSON) => a | null): a | null {
  let l = localStorage.getItem(key);
  if (!l) return null;
  try {
    let lp = JSON.parse(l);
    return parser(lp);
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

/**
 * Enrich a type with a modification timestamp.
 */
export type WithTs<A> = { content: A, timestamp: number };

export function withTs<A>(content: A, timestamp?: number): WithTs<A> {
  if (timestamp === undefined) {
    timestamp = Date.now();
  }
  return {content, timestamp};
}

/**
 * Returns whether the set item has changed or not.
 */
export function setItem(key: string, value: any): boolean {
  let previous = localStorage.getItem(key);
  let target = JSON.stringify(value);
  if (previous != target) {
    localStorage.setItem(key, target);
    return true;
  }
  return false;
}

/**
 * Return the current device UUID.
 * If not initialised, generate and return a new UUID.
 */
export function getDeviceID(): string {
  const ls = localStorage.getItem("device-id");
  if (ls) return ls;
  const uuid: string = crypto.randomUUID();
  if (!uuid) {
    throw Error("getDeviceID: crypto.randomUUID");
  }
  localStorage.setItem("device-id", uuid);
  return uuid;
}

export function roomIdOfLegerId(data: UUID): Uint8Array {
  return new TextEncoder().encode(data);
}

export function round(n: number): string {
  return (+n).toFixed(2);
}

export function ts2iso(n: number): string {
  return new Date(n).toISOString().substring(0, 10);
}

/**
 * Origin of a change (either local or remote).
 * Used to track where a change originates from,
 * so to propagate it correctly
 * (e.g. propagate remotely a local change,
 * propagate locally a remote change).
 */
export enum Origin {
  /**
   * Change originated by local user (e.g. UI).
   */
  LOCAL,
  /**
   * Change originated by remote user and received
   * from the network.
   */
  REMOTE,
}; 