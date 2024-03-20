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

export function getItem<a>(key: string, parser: (_: string) => a | null): a | null {
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

export function pArray<A>(parser: (_: any) => A): (obj: any) => A[] {
  return (obj: any) => {
    if (!Array.isArray(obj)) {
      throw Error("parseArray: not an array");
    }
    return obj.map(parser);
  }
}


export function pString(obj: any): string {
  if (typeof obj === "string") {
    return obj;
  } else {
    throw Error("assertString");
  }
}

/**
 * Enrich a type with a modification timestamp.
 */
export type WithTs<A> = { content: A, timestamp: number };

export function withTs<A>(content: A, timestamp?: number) {
  if (timestamp === undefined) {
    timestamp = Date.now();
  }
  return {content, timestamp};
}

export function pWithTs<A>(parser: (_: any) => A): (obj: any) => WithTs<A> {
  return (obj: any) => ({content: parser(obj.content), timestamp: obj.timestamp});
}

export function withTsJSON<A>(obj: WithTs<A>, dumps: (_: A) => MyJSON<A>): MyJSON<WithTs<A>> {
  return {content: dumps(obj.content), timestamp: obj.timestamp};
}

export type MyJSON<A> = any

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
 * If not initialise, generate and return a new UUID.
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

export enum Origin {
  LOCAL,
  REMOTE,
}; 