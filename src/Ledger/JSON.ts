import { type WithTs } from "./Utils";

export type JSON =
  | null
  | string
  | number
  | boolean
  | { [x: string]: JSON }
  | Array<JSON>;

export type MyJSON<A> = JSON

type Parser<A> = (_: MyJSON<A>) => A

type Serializer<A> = (_: A) => MyJSON<A>

export function pNumber(obj: MyJSON<number>): number {
  if (typeof obj !== "number") {
    throw Error("pNumber: not a number");
  }
  return obj;
}

export function pTuple<T extends any[]>(
  parser: { [K in keyof T]: Parser<T[K]> }
): Parser<T> {
  return (obj: MyJSON<T>) => {
    if (!Array.isArray(obj)) {
      throw Error("pTuple: not an array");
    }
    if (obj.length !== parser.length) {
      throw Error("pTuple: mismatching lengths");
    }
    const ret: any[] = new Array(parser.length);
    for (let i = 0; i < parser.length; i++) {
      const result = parser[i](obj[i]);
      ret[i] = result;
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

export function pString(obj: MyJSON<string>): string {
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

// WithTs

export function pWithTs<A>(parser: Parser<A>): Parser<WithTs<A>> {
  return (obj: any) => ({content: parser(obj.content), timestamp: obj.timestamp});
}

export function sWithTs<A>(dumps: Serializer<A>): Serializer<WithTs<A>> {
  return (obj: WithTs<A>) =>
    ({content: dumps(obj.content), timestamp: obj.timestamp});
}
