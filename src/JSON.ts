import { type Versioned } from "./Utils";

export type JSON =
  | null
  | string
  | number
  | boolean
  | { [x: string]: JSON }
  | Array<JSON>
  ;

// Typed JSON (tagged with phantom 'a)
export type TyJSON<a> = JSON

/* Parser combinators */

export type Parser<a> = (_: TyJSON<a>) => a

type Serializer<a> = (_: a) => TyJSON<a>

export function pNumber(obj: TyJSON<number>): number {
  if (typeof obj !== "number") {
    throw Error("pNumber: not a number");
  }
  return obj;
}

export function pTuple<T extends any[]>(
  parser: { [K in keyof T]: Parser<T[K]> }
): Parser<T> {
  return (obj: TyJSON<T>) => {
    if (!Array.isArray(obj)) {
      throw Error("pTuple: not an array");
    }
    if (obj.length !== parser.length) {
      throw Error("pTuple: mismatching lengths");
    }
    const ret: any[] = new Array(parser.length);
    for (let i = 0; i < parser.length; i++) {
      ret[i] = parser[i](
        obj[i]
      );
    }
    return ret as T;
  };
}

export function pArray<A>(parser: Parser<A>): Parser<A[]> {
  return (obj: JSON) => {
    if (!Array.isArray(obj)) {
      throw Error("pArray: not an array");
    }
    return obj.map(parser);
  }
}

export function pString(obj: TyJSON<string>): string {
  if (typeof obj === "string") {
    return obj;
  } else {
    throw Error("pString: not a string");
  }
}

export function pObject<T extends Record<string, any>>(
  parser: { [K in keyof T]: Parser<T[K]> }
): Parser<T> {
  return (obj: JSON) => {
    if (
      obj == null ||
      typeof obj !== 'object' ||
      Array.isArray(obj)
    ) {
      throw Error("pObject: not an object");
    }
    const ret: Partial<T> = {};
    let k: keyof T;
    for (k in parser) {
      let v = obj[k as string];
      if (v === undefined) v = null;
      ret[k] = parser[k](v);
    }
    return ret as T;
  }
}

// Versioned

export function pVersioned<A>(parser: Parser<A>): Parser<Versioned<A>> {
  return (obj: any) => ({content: parser(obj.content), timestamp: obj.timestamp});
}

export function sVersioned<A>(dumps: Serializer<A>): Serializer<Versioned<A>> {
  return (obj: Versioned<A>) =>
    ({content: dumps(obj.content), timestamp: obj.timestamp});
}

/* Local storage */

// Retrieve and parse an item from localStorage.
export function getItem<a>(key: string, parser: Parser<a>): a | null {
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

// Store a key-value pair in localStorage.
export function setItem(key: string, value: any): boolean {
  let previous = localStorage.getItem(key);
  let target = JSON.stringify(value);
  if (previous != target) {
    localStorage.setItem(key, target);
    return true;
  }
  return false;
}
